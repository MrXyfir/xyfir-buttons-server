const request = require('superagent');
const stripe = require('stripe');
const moment = require('moment');
const mysql = require('lib/mysql');

const config = require('config');

/**
 * Update's a user's subscription expiration date.
 * @param {number} subscription
 * @param {number} days
 * @returns {number}
 */
function setSubscription(subscription, days) {
  return moment().unix() > subscription
    ? moment().add(days, 'days').unix()
    : moment.unix(subscription).add(days, 'days').unix();
}

/**
 * Give user who referred buyer one week subscription for every month bought.
 * @param {object} db
 * @param {number} ref - User id
 * @param {number} days
 */
async function rewardReferrer(db, ref, days) {
  let sql = `
    SELECT subscription FROM users WHERE id = ?
  `,
  vars = [ref];

  const rows = await db.query(sql, vars);

  if (!rows.length) return;
  
  sql = `
    UPDATE users SET subscription = ? WHERE id = ?
  `,
  vars = [
    setSubscription(rows[0].subscription, days), ref
  ];

  await db.query(sql, vars);
}

/**
 * Notify xyAccounts of the purchase.
 * @param {string} aff - Affiliate promo code
 * @param {number} amount - The total amount of the purchase
 */
function rewardAffiliate(aff, amount) {
  return new Promise(resolve => {
    request
      .post(config.address.xacc + 'api/affiliate/purchase')
      .send({
        service: 16, serviceKey: config.keys.xacc,
        promoCode: aff, amount
      })
      .end((err, res) => resolve());
  });
}

/*
  POST api/users/account/purchase
  REQUIRED
    stripeToken: string, subscription: number
  RETURN
    { error: boolean, message?: string, subscription?: number }
  DESCRIPTION
    Add months to user's subscription after charging card via Stripe
*/
module.exports = async function(req, res) {

  let sql = `
    SELECT subscription, referral FROM users WHERE id = ?
  `,
  vars = [
    req.session.uid
  ],
  amount = [0, 100, 1000][req.body.subscription];

  const db = new mysql();

  try {
    if (!amount) throw 'Invalid subscription length';

    await db.getConnection();
    const rows = await db.query(sql, vars);

    if (!rows.length) throw 'Could not find account';

    const days = [0, 30, 365][req.body.subscription];
    const referral = JSON.parse(rows[0].referral);
    const subscription = setSubscription(rows[0].subscription, days);

    // Discount 10% off of first purchase
    if ((referral.referral || referral.affiliate) && !referral.hasMadePurchase) {
      referral.hasMadePurchase = true;
      amount -= amount * 0.10;
    }

    // Attempt to charge user via Stripe
    await new Promise((resolve, reject) => {
      stripe(config.keys.stripe).charges.create({
        amount, currency: 'usd', source: req.body.stripeToken,
        description: 'Ptorx - Premium Subscription'
      }, (err, charge) => {
        if (err) reject('Error processing your card. Please try again.');
        else resolve();
      });
    });

    // Update user's account
    sql = `
      UPDATE users SET subscription = ?, referral = ?
      WHERE id = ?
    `,
    vars = [
      subscription, JSON.stringify(referral),
      req.session.uid
    ];

    const result = await db.query(sql, vars);

    if (!result.affectedRows)
      throw 'An unknown error occured';
    else if (referral.referral)
      await rewardReferrer(db, referral.referral, Math.round(days / 30) * 7);
    else if (referral.affiliate)
      await rewardAffiliate(referral.affiliate, amount);
    
    db.release();
    req.session.subscription = subscription;
    res.json({ error: false, subscription });
  }
  catch (err) {
    db.release();
    res.json({ error: true, message: err });
  }

};