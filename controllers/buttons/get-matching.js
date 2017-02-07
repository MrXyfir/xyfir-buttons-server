const mysql = require('lib/mysql');

/*
  GET api/buttons
  REQUIRED
    order: string
      'downloads|created|updated'
    direction: string
      'asc|desc'
  OPTIONAL
    searchType: string
      'name|uri|site|user|preset'
    searchQuery: string
    lastId: number
  RETURN
    {
      buttons: [{
        id: number, name: string, description: string, uriMatch: string,
        created: date-string, updated: date-string, domains: string,
        downloads: null|number
      }]
    }
  DESCRIPTION
    Provides basic information for matching buttons
    Returns empty array on error
*/
module.exports = function(req, res) {

  const q = req.query;

  try {
    // Validate values
    if (!['downloads', 'created', 'updated'].includes(q.order))
      throw 'Invalid order by value';
    if (!['asc', 'desc'].includes(q.direction))
      throw 'Invalid order direction value';
  }
  catch (e) {
    res.json({ buttons: [] });
    return;
  }

  const db = new mysql();

  db.getConnection()
    .then(() => {
      let whereSearch = '', wrap = false;

      // Build portion of query to handle search
      if (q.searchType && q.searchQuery) {
        whereSearch = 'AND ';

        switch (q.searchType) {
          case 'name':
            whereSearch += 'name LIKE ?',
            wrap = true;
            break;
          case 'uri':
            whereSearch += '? REGEXP uri_match';
            break;
          case 'site':
            whereSearch += `(domains LIKE ? OR domains = '*')`,
            wrap = true;
            break;
          case 'user':
            whereSearch += 'user_id = ?';
            break;
          case 'preset':
            whereSearch += `id IN (
              SELECT button_id FROM preset_buttons WHERE preset_id = ?
            )`; break;
          default:
            whereSearch = '';
        }
      }

      const whereId = q.lastId
        ? `AND id ${
            q.direction == 'asc' ? '<' : '>'
          } ${+q.lastId}`
        : '',
      sql = `
        SELECT
          id, name, description, uri_match AS uriMatch, created, updated,
          domains, (
            SELECT SUM(downloads) FROM downloads
            WHERE target_id = buttons.id AND target_type = 1
          ) AS downloads
        FROM buttons
        WHERE
          is_listed = 1 ${whereId} ${whereSearch}
        ORDER BY ${q.order} ${q.direction}
        LIMIT 25
      `,
      vars = [
        whereSearch ? (wrap ? ('%' + q.searchQuery + '%') : q.searchQuery) : ''
      ];

      return db.query(sql, vars);
    })
    .then(buttons => {
      if (!buttons.length) throw 'No buttons found';

      db.release();
      res.json({ buttons });
    })
    .catch(err => {
      db.release();
      res.json({ buttons: [] });
    });

};