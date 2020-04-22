const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const UserModel = require('../services/mysql/UserModel');
const {ensureAuthenticated, forwardAuthenticated} = 
  require('../services/passport/auth');
const uuidv4 = require('uuid/v4');
const EnkySecurity = require('../services/security/EnkySecurity');
const {authLimiterMiddle} = require('../services/rateLimiter/rateLimiter');
const {check, validationResult} = require('express-validator');
const authConf = require('../config/auth');
const rememberDays = authConf.rememberCookieDays * 24 * 60 * 60 * 1000;
const ckName = authConf.rememberCookieName;
const AuthHelpers = require('../helpers/AuthHelpers');
const csrf = require('csurf');
const csrfProtection = csrf();

/**
 * Login Page
 */
router.get('/login', forwardAuthenticated, 
  (req, res) => res.render('users/login')
);

/**
 * Register Page
 */ 
router.get('/register', forwardAuthenticated, 
  (req, res) => res.render('users/register')
);

/**
 * Dashboard Page
 */
router.get('/dashboard', ensureAuthenticated, csrfProtection, (req, res) => {
  UserModel.getAllAdmin(req, res)
  .then((result) => {
    if (req.session.user.is_admin) {
      return res.render('users/dashboardAdm', { 
          csrfToken: req.csrfToken(), 
          users: result, 
          rCooky: req.cookies[ckName]
      });
    }
    return res.render('users/dashboard', 
      {users: result, rCooky: req.cookies[ckName]});
  })
  .catch(err => {
    return res.render('users/dashboard', {error: "DB error-1"});
  });
});

/**
 * Register Post
 */ 
router.post('/register', [
  // Validation
  check('name').trim().isLength({min:2})
    .withMessage('Name min length 2 chars')
    .isAlphanumeric().withMessage('Name can only contain letters and numbers'),
  check('email').trim().isEmail().withMessage('Invalid email')
    .custom(email => { 
      return( 
        UserModel.findByEmail(email).then(user => {
          if (user && user !== null) return Promise.reject();
          else return Promise.resolve();
        }));
    }).withMessage('Email already exists'),
  check('password').isLength({min:8})
    .withMessage('Password min length 8 chars')
    .custom((value,{req}) => {
      if (value !== req.body.password2) return false;
      else return true;
    }).withMessage("Passwords don't match")
  ], 
  (req, res) => {
    const {name, email, password, password2} = req.body;
    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
      return res.render('users/register', { errors: errors.errors, 
        name, email, password, password2});
    }
    // Save new user
    const newUser = new UserModel();
    newUser.name= name;
    newUser.email= email;
    newUser.uuid = uuidv4();
    bcrypt.genSalt(12, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          res.send("Error saving user data");
          return false;
        };
        newUser.password = hash;
        try {
          const usaved = await newUser.saveUs();
        } catch(err) {
          res.send("Error saving in database");
        }
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/users/login');
      })
    });
  }
);

/**
 * Login Post
 */ 
router.post('/login', [
    authLimiterMiddle, 
    passport.authenticate('local', {
      failureRedirect: '/users/login', 
      failureFlash: true
    })
  ],
  (req, res) => {
    // authentication has succeeded
    console.log('Logged-in', req.user.email)
    if (req.body.remember === 'on') {
      // Remember user
      let remember_token = '';
      EnkySecurity.genRandomKey()
      .then((rand) => {
        remember_token = rand;
        bcrypt.genSalt(12, (err, salt) => {
          bcrypt.hash(rand, salt, async (err, hash) => {
            if (err) {
              res.send("Error saving cookie data");
              return false;
            };
            return UserModel.saveRemember_me(hash, req.user.id);
          })
        });
      })
      .then(() => {
        UserModel.findById(req.user.id)
        .then((user) => {
          const ckOptions = {
            expires: new Date(Date.now() + rememberDays), 
            httpOnly: true 
          };
          res.cookie(ckName, user.uuid+remember_token, ckOptions);
          req.session.user = {name: req.user.name, 
            email: req.user.email, is_admin: req.user.is_admin}; 
          res.redirect(req.cookies['goingTo'] || 'dashboard');
        });
      });
    } else {
      UserModel.deleteRemember(req.user.id);
      res.clearCookie(ckName, '1', { httpOnly: true });
      req.session.user = {name: req.user.name, 
        email: req.user.email, is_admin: req.user.is_admin}; 
      res.redirect(req.cookies['goingTo'] || 'dashboard');
    }
  }
);

/**
 * Toggle Admin status
 */
router.post('/toggleAdmin', csrfProtection, (req, res) => {
  const {uid, state} = req.body;
  UserModel.toggleAdmin(uid, state)
  .then((admResult) => {
    if (admResult) {
      if (uid == req.session.passport.user) {
        AuthHelpers.logUserOut(req, res)
        .then(() => {
          return res.json({msg: "Logout", uid: uid, state: state});
        });
      } else {
        return res.json({msg: "Admin updated", uid: uid, state: state});
      }
    }
  })
  .catch((err) => {
    console.log(err)
    return res.status(500).json({error: "Database error."});
  });
});

/**
 * Toggle Active status
 */
router.post('/toggleActive', csrfProtection, (req, res) => {
  const {uid, state} = req.body;
  UserModel.toggleActive(uid, state)
  .then((result) => {
    if (result) {
      if (uid == req.session.passport.user) {
        AuthHelpers.logUserOut(req, res)
        .then(() => {
          return res.json({msg: "Logout", uid: uid, state: state});
        });
      } else {
        return res.json({msg: "Active status updated", uid: uid, state: state});
      }
    }
  })
  .catch((err) => {
    return res.status(500).json({error: "Database error."});
  });
});

/**
 * Logout 
 */
router.get('/logout', (req, res) => {
  AuthHelpers.logUserOut(req, res)
  .then(() => {
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
});

module.exports = router;
