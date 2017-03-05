const mysql = require('lib/mysql');

/*
  POST api/comments/:type/:id
  REQUIRED
    comment: string
  RETURN
    { error: boolean, message?: string, id?: number }
  DESCRIPTION
    Allow user to comment on target object
    Accepted targets: button, preset, user profile
*/
module.exports = function(req, res) {

  const table = [
    '', 'buttons', 'presets', '', 'users'
  ][+req.params.type];

  try {
    if (!table || !req.body.comment)
      throw 'Invalid input';
    if (!req.session.uid)
      throw 'You must be logged in to post comments';
  }
  catch (e) {
    res.json({ error: true, message: e });
    return;
  }

  const db = new mysql();
  let sql = '', vars = [];

  db.getConnection()
    .then(() => {
      sql = `
        SELECT id FROM ${table} WHERE id = ?
      `,
      vars = [
        req.params.id
      ];

      return db.query(sql, vars);
    })
    .then(rows => {
      if (!rows.length) throw 'Could not find target';

      sql = `
        INSERT INTO comments
          (target_type, target_id, user_id, comment)
          VALUES (?, ?, ?, ?)
      `,
      vars = [
        req.params.type, req.params.id, req.session.uid, req.body.comment
      ];

      return db.query(sql, vars);
    })
    .then(result => {
      db.release();

      if (!result.insertId)
        throw 'Could not create comment';
      else
        res.json({ error: false, id: result.insertId });
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};