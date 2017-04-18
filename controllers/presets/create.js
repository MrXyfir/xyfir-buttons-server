const validateAndBuild = require('lib/presets/validate-and-build');
const mysql = require('lib/mysql');

/*
  POST api/presets
  REQUIRED
    name: string, urlMatch: string
  OPTIONAL
    description: string, domains: string, isListed: boolean, key: boolean
  RETURN
    { error: boolean, message?: string, id?: number }
  DESCRIPTION
    Creates a preset
    If user is not logged in, the creator is anonymous
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
      preset.user_id = req.session.uid || 0;

      const sql = `INSERT INTO presets SET ?`;

      return db.query(sql, preset);
    })
    .then(result => {
      if (!result.insertId) throw 'Could not create preset';

      db.release();

      const response = { error: false, id: result.insertId };
      if (preset.modifier_key) response.modifierKey = preset.modifier_key;
      res.json(response);
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};