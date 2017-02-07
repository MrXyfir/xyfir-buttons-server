const deleteLinked = require('lib/items/delete-linked');
const mysql = require('lib/mysql');

/*
  DELETE api/comments/:comment
  RETURN
    { error: boolean, message?: string }
  DESCRIPTION
    Allow user to delete their comment
*/
module.exports = function(req, res) {

  const db = new mysql();

  db.getConnection()
    .then(() => {
      const sql = `
        DELETE FROM comments WHERE id = ? AND user_id = ?
      `,
      vars = [
        req.params.comment, req.session.uid
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      if (!result.affectedRows) {
        throw 'Could not delete comment';
      }
      else {
        res.json({ error: false });
        deleteLinked(db, 3, req.params.comment);
      }
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};