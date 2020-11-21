const UserModel = require('../mysql/UserModel');
const bcrypt = require('bcryptjs');

const {
  rememberDays, 
  ckName, 
  loginField
} = require('../../config/auth');

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
   * Check user submitted credentials
   */
  authenticateUser: function(req, res, next) {
    // Match user
    UserModel.findOneActivePassw(req.body[loginField], loginField)
    .then((user) => {
      if (!user) {
        res.status(401).render('users/login', {
          loginField: loginField, 
          error_msg: 'Incorrect credentials.'
        });
        return false;
      }
      // Match password
      bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
        if (err) {
          res.status(500).render('users/login', {
            loginField: loginField, 
            error_msg: 'Authentication error.'
          });
          return false;
        }
        if (isMatch) {
          req.user = user;
          return next();
        } else {
          res.status(401).render('users/login', {
            loginField: loginField, 
            error_msg: 'Incorrect credentials.'
          });
          return false;
        }
      });
    })
    .catch(err => {
      res.render('users/login', {
        loginField: loginField, 
        error_msg: 'DB error'
      });
    });
  },

  /**
   * Check if the user is logged-in
   */
  ensureAuthenticated: function(req, res, next) {
    if (req.session.user && req.session.user.id) {
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
    if (req.session.user && req.session.user.id) {
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
          req.session.user = {id: user.id, name: user.name, 
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
