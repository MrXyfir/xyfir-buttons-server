const decryptAccessToken = require('lib/users/decrypt-access-token');
const request = require('superagent');
const mysql = require('lib/mysql');

const config = require('config');

/*
  GET api/users/account
  REQUIRED
    token: string
  RETURN
    {
      loggedIn: boolean,
      name?: string, subscription?: number, uid?: number, referral?: {
        affiliate?: string, referral?: string,
        hasMadePurchase?: boolean
      }
    }
  DESCRIPTION
    Creates a new session using access token
    Return user's account data
*/
module.exports = function(req, res) {

  const db = new mysql();
  
  const isDev = config.environment.type == 'dev';
  const token = decryptAccessToken(req.query.token);

  db.getConnection()
    .then(() => {
      // User must provide access token if in production environment
      if (!req.query.token && !isDev)
        throw 'Access token required';
      if (!isDev && !token.user || !token.token)
        throw 'Invalid access token';

      // Get user's account info
      const sql = `
        SELECT
          xyfir_id, subscription, xad_id, referral, display_name AS name
        FROM users WHERE user_id = ?
      `,
      vars = [
        isDev ? 1 : token.user
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      db.release();

      // Validate the access token
      if (!isDev) {
        const url = config.addresses.xacc
          + 'api/service/16/'
          + `${config.keys.xacc}/${rows[0].xyfir_id}/${token.token}`;

        request
          .get(url)
          .end((err, xaccResult) => {
            if (err || xaccResult.body.error)
              throw 'Could not validate access token';

            req.session.uid = token.user,
            req.session.xadid = rows[0].xad_id,
            req.session.subscription = rows[0].subscription;

            res.json({
              loggedIn: true, uid: token.user, name: rows[0].name,
              subscription: rows[0].subscription,
              referral: JSON.parse(rows[0].referral)
            });
          });
      }
      // Set session and return data for development user
      else {
        req.session.uid = 1,
        req.session.xadid = rows[0].xad_id,
        req.session.subscription = rows[0].subscription;
        
        res.json({
          loggedIn: true, uid: 1, subscription: rows[0].subscription,
          referral: JSON.parse(rows[0].referral), name: rows[0].name
        });
      }
    })
    .catch(err => {
      db.release();

      req.session.uid = 0,
      req.session.xadid = '',
      req.session.subscription = 0;

      res.json({ loggedIn: false });
    });

};