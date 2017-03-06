const router = require('express').Router();

/* USERS */
router.get(
  '/users', require('./users/get-matching')
);
router.get(
  '/users/account', require('./users/account/get')
);
router.put(
  '/users/account', require('./users/account/update')
)
router.post(
  '/users/account/purchase', require('./users/account/purchase')
)
router.post(
  '/users/login', require('./users/login')
);
router.get(
  '/users/:user', require('./users/get-single')
);

/* BUTTONS */
router.get(
  '/buttons', require('./buttons/get-matching')
);
router.post(
  '/buttons', require('./buttons/create')
);
router.get(
  '/buttons/download', require('./buttons/download')
);

/* BUTTON */
router.get(
  '/buttons/:button', require('./buttons/get-single')
);
router.put(
  '/buttons/:button', require('./buttons/update')
);
router.delete(
  '/buttons/:button', require('./buttons/delete')
);
router.post(
  '/buttons/:button/fork', require('./buttons/fork')
);
router.get(
  '/buttons/:button/script', require('./buttons/get-script')
);

/* PRESETS */
router.get(
  '/presets', require('./presets/get-matching')
);
router.post(
  '/presets', require('./presets/create')
);
router.get(
  '/presets/download', require('./presets/download')
);

/* PRESET */
router.get(
  '/presets/:preset', require('./presets/get-single')
);
router.put(
  '/presets/:preset', require('./presets/update')
);
router.delete(
  '/presets/:preset', require('./presets/delete')
);
router.post(
  '/presets/:preset/fork', require('./presets/fork')
);

/* PRESET BUTTONS */
router.post(
  '/presets/:preset/buttons/:button', require('./presets/buttons/add')
);
router.put(
  '/presets/:preset/buttons/:button', require('./presets/buttons/edit')
);
router.delete(
  '/presets/:preset/buttons/:button', require('./presets/buttons/delete'
));

/* COMMENTS */
router.get(
  '/comments/:type/:id', require('./comments/get')
);
router.post(
  '/comments/:type/:id', require('./comments/create')
);
router.put(
  '/comments/:comment', require('./comments/edit')
);
router.delete(
  '/comments/:comment', require('./comments/delete')
);

/* VOTES */
router.post(
  '/votes/:type/:id', require('./votes/vote')
);

module.exports = router;