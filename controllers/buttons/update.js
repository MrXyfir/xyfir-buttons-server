const markPresetsUpdated = require('lib/presets/mark-updated');
const validateAndBuild = require('lib/buttons/validate-and-build');
const mysql = require('lib/mysql');

/*
  PUT api/buttons/:button
  REQUIRED
    name: string, uriMatch: string,
    script: string OR repository: string,
  OPTIONAL
    description: string, domains: string, isListed: boolean
  RETURN
    { error: boolean, message?: string }
  DESCRIPTION
    Update an existing button
    Buttons created by anonymous users cannot be updated
    Updates the `updated` column for the button and any presets it is linked to
*/
module.exports = function(req, res) {

  const db = new mysql();
  let sql = '', vars = [], button = req.body;

  validateAndBuild(button)
    .then(b => {
      button = b;

      return db.getConnection();
    })
    .then(() => {
      // Attempt the button if it exists and user owns it
      // Anonymously created buttons cannot be updated
      sql = `
        UPDATE buttons SET
          name = ?, description = ?, is_listed = ?, uri_match = ?,
          domains = ?, script = ?, updated = NOW(), repository = ?,
          tooltip = ?, styles = ?, icon = ?
        WHERE id = ? AND user_id = ?
      `,
      vars = [
        button.name, button.description, button.is_listed, button.uri_match,
        button.domains, button.script, button.repository,
        button.tooltip, button.styles, button.icon,
        req.params.button, req.session.uid
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      if (!result.affectedRows) throw 'Could not update button';

      // Grab ids for presets that use the button
      sql = `
        SELECT preset_id FROM preset_buttons WHERE button_id = ?
      `,
      vars = [
        req.params.button
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      res.json({ error: false });

      // Mark presets with button linked as updated if needed
      if (!rows.length)
        db.release();
      else
        markPresetsUpdated(db, rows.map(r => r.preset_id));
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};