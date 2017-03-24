/**
 * Delete items (comments, votes, download reports) linked to another item
 * (preset, button, comment). Used for linked items that do not have a foreign
 * key constraint and will not be automatically deleted.
 * @module
 * @param {object} db - A connected instance of MySQL.
 * @param {number} type - The type of item that the id points to.
 * @param {number} id - An id for a preset, button, comment.
 * @param {boolean} [release=true] - Determines if db should be released
 * after the function has run.
 * @returns {Promise} A promise that always resolves. Can be ignored if release
 * argument is set to true.
 */
module.exports = function(db, type, id, release = true) {

  return new Promise(resolve => {
    const sql =
      t => `DELETE FROM ${t} WHERE target_id = ? AND target_type = ?`,
    vars = [id, type];

    // Delete comments linked to target
    db.query(sql('comments'), vars)
      .then(result => {
        // Delete votes linked to target
        return db.query(sql('votes'), vars);
      })
      .then(result => {
        // Delete download reports linked to target
        return db.query(sql('downloads'), vars);
      })
      .then(result => {
        if (release) db.release();
        resolve();
      })
      .catch(err => {
        if (release) db.release();
        resolve();
      });
  });

};