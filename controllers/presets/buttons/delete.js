const markPresetUpdated = require('lib/presets/mark-updated');
const mysql = require('lib/mysql');

/*
  DELETE api/presets/:preset/buttons/:button
  OPTIONAL
    modKey: string
  RETURN
    { error: boolean, message?: string }
  DESCRIPTION
    Delete a button from user's preset
*/
module.exports = function(req, res) {

  const db = new mysql();

  db.getConnection()
    .then(() => {
      const sql = `
        DELETE FROM preset_buttons
        WHERE
          button_id = ? AND preset_id IN (
            SELECT id FROM presets
            WHERE id = ? AND (user_id = ? OR mod_key = ?)
          )
      `,
      vars = [
        req.params.button,
        req.params.preset, req.session.uid || -1, req.body.modKey || '-'
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      if (!result.affectedRows) {
        throw 'Could not delete button from preset';
      }
      else {
        res.json({ error: false });
        markPresetUpdated(db, req.params.preset);
      }
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};