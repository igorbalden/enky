const express = require('express');
const router = express.Router();
const authConf = require('../config/auth');
const {ensureAuthenticated} = require('../services/passport/auth');

/**
 * Single pages
 */
router.get('/', (req, res) => res.render('welcome', 
  {rCooky: req.cookies[authConf.rememberCookieName]})
);
router.get('/about', ensureAuthenticated, (req, res) => res.render('about',
  {rCooky: req.cookies[authConf.rememberCookieName]})
);

/**
 * All other routes
 */
router.use('/users', require('./users.js'));
router.use('/password', require('./password.js'));

/**
 * Error Pages
 * 404
 */
router.get('*', (req, res) => res.render('errors/404', 
  {layout: "layouts/noNav", noPage: "Page does not exist."})
);

module.exports = router;
