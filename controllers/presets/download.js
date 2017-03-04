const mysql = require('lib/mysql');

/*
  GET api/presets/download
  REQUIRED
    presets: json-string
      '[{id: number, updated: date-string}]'
  RETURN
    {
      error: boolean, message?: string, presets?: [{
        id: number, creator: number, name: string, description: string,
        isListed: boolean, urlMatch: string, domains: string,
        created: date-string, updated: date-string,
        buttons: [{
          id: number, size: string, position: string, styles: string
        }]
      }]
    }
  DESCRIPTION
    Download presets with a newer version than provided
*/
module.exports = function(req, res) {

  let presets = [];
  
  try {
    presets = JSON.parse(req.query.presets || '[]');

    if (!Array.isArray(presets) || !presets.length)
      throw 'Invalid or empty presets array';
  }
  catch (e) {
    res.json({ error: false, message: e });
    return;
  }

  const db = new mysql();
  let sql = '', vars = [], response = { presets: [] }, downloads = [];

  db.getConnection()
    .then(() => {
      // Get updated column for all requested presets
      sql = `
        SELECT id, updated FROM presets WHERE id IN (?)
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

      if (!downloads.length) throw 'No presets to update';

      // Get full data for presets being downloaded
      sql = `
        SELECT
          id, user_id AS creator, name, description, domains, created,
          is_listed AS isListed, url_match AS urlMatch, updated
        FROM presets WHERE id IN (?)
      `,
      vars = [
        downloads
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      if (!rows.length) throw 'No presets found';

      downloads = rows.map(r => r.id),
      response.presets = rows,
      response.presets = response.presets.map(p => {
        p.buttons = [];
        return p;
      });

      sql = `
        SELECT
          preset_id, button_id AS id, size, position, styles
        FROM preset_buttons WHERE preset_id IN (?)
      `,
      vars = [
        downloads
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      // Add buttons to response.presets[i].buttons
      rows.forEach(r => {
        for (let i = 0; i < response.presets.length; i++) {
          if (r.preset_id == response.presets[i].id) {
            delete r.preset_id;
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
          downloads.map(id =>
            `('2', '${id}', CURDATE(), '1')`
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
      res.json({ error: false, message: err });
    });

};