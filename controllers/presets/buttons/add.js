const markPresetUpdated = require('lib/presets/mark-updated');
const mysql = require('lib/mysql');

/*
  POST api/presets/:preset/buttons/:button
  REQUIRED
    size: string, position: string, styles: string
  RETURN
    { error: boolean, message?: string }
  DESCRIPTION
    Add button to to user's preset
*/
module.exports = function(req, res) {

  const db = new mysql();
  let sql = '', vars = [];

  db.getConnection()
    .then(() => {
      // Get data for validations
      sql = `
        SELECT (
          SELECT COUNT(id) FROM presets WHERE id = ? AND user_id = ?
        ) AS presetExists, (
          SELECT COUNT(id) FROM buttons WHERE id = ?
        ) AS buttonExists, (
          SELECT COUNT(preset_id) FROM preset_buttons
          WHERE preset_id = ? AND button_id = ?
        ) AS buttonInPreset
      `,
      vars = [
        req.params.preset, req.session.uid,
        req.params.button,
        req.params.preset, req.params.button
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      if (!rows[0].presetExists)
        throw 'Preset does not exist';
      else if (!rows[0].buttonExists)
        throw 'Button does not exist';
      else if (rows[0].buttonInPreset)
        throw 'Button already exists in preset';

      sql = `
        INSERT INTO preset_buttons SET ?
      `,
      vars = {
        preset_id: req.params.preset, button_id: req.params.button,
        size: req.body.size, position: req.body.position,
        styles: (req.body.styles || '{}')
      };

      return db.query(sql, vars);
    })
    .then(result => {
      if (!result.affectedRows) {
        throw 'Could not add button to preset';
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