const deleteLinkedItems = require('lib/items/delete-linked');
const mysql = require('lib/mysql');

/*
  DELETE api/presets/:preset
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
        DELETE FROM presets WHERE id = ? AND user_id = ?
      `,
      vars = [
        req.params.preset, req.session.uid
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      if (!result.affectedRows) throw 'Could not delete preset';

      db.release();
      res.json({ error: false });
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};