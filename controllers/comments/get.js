const getCreatorInfo = require('lib/users/get-creator-info');
const getVotes = require('lib/items/get-votes');
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
module.exports = async function(req, res) {

  if (
    !['votes', 'created'].includes(req.query.order)
    || !['asc', 'desc'].includes(req.query.direction)
  ) {
    res.json({ comments: [] });
    return;
  }

  const db = new mysql();

  try {
    await db.getConnection();

    const sql = `
      SELECT
        id, user_id, created, comment
      FROM comments
      WHERE
        target_id = ? AND target_type = ? ${
          !!+req.query.lastId
            ? `AND id ${
                req.query.direction == 'asc' ? '<' : '>'
              } ${+req.query.lastId}`
            : ''
        }
      ${
        req.query.order != 'votes'
        ? `ORDER BY ${req.query.order} ${req.query.direction}` : ''
      }
      LIMIT 25
    `,
    vars = [
      req.params.id, req.params.type,
      req.params.id, req.params.type
    ];

    let comments = await db.query(sql, vars);

    if (!comments.length) throw 'No comments found';

    comments = await getCreatorInfo(db, comments);
    comments = await getVotes(db, comments, 3);

    db.release();

    if (req.query.order == 'votes') {
      comments = comments.sort((a, b) => a.votes - b.votes);

      if (req.query.direction == 'desc') comments.reverse();
    }

    res.json({ comments });
  }
  catch (err) {
    db.release();
    res.json({ comments: [] });
  }

};