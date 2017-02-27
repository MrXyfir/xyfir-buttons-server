const mysql = require('lib/mysql');

/*
  GET api/users
  REQUIRED
    order: string
      'reputation|joined'
    direction: string
      'asc|desc'
  OPTIONAL
    search: string, lastId: number
  RETURN
    {
      error: boolean, message?: string, users?: [{
        id: number, name: string, joined: date-string,
        reputation: number
      }]
    }
  DESCRIPTION
    Return up to 25 matching users
*/
module.exports = function(req, res) {

  const q = req.query;

  // Validate sort values
  try {
    if (!['reputation', 'joined'].includes(q.order))
      throw 'Invalid order field value';
    else if (!['asc', 'desc'].includes(q.direction))
      throw 'Invalid order direction valid';
  }
  catch (e) {
    res.json({ error: true, message: e });
  }

  const db = new mysql();

  db.getConnection()
    .then(() => {
      const whereId = !!+q.lastId
        ? `AND id ${
            q.direction == 'asc' ? '<' : '>'
          } ${+q.lastId}`
        : '',
      sql = `
        SELECT
          id, display_name AS name, joined, reputation
        FROM users
        WHERE display_name LIKE ? ${whereId}
        ORDER BY
          ${q.order} ${q.direction}
        LIMIT 25
      `,
      vars = [
        '%' + (q.search || '') + '%'
      ];

      return db.query(sql, vars);
    })
    .then(users => {
      db.release();
      res.json({ error: false, users });
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};