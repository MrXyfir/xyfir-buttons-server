/**
 * A module that accepts an array of objects that contain `id` properties.
 * @module lib/items/get-votes
 * @param {object} db - A connected instance of MySQL
 * @param {object[]} objects - An array of objects that have an `id` property.
 * @param {number} type - Used for `target_type`.
 * @returns {object[]} A modified version of the objects variable that was
 * passed as argument. The objects in the objects array have a `votes` property
 * added.
 */
module.exports = async function(db, objects, type) {

  const sql = `
    SELECT SUM(vote) AS votes, target_id AS id
    FROM votes WHERE target_type = ? AND target_id IN(?)
    GROUP BY target_id
  `,
  vars = [
    type, objects.map(o => o.id)
  ];

  const rows = await db.query(sql, vars);

  return objects.map(obj => {
    const row = rows.find(r => obj.id == r.id);

    if (row)
      return Object.assign(obj, row);
    else
      return Object.assign(obj, { votes: 0 });
  });

}