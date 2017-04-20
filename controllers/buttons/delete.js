const markPresetsUpdated = require('lib/presets/mark-updated');
const deleteLinkedItems = require('lib/items/delete-linked');
const mysql = require('lib/mysql');

/*
  DELETE api/buttons/:button
  OPTIONAL
    modKey: string
  RETURN
    { error: boolean, message?: string }
  DESCRIPTION
    Delete a user's button
    Removes button from presets and updates the presets' `updated` column
    Deletes comments, votes, and download reports for the button
*/
module.exports = function(req, res) {

  const db = new mysql();
  let sql = '', vars = [], presets = [];

  db.getConnection()
    .then(() => {
      // Get the id of all presets that contain the button
      sql = `
        SELECT preset_id FROM preset_buttons WHERE button_id = ?
        GROUP BY preset_id
      `,
      vars = [
        req.params.button
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      presets = rows.map(r => p.preset_id);

      // Delete button if user owns it
      // This will also delete from preset_buttons table
      sql = `
        DELETE FROM buttons WHERE id = ? AND (user_id = ? OR mod_key = ?)
      `,
      vars = [
        req.params.button, req.session.uid || -1, req.body.modKey || '-'
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      if (!result.affectedRows) throw 'Could not delete button';

      return markPresetsUpdated(db, presets, true);
    })
    .then(result => {
      res.json({ error: false });
      deleteLinkedItems(db, 1, req.params.button);
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};