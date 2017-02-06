/**
 * Gives a user reputation points.
 * @module
 * @param {object} db - A connected instance of MySQL.
 * @param {number} user - Internal id for user to receive rep.
 * @param {number} rep - Reputation points to add to user's total rep.
 * @param {boolean} [promise=false] - Determines if a promise should be
 * returned. If false, nothing is returned and db is released.
 * @returns {Promise|undefined} 
 */
module.exports = function(db, user, rep, promise = false) {

  const sign = rep < 0 ? '-' : '+';
  rep = rep < 0 ? rep * -1 : rep;

  const sql = `
    UPDATE users SET reputation = reputation ${sign} ?
    WHERE id = ?
  `,
  vars = [
    rep,
    user
  ];

  if (promise) {
    return db.query(sql, vars);
  }
  else {
    db.query(sql, vars)
      .then(() => db.release())
      .catch(() => db.release());
  }

};