const express = require('express');
const router = express.Router();
const authConf = require('../config/auth');
const {ensureAuthenticated} = require('../services/auth/AuthMiddle');
const AuthHelpers = require('../helpers/AuthHelpers');

/**
 * Single pages
 */
router.get('/', (req, res) => res.render('welcome', 
  {rCooky: req.cookies[authConf.rememberCookieName]})
);

router.get('/more', ensureAuthenticated, (req, res) => res.render('more',
  {rCooky: req.cookies[authConf.rememberCookieName]})
);

/**
 * All other routes
 */
router.use('/users', require('./users.js'));
router.use('/password', require('./password.js'));

/**
 * Error Pages
 * 403, 404
 */
router.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)
  // CSRF token error
  res.status(403)
  AuthHelpers.logUserOut(req, res)
  .then(() => {
    req.flash('error_msg', 'Forbidden.');
    return res.redirect('/users/login');
  });
});

router.get('*', (req, res) => res.render('errors/404', 
  {layout: "layouts/noNav", noPage: "Page does not exist."})
);

module.exports = router;
