const getCreatorInfo = require('lib/users/get-creator-info');
const mysql = require('lib/mysql');

/*
  GET api/buttons/:button
  RETURN
    {
      id: number, name: string, urlMatch: string, repository: string,
      isListed: boolean, description: string, domains: string,
      created: date-string, updated: date-string, creator: {
        id: number, name: string, reputation: number
      }
    }
  DESCRIPTION
    Returns the full data for a single button
    Id is -1 if button could not be found
*/
module.exports = function(req, res) {

  const db = new mysql();

  db.getConnection()
    .then(() => {
      const sql = `
        SELECT
          id, user_id, name, url_match AS urlMatch, repository, description,
          domains, is_listed AS isListed, created, updated
        FROM buttons WHERE id = ?
      `,
      vars = [
        req.params.button
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      if (!rows.length) throw 'Could not find button';

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