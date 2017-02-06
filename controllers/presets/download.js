const mysql = require('lib/mysql');

/*
  GET api/presets/download
  REQUIRED
    presets: json-string
      '[{id: number, version: date-string}]'
  RETURN
    {
      presets: [{
        id: number, creator: number, name: string, description: string,
        isListed: boolean, uriMatch: string, domains: string,
        created: date-string, updated: date-string,
        buttons: [{
          id: number, size: number, position: string, modifications: object
        }]
      }]
    }
  DESCRIPTION
    Download presets with a newer version than provided
    Returns empty array on error
*/
module.exports = function(req, res) {

  const presets = JSON.parse(req.query.presets || '[]');

  if (!presets.length) {
    res.json({ presets: [] });
    return;
  }

  const db = new mysql();
  let sql = '', vars = [], response = { presets: [] }, downloads = [];

  db.getConnection()
    .then(() => {
      // Get updated column for all requested presets
      sql = `
        SELECT id, updated FROM presets id IN (?)
      `,
      vars = [
        presets.map(b => b.id)
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      if (!rows.length) throw 'No presets found';

      // Find presets that need to be updated
      downloads = rows.map(p1 => {
        const shouldDownload = presets.findIndex(
          p2 => p2.id == p1.id && p2.updated != p1.updated
        ) > -1;

        return shouldDownload ? p1.id : -1;
      }).filter(p => p > -1);

      // Get full data for presets being downloaded
      sql = `
        SELECT
          id, user_id AS creator, name, description, domains, created,
          is_listed AS isListed, uri_match AS uriMatch, updated
        FROM presets WHERE id IN (?)
      `,
      vars = [
        downloads
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      if (!rows.length) throw 'No presets found';

      response.presets = rows,
      downloads = rows.map(r => r.id);

      sql = `
        SELECT * FROM preset_buttons WHERE preset_id IN (?)
      `,
      vars = [
        downloads
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      // Add buttons to response.presets[i].buttons
      // Parse response.presets[i].buttons[i].modifications
      rows.forEach(r => {
        for (let i; i < response.presets.length; i++) {
          if (r.preset_id == preset.id) {
            r.modifications = JSON.parse(r.modifications);
            response.presets[i].buttons.push(r);
            break;
          }
        }
      });

      // Increment each preset's downloads for the day
      sql = `
        INSERT INTO downloads
          (target_type, target_id, day, downloads)
        VALUES ${
          downloads.map(p =>
            `('2', '${p.id}', CUR_DATE(), '1')`
          ).join(', ')
        }
        ON DUPLICATE KEY UPDATE downloads = downloads + 1
      `;

      return db.query(sql);
    })
    .then(result => {
      db.release();
      res.json(response)
    })
    .catch(err => {
      db.release();
      res.json({ presets: [] });
    });

};