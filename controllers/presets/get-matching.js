const mysql = require('lib/mysql');

/*
  GET api/presets
  REQUIRED
    order: string
      'downloads|created|updated'
    direction: string
      'asc|desc'
  OPTIONAL
    searchType: string
      'name|uri|site|user'
    searchQuery: string
    lastId: number
  RETURN
    {
      presets: [{
        id: number, name: string, description: string, uriMatch: string,
        created: date-string, updated: date-string, downloads: number,
        domains: string
      }]
    }
  DESCRIPTION
    Provides basic information for matching presets
    Returns empty array on error
*/
module.exports = function(req, res) {

  const q = req.query;

  try {
    // Validate values
    if (!['downloads', 'created', 'updated'].includes(q.order))
      throw 'Invalid `order` value';
    if (!['asc', 'desc'].includes(q.direction))
      throw 'Invalid `direction` value';
  }
  catch (e) {
    res.json({ presets: [] });
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
            WHERE target_id = presets.id AND target_type = 2
          ) AS downloads
        FROM presets
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
    .then(presets => {
      if (!presets.length) throw 'No presets found';

      db.release();
      res.json({ presets });
    })
    .catch(err => {
      db.release();
      res.json({ presets: [] });
    });

};