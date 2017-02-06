const mysql = require('lib/mysql');

/*
  GET api/buttons/download
  REQUIRED
    buttons: json-string
      '[{id: number, version: date-string}]'
  RETURN
    {
      buttons: [{
        id: number, creator: number, name: string, description: string,
        isListed: boolean, uriMatch: string, script: string,
        created: date-string, updated: date-string,
        domains: string
      }]
    }
  DESCRIPTION
    Download buttons with a newer version than provided
    Returns empty array on error
*/
module.exports = function(req, res) {

  const buttons = JSON.parse(req.query.buttons || '[]');

  if (!buttons.length) {
    res.json({ buttons: [] });
    return;
  }

  const db = new mysql();
  let sql = '', vars = [];

  db.getConnection()
    .then(() => {
      // Get updated column for all requested buttons
      sql = `
        SELECT id, updated FROM buttons WHERE id IN (?)
      `,
      vars = [
        buttons.map(b => b.id)
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      if (!rows.length) throw 'No buttons found';

      // Find buttons that need to be updated
      const downloads = rows.map(b1 => {
        const shouldDownload = buttons.findIndex(
          b2 => b2.id == b1.id && b2.updated != b1.updated
        ) > -1;

        return shouldDownload ? b1.id : -1;
      }).filter(b => b > -1);

      // Get full data for buttons being downloaded
      sql = `
        SELECT
          id, user_id AS creator, description, domains, script, created,
          is_listed AS isListed, uri_match AS uriMatch, updated
        FROM buttons WHERE id IN (?)
      `,
      vars = [
        downloads
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      if (!rows.length) throw 'No buttons found';

      res.json({ buttons: rows });

      // Increment each button's downloads for the day
      sql = `
        INSERT INTO downloads
          (target_type, target_id, day, downloads)
        VALUES ${
          rows.map(r =>
            `('1', '${r.id}', CUR_DATE(), '1')`
          ).join(', ')
        }
        ON DUPLICATE KEY UPDATE downloads = downloads + 1
      `;

      return db.query(sql);
    })
    .then(result => {
      db.release();
    })
    .catch(err => {
      db.release();
      res.json({ buttons: [] });
    });

};