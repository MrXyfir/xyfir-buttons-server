const request = require('superagent');
const moment = require('moment');
const mysql = require('lib/mysql');

const config = require('config');

/**
 * Called on user registration. Validates signup referral or affiliate, awards
 * the referral, and awards user free subscription time.
 * @module
 * @param {number} uid - The user's internal id #
 * @param {number} [ref] - Another user's internal id # who referred user
 * @param {string} [aff] - An affiliate's promotional code from xyAccounts
 * @returns {Promise} A promise that always resolves to the user's current subscription
 * expiration date.
 */
module.exports = function(uid, ref, aff) {

  return new Promise(resolve => {
    // Another xyButtons user referred new user
    if (ref) {
      // User's subscription won't change from referral
      resolve(0);

      const db = new mysql();
      let sql = '', vars = [];

      db.getConnection()
        .then(() => {
          // Validate that user exists
          sql = `
            SELECT id FROM users WHERE id = ?
          `,
          vars = [
            ref
          ];

          return db.query(sql, vars);
        })
        .then(rows => {
          if (rows.length) {
            // Set user's referral object
            sql = `
              UPDATE users SET referral = ? WHERE id = ?
            `,
            vars = [
              JSON.stringify({referral: ref, hasMadePurchase: false}), uid
            ];

            return db.query(sql, vars);
          }
          else {
            db.release();
          }
        })
        .then(result => {
          db.release();
        })
        .catch(err => {
          db.release();
        });
    }
    // An affiliate from xyAccounts referred new user
    else if (aff) {
      insert.referral = JSON.stringify({
        affiliate: req.body.affiliate,
        hasMadePurchase: false
      });
        
      // Validate affiliate code
      request
        .post(config.address.xacc + 'api/affiliate/signup')
        .send({
          service: 16, serviceKey: config.keys.xacc, promoCode: aff
        })
        .end((err, result) => {
          if (err || result.body.error) {
            resolve(0);
          }
          else {
            const subscription = moment().add(7, 'days').unix();

            const db = new mysql();

            db.getConnection()
              .then(() => {
                // Give user a subscription
                const sql = `
                  UPDATE users SET subscription = ? WHERE id = ?
                `,
                vars = [
                  subscription, uid
                ];

                return db.query(sql, vars);
              })
              .then(result => {
                db.release();
                resolve(subscription);
              })
              .catch(err => {
                db.release();
                resolve(0);
              });
          }
        });
    }
    // New user was not referred by user or affiliate
    // New user does not receive subscription
    else {
      resolve(0);
    }
  });

};