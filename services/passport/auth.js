const UserModel = require('../mysql/UserModel');
const bcrypt = require('bcryptjs');

const authConf = require('../../config/auth');
const rememberDays = authConf.rememberCookieDays * 24 * 60 * 60 * 1000;
const ckName = authConf.rememberCookieName;

/**
 * Check if 'remember me' cookie is valid
 */
const cookieCheck = (req, res) => {
  return new Promise((resolve, reject) => {
    if (typeof req.cookies == 'undefined' ||
        typeof req.cookies[ckName] == 'undefined')
    {  
      return resolve(null);
    }
    const uuid = req.cookies[ckName].slice(0,36);
    const token = req.cookies[ckName].slice(36);
    UserModel.findActiveByUuid(uuid)
    .then((user) => {
      if (user) {
        bcrypt.compare(token, user.remember_me)
        .then(
          (result) => {
            if (result === true) {
              resolve(user);
            }
            res.clearCookie(ckName, '1', { httpOnly: true });
            resolve(null);
        });
      } else {
        // Admin has turn user inactive
        return reject("No user");
      }
    });
  });
};

module.exports = {
  /**
   * Check if the user is logged-in
   */
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      res.clearCookie('goingTo', '1');
      return next();
    }
    var goingTo = (req.originalUrl !== '/users/login') 
      ? req.originalUrl : req.cookies['goingTo'];
    res.cookie('goingTo', goingTo);
    req.flash('error_msg', 'Please log in to access this resource');
    res.redirect('/users/login');
  },

  /**
   * If user has logged-in 
   * or has a valid 'remember me' cookie
   * forward him to destination
   */
  forwardAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      res.redirect(req.cookies['goingTo'] || 'dashboard');
    } else {
      cookieCheck(req, res)
      .then((user) => {
        if (user.id) {
          // Renew Remember cookie
          const ckOptions = {
            expires: new Date(Date.now() + rememberDays), 
            httpOnly: true 
          };
          res.cookie(ckName, req.cookies[ckName], ckOptions);
          // Log the user in
          req.session.passport = {user: user.id};
          req.session.user = {name: user.name, 
            email: user.email, is_admin: user.is_admin};
          res.redirect(req.cookies['goingTo'] || 'dashboard');
        } else {
          return next();
        }
      })
      .catch(() => {
        console.log("No 'remember me' cookie.")
        return next();
      });
    }
  }

};
