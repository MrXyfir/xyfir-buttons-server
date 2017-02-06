const mysql = require('lib/mysql');

/*
  GET api/buttons/:button/script
  RETURN
    {
      error: boolean, message?: string, script?: { [file]: string }
    }
  DESCRIPTION
    Returns a button's script, should only be used for the interface
*/
module.exports = function(req, res) {

  const db = new mysql();

  db.getConnection()
    .then(() => {
      const sql = `
        SELECT script FROM buttons WHERE id = ?
      `,
      vars = [
        req.params.button
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      if (!rows.length) throw 'Could not find button';
      
      db.release();
      res.json({ error: false, script: JSON.parse(rows[0].script) });
    })
    .catch(err => {
      db.release();
      res.json({ error: false, message: err });
    });

};