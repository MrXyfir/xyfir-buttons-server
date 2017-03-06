const mysql = require('lib/mysql');

/*
  PUT api/users/account
  REQUIRED
    name: string
  RETURN
    { error: boolean, message?: string }
  DESCRIPTION
    Updates a user's display name
*/
module.exports = async function(req, res) {

  const db = new mysql();

  try {
    if (!req.body.name || req.body.name.length > 20)
      throw 'Invalid name; limit 20 characters';
    else
      req.body.name = req.body.name.trim();

    await db.getConnection();

    let sql = `
      SELECT id FROM users WHERE display_name = ?
    `,
    vars = [
      req.body.name
    ];

    const rows = await db.query(sql, vars);

    if (rows.length) throw 'Name is already in use';

    sql = `
      UPDATE users SET display_name = ? WHERE id = ?
    `,
    vars = [
      req.body.name, req.session.uid
    ];

    const result = await db.query(sql, vars);
    db.release();

    if (!result.affectedRows) throw 'Could not update name';

    res.json({ error: false });
  }
  catch (err) {
    db.release();
    res.json({ error: true, message: err });
  }

};