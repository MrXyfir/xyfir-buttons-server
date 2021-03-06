/**
 * A module that accepts an array of objects that contain `user_id` properties
 * that are then converted to `creator` property objects with the creator's
 * information inside.
 * @module
 * @param {object} db - A connected instance of MySQL
 * @param {object[]} objects - An array of objects that have a `user_id` property
 * @returns {Promise} A promise that always resolves to a modified version of
 * the objects variable that was passed as argument. The objects in the objects
 * array have `user_id` replaced with `creator` objects. On error or when a
 * user is not found the `creator` object property is empty.
 */
module.exports = function(db, objects) {

  return new Promise(async (resolve) => {
    const sql = `
      SELECT
        id, display_name AS name, reputation, 
        subscription > UNIX_TIMESTAMP() AS isPremium,
        (0 < id AND 11 > id) AS isAdmin, (10 < id AND 1001 > id) AS isModerator
      FROM users WHERE id IN (?)
    `,
    vars = [
      Array.from(new Set(
        objects.map(obj => obj.user_id)
      ))
    ];

    try {
      const users = await db.query(sql, vars);

      objects = objects.map(obj => {
        const user = users.find(u => u.id == obj.user_id);
        
        delete obj.user_id;
        obj.creator = user || {};

        return obj;
      });
    }
    catch (err) {
      objects = objects.map(obj => {
        delete obj.user_id;
        obj.creator = {};

        return obj;
      });
    }

    resolve(objects);
  });

}