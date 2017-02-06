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
      users: [{
        id: number, name: string, joined: date-string,
        reputation: number
      }]
    }
  DESCRIPTION
    Return up to 50 matching users
*/
module.exports = function(req, res) {

  // Validate sort values
  if (!['reputation', 'joined'].includes(q.order)) {
    res.json({ users: [] });
    return;
  }
  else if (!['asc', 'desc'].includes(q.direction)) {
    res.json({ users: [] });
    return;
  }

  const db = new mysql(), q = req.query;

  db.getConnection()
    .then(() => {
      const whereId = q.lastId
        ? `AND id ${
            q.direction == 'asc' ? '<' : '>'
          } ${+q.lastId}`
        : '',
      sql = `
        SELECT
          id, display_name AS name, joined, reputation
        FROM users
        WHERE name LIKE ? ${whereId}
        ORDER BY
          ${q.order} ${q.direction}
        LIMIT 51
      `,
      vars = [
        '%' + (q.search || '') + '%'
      ];

      return db.query(sql, vars);
    })
    .then(users => {
      db.release();
      res.json({ users });
    })
    .catch(err => {
      db.release();
      res.json({ users: [] });
    });

};