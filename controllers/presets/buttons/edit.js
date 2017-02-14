const markPresetUpdated = require('lib/presets/mark-updated');
const mysql = require('lib/mysql');

/*
  PUT api/presets/:preset/buttons/:button
  REQUIRED
    size: string, position: string, styles: json-string
  RETURN
    { error: boolean, message?: string }
  DESCRIPTION
    Update a button in user's preset
*/
module.exports = function(req, res) {

  const db = new mysql();

  db.getConnection()
    .then(() => {
      // Update button in preset if user owns preset
      // and row exists in preset_buttons
      const sql = `
        UPDATE preset_buttons SET
          size = ?, position = ?, styles = ?
        WHERE
          button_id = ? AND preset_id IN (
            SELECT id FROM presets WHERE id = ? AND user_id = ?
          )
      `,
      vars = [
        req.body.size, req.body.position, (req.body.styles || '{}'),
        req.params.button,
        req.params.preset, req.session.uid
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      if (!result.affectedRows) {
        throw 'Could not update button in preset';
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