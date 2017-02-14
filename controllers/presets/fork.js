const mysql = require('lib/mysql');

/*
  POST api/presets/:preset/fork
  RETURN
    { error: boolean, message?: string, id?: number }
  DESCRIPTION
    Creates a copy of the preset under requesting user
    Buttons in preset are also forked but their creators remain unchanged
*/
module.exports = function(req, res) {

  const db = new mysql();
  let id = 0, sql = '', vars = [];

  db.getConnection()
    .then(() => {
      // Copy row in presets table
      sql = `
        INSERT INTO presets
          (user_id, name, description, is_listed, uri_match, domains)
          SELECT
            ?, name, description, is_listed, uri_match, domains
          FROM presets
          WHERE id = ?
      `,
      vars = [
        req.session.uid,
        req.params.preset
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      if (!result.insertId) throw 'Could not fork preset';

      id = result.insertId,
      // Copy rows in preset_buttons table
      sql = `
        INSERT INTO preset_buttons
          (preset_id, button_id, size, position, styles)
          SELECT
            ?, button_id, size, position, styles
          FROM preset_buttons
          WHERE preset_id = ?
      `,
      vars = [
        id,
        req.params.preset
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      db.release();
      res.json({ error: false, id });
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};