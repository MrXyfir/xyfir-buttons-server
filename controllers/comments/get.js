const getCreatorInfo = require('lib/users/get-creator-info');
const mysql = require('lib/mysql');

/*
  GET api/comments/:type/:id
  REQUIRED
    order: string
      'votes|created'
    direction: string
      'asc|desc'
  OPTIONAL
    lastId: number
  RETURN
    {
      comments: [{
        id: number, created: date-string, comment: string, votes: number,
        creator: {
          id: number, name: string, reputation: number
        }, 
      }]
    }
  DESCRIPTION
    Get comments for a target object
    Returns empty comments array on error
*/
module.exports = function(req, res) {

  if (
    !['votes', 'created'].includes(req.query.order)
    || !['asc', 'desc'].includes(req.query.direction)
  ) {
    res.json({ comments: [] });
    return;
  }

  const db = new mysql();

  db.getConnection()
    .then(() => {
      const sql = `
        SELECT
          id, user_id, created, comment, (
            SELECT SUM(vote) FROM votes
            WHERE target_id = ? AND target_type = ?
          ) AS votes
        FROM comments
        WHERE
          target_id = ? AND target_type = ? ${
            req.query.lastId
              ? `AND id ${
                  req.query.direction == 'asc' ? '<' : '>'
                } ${+req.query.lastId}`
              : ''
          }
        ORDER BY ${req.query.order} ${req.query.direction}
        LIMIT 25
      `,
      vars = [
        req.params.id, req.params.type,
        req.params.id, req.params.type
      ];

      return db.query(sql, vars);
    })
    .then(comments => {
      if (!comments.length) throw 'No comments found';

      return getCreatorInfo(db, comments);
    })
    .then(comments => {
      db.release();
      res.json({ comments });
    })
    .catch(err => {
      db.release();
      res.json({ comments: [] });
    });

};