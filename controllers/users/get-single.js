const mysql = require('lib/mysql');

/*
  GET api/users/:user
  REQUIRED
  RETURN
    {
      id: number, name: string, joined: date-string, reputation: number,
      buttons: number, presets: number
    }
  DESCRIPTION
    Return user's public information
    Id is -1 if user not found
*/
module.exports = function(req, res) {

  const db = new mysql();

  db.getConnection()
    .then(() => {
      const sql = `
        SELECT
          id, display_name AS name, joined, reputation, (
            SELECT COUNT(id) FROM buttons WHERE user_id = ?
          ) AS buttons, (
            SELECT COUNT(id) FROM presets WHERE user_id = ?
          ) AS presets
        FROM users
        WHERE id = ?
      `,
      vars = Array(3).fill(req.params.user);

      return db.query(sql, vars);
    })
    .then(rows => {
      if (!rows.length) throw 'User does not exist';

      db.release();
      res.json(rows[0]);
    })
    .catch(err => {
      db.release();
      res.json({ id: -1 });
    });

};