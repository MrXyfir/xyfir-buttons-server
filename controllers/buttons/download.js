const mysql = require('lib/mysql');

/*
  GET api/buttons/download
  REQUIRED
    buttons: json-string
      '[{id: number, updated: date-string}]'
  RETURN
    {
      error: boolean, message?: string, buttons?: [{
        id: number, creator: number, name: string, description: string,
        isListed: boolean, urlMatch: string, script: json-string,
        created: date-string, updated: date-string, icon: string,
        domains: string, tooltip: string, styles: string
      }]
    }
  DESCRIPTION
    Download buttons with a newer version than provided
*/
module.exports = async function(req, res) {

  const db = new mysql();
  let buttons = [], sql = '', vars = [];
  
  try {
    buttons = JSON.parse(req.query.buttons || '[]');
    
    if (!Array.isArray(buttons) || !buttons.length)
      throw 'Invalid or empty buttons array';
    
    await db.getConnection();

    // Get updated column for all requested buttons
    sql = `
      SELECT id, updated FROM buttons WHERE id IN (?)
    `,
    vars = [
      buttons.map(b => b.id)
    ];

    let rows = await db.query(sql, vars);

    if (!rows.length) throw 'No buttons found';
      
    // Find buttons that need to be updated
    const downloads = rows.map(b1 => {
      const shouldDownload = buttons.findIndex(
        b2 => b2.id == b1.id && b2.updated != b1.updated
      ) > -1;

      return shouldDownload ? b1.id : -1;
    }).filter(b => b > -1);

    if (!downloads.length) {
      db.release();
      res.json({
        error: false, message: 'No buttons to update', buttons: []
      }); return;
    }

    // Get full data for buttons being downloaded
    sql = `
      SELECT
        id, name, user_id AS creator, description, domains, script, created,
        updated, is_listed AS isListed, url_match AS urlMatch, updated,
        repository, tooltip, styles, icon
      FROM buttons WHERE id IN (?)
    `,
    vars = [
      downloads
    ];

    rows = await db.query(sql, vars);

    if (!rows.length) throw 'No buttons found';

    res.json({ error: false, buttons: rows });

    // Increment each button's downloads for the day
    sql = `
      INSERT INTO downloads
        (target_type, target_id, day, downloads)
      VALUES ${
        rows.map(r =>
          `('1', '${r.id}', CURDATE(), '1')`
        ).join(', ')
      }
      ON DUPLICATE KEY UPDATE downloads = downloads + 1
    `;

    await db.query(sql);
    db.release();
  }
  catch (e) {
    res.json({ error: true, message: e });
    return;
  }

};