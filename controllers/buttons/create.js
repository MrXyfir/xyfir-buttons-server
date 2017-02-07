const validateAndBuild = require('lib/buttons/validate-and-build');
const mysql = require('lib/mysql');

/*
  POST api/buttons
  REQUIRED
    name: string, uriMatch: string,
    script: string OR repository: string,
  OPTIONAL
    description: string, domains: string, isListed: boolean
  RETURN
    { error: boolean, message?: string, id?: number }
  DESCRIPTION
    Create a button
    If user is not logged in, the creator is anonymous
*/
module.exports = function(req, res) {

  const db = new mysql();
  let button = req.body;

  validateAndBuild(button)
    .then(b => {
      button = b;

      return db.getConnection();
    })
    .then(() => {
      button.user_id = req.session.uid || 0;

      const sql = `INSERT INTO buttons SET ?`;

      return db.query(sql, button);
    })
    .then(result => {
      if (!result.insertId) throw 'Could not create button';

      db.release();
      res.json({ error: false, id: result.insertId });
    })
    .catch(err => {
      db.release();
      res.json({ error: true, message: err });
    });

};