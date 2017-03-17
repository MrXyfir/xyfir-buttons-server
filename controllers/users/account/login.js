const encryptAccessToken = require('lib/users/encrypt-access-token');
const signupWithReferral = require('lib/users/signup-with-referral');
const request = require('superagent');
const mysql = require('lib/mysql');
const rword = require('rword');

const config = require('config');

/*
  POST api/users/account/login
  REQUIRED
    xid: string, auth: string
  RETURN
    { error: boolean, message?: string, accessToken?: string }
  DESCRIPTION
    Register or login user
*/
module.exports = function(req, res) {

  const url = config.addresses.xacc
    + 'api/service/16'
    + '/' + config.keys.xacc
    + '/' + req.body.xid
    + '/' + req.body.auth;

  // Validate login info with xyAccounts
  request
    .get(url)
    .end((err, xaccResult) => {
      if (err || xaccResult.body.error) {
        res.json({ error: true, message: 'Could not validate login' });
        return;
      }

      const db = new mysql();
      let sql = '', vars = [], createAccount = false, user = {};

      db.getConnection()
        .then(() => {
          // Grab needed data for user's account
          sql = `
            SELECT id, subscription, xad_id
            FROM users WHERE xyfir_id = ?
          `,
          vars = [
            req.body.xid
          ];

          return db.query(sql, vars);
        })
        .then(rows => {
          // User doesn't exist; create account
          if (!rows.length) {
            sql = `
              INSERT INTO users (xyfir_id, email, xad_id, display_name)
              VALUES (?, ?, ?, ?)
            `,
            vars = [
              req.body.xid, xaccResult.body.email, xaccResult.body.xadid,
              rword.generateFromPool(2).join('')
            ],
            createAccount = true;

            return db.query(sql, vars);
          }
          // Update user's data to match xyAccounts
          else {
            sql = `
              UPDATE users SET email = ? WHERE id = ?
            `,
            vars = [
              xaccResult.body.email, rows[0].id
            ],
            user = rows[0];

            return db.query(sql, vars);
          }
        })
        .then(dbResult => {
          if (!dbResult.affectedRows) throw 'An unknown error occured';

          db.release();

          // Finish account creation process
          if (createAccount) {
            user = {
              id: dbResult.insertId, xad_id: xaccResult.body.xadid
            };

            return signupWithReferral(
              user.id, req.body.referral, req.body.affiliate
            );
          }
          // Go to next step
          else {
            return new Promise(resolve => resolve(user.subscription));
          }
        })
        .then(subscription => {
          user.subscription = subscription;

          req.session.uid = user.id;
          req.session.xadId = user.xad_id;
          req.session.subscription = user.subscription;

          res.json({
            error: false,
            accessToken: encryptAccessToken(
              user.id, xaccResult.body.accessToken
            )
          });
        })
        .catch(err => {
          db.release();
          res.json({ error: true, message: err });
        });
    });

};