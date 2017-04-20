const validateAndBuild = require('lib/presets/validate-and-build');
const mysql = require('lib/mysql');

/*
  PUT api/presets/:preset
  REQUIRED
    name: string, urlMatch: string
  OPTIONAL
    description: string, domains: string, isListed: boolean, modKey: string
  RETURN
    { error: boolean, message?: string }
  DESCRIPTION
    Update an existing preset
    presets created by anonymous users cannot be updated
    Updates the `updated` column for the preset
*/
module.exports = function(req, res) {

  const db = new mysql();
  let preset = req.body;

  validateAndBuild(preset)
    .then(p => {
      preset = p;

      return db.getConnection();
    })
    .then(() => {
      // Attempt the preset if it exists and user owns it
      // Anonymously created presets cannot be updated
      const sql = `
        UPDATE presets SET
          name = ?, description = ?, is_listed = ?, updated = NOW(),
          domains = ?, url_match = ?
        WHERE id = ? AND (user_id = ? OR mod_key = ?)
      `,
      vars = [
        preset.name, preset.description, preset.is_listed,
        preset.url_match, preset.domains,
        req.params.preset, req.session.uid || -1, preset.mod_key || '-'
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      if (!result.affectedRows) throw 'Could not update preset';

      db.release();
      res.json({ error: false });
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};