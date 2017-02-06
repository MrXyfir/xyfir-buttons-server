const mysql = require('lib/mysql');

/*
  PUT api/comments/:comment
  REQUIRED
    comment: string
  RETURN
    { error: boolean, message?: string }
  DESCRIPTION
    Allow user to edit their comment
*/
module.exports = function(req, res) {

  if (!req.body.comment) {
    res.json({ error: true, message: 'Invalid input' });
    return;
  }

  const db = new mysql();

  db.getConnection()
    .then(() => {
      const sql = `
        UPDATE comments SET comment = ?
        WHERE id = ? AND user_id = ?
      `,
      vars = [
        req.body.comment,
        req.params.comment, req.session.uid
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      db.release();

      if (!result.affectedRows)
        throw 'Could not edit comment';
      else
        res.json({ error: false });
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};