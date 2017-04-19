const deleteLinkedItems = require('lib/items/delete-linked');
const mysql = require('lib/mysql');

/*
  DELETE api/presets/:preset
  OPTIONAL
    modKey: string
  RETURN
    { error: boolean, message?: string }
  DESCRIPTION
    Delete a user's presets
    Deletes comments, votes, and download reports for the preset
*/
module.exports = function(req, res) {

  const db = new mysql();

  db.getConnection()
    .then(() => {
      // Delete preset if user owns it
      // This will also delete from preset_buttons table
      const sql = `
        DELETE FROM presets WHERE id = ? AND (user_id = ? OR mod_key = ?)
      `,
      vars = [
        req.params.preset, req.session.uid, req.body.modKey || '-'
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      if (!result.affectedRows) throw 'Could not delete preset';

      res.json({ error: false });
      deleteLinkedItems(db, 2, req.params.preset);
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};