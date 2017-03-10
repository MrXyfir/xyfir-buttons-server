const mysql = require('lib/mysql');

/*
  POST api/buttons/:button/fork
  RETURN
    { error: boolean, message?: string, id?: number }
  DESCRIPTION
    Creates a copy of the button under requesting user
*/
module.exports = function(req, res) {

  const db = new mysql();

  db.getConnection()
    .then(() => {
      const sql = `
        INSERT INTO buttons
          (
            user_id, name, description, is_listed, url_match, domains, tooltip,
            script, repository, styles, content
          )
          SELECT
            ?, name, description, is_listed, url_match, domains, tooltip,
            script, repository, styles, content
          FROM buttons
          WHERE id = ?
      `,
      vars = [
        req.session.uid,
        req.params.button
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      if (!result.insertId) throw 'Could not fork button';

      db.release();
      res.json({ error: false, id: result.insertId });
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};