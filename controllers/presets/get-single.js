const getCreatorInfo = require('lib/users/get-creator-info');
const mysql = require('lib/mysql');

/*
  GET api/presets/:preset
  RETURN
    {
      id: number, name: string, uriMatch: string, isListed: boolean,
      description: string, domains: string, created: date-string,
      updated: date-string, creator: {
        id: number, name: string, reputation: number
      }
    }
  DESCRIPTION
    Returns the full data for a single preset
    Id is -1 if preset could not be found
*/
module.exports = function(req, res) {

  const db = new mysql();

  db.getConnection()
    .then(() => {
      const sql = `
        SELECT
          id, user_id, name, uri_match AS uriMatch, description,
          domains, is_listed AS isListed, created, updated
        FROM presets WHERE id = ?
      `,
      vars = [
        req.params.preset
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      if (!rows.length) throw 'Could not find preset';

      return getCreatorInfo(db, rows);
    })
    .then(rows => {
      db.release();
      res.json(rows[0]);
    })
    .catch(err => {
      db.release();
      res.json({ id: -1 });
    });

};