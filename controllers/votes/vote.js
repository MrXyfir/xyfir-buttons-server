const giveRep = require('lib/users/give-rep');
const mysql = require('lib/mysql');

/*
  POST api/votes/:type/:id
  REQUIRED
    vote: number
      -1|0|1
  RETURN
    { error: boolean, message?: string }
  DESCRIPTION
    Allow user to vote, change vote, or delete vote for a target
    Accepted targets: button, preset, comment
*/
module.exports = function(req, res) {

  const table = [
    '', 'buttons', 'presets', 'comments'
  ][+req.params.type];

  if (!table || req.body.vote === undefined) {
    res.json({ error: true, message: 'Invalid input' });
    return;
  }

  const db = new mysql();
  let sql = '', vars = [], vote = {};

  db.getConnection()
    .then(() => {
      // Check if target object exists
      sql = `
        SELECT (
          SELECT user_id FROM ${table} WHERE id = ?
        ) AS targetOwner, (
          SELECT vote FROM votes
          WHERE target_id = ? AND target_type = ? AND user_id = ?
        ) AS existingVote
      `,
      vars = [
        req.params.id,
        req.params.id, req.params.type, req.session.uid
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      if (!vote.targetOwner) throw 'Could not find target';

      vote = rows[0];

      // Delete vote
      if (req.body.vote == 0) {
        sql = `
          DELETE FROM votes
          WHERE target_id = ? AND target_type = ? AND user_id = ?
        `,
        vars = [
          req.params.id, req.params.type, req.session.uid
        ];
      }
      // Create or change vote
      else {
        sql = `
          INSERT INTO
            votes (target_type, target_id, user_id, vote)
            VALUES (?, ?, ?, ?)
          }
          ON DUPLICATE KEY UPDATE vote = ?;
        `,
        vars = [
          req.params.type, req.params.id, req.session.uid, +req.body.vote,
          +req.body.vote
        ];
      }

      return db.query(sql, vars);
    })
    .then(result => {
      // Rows must be affected if user was inserting or updating vote
      if (!result.affectedRows && req.body.vote != 0) {
        throw 'An unknown error occured';
      }
      // Give target owner rep if owner is not current user
      else if (vote.targetOwner != req.session.uid) {
        res.json({ error: false });

        let rep = 0;

        // Delete rep for existing vote
        if (req.body.vote == 0 && vote.existingVote)
          rep = vote.existingVote * -1;
        // Set rep for vote for first time
        else if (+req.body.vote && !vote.existingVote)
          rep = +req.body.vote;
        // Change rep for vote
        else if (+req.body.vote && (vote.existingVote != req.body.vote))
          rep = req.body.vote == 1 ? 2 : -2

        giveRep(db, vote.targetOwner, rep);
      }
      else {
        db.release();
        res.json({ error: false })
      }
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};