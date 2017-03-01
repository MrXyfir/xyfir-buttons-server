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
      }, votes: number, downloads: number, comments: number
    }
  DESCRIPTION
    Returns the full data for a single button
    Id is -1 if button could not be found
*/
module.exports = async function(req, res) {

  const db = new mysql();

  try {
    await db.getConnection();

    const sql = `
      SELECT
        id, user_id, name, url_match AS urlMatch, repository, description,
        domains, is_listed AS isListed, created, updated, (
          SELECT SUM(vote) FROM votes WHERE target_id = ? AND target_type = 1
        ) AS votes, (
          SELECT SUM(downloads) FROM downloads
          WHERE target_id = ? AND target_type = 1
        ) AS downloads, (
          SELECT COUNT(id) FROM comments
          WHERE target_id = ? AND target_type = 1
        ) AS comments
      FROM buttons WHERE id = ?
    `,
    vars = new Array(4).fill(req.params.button);

    let rows = await db.query(sql, vars);

    if (!rows.length) throw 'Could not find button';

    rows = await getCreatorInfo(db, rows);

    db.release();
    res.json(rows[0]);
  }
  catch (err) {
    db.release();
    res.json({ id: -1 });
  }

};