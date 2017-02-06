/**
 * Sets `updated` column to the current time for single or multiple presets.
 * @module
 * @param {object} db - A connected instance of MySQL.
 * @param {number|number[]} presets - A single id or array of preset id's.
 * @param {boolean} [promise=false] - Determines if a promise should be
 * returned. If false, nothing is returned and db is released.
 * @returns {Promise|undefined} 
 */
module.exports = function(db, presets, promise = false) {

  const sql = `
    UPDATE presets SET updated = NOW() WHERE id IN (?)
  `,
  vars = [
    Array.isArray(presets) ? presets : [presets]
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