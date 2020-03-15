const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const authConf = require('../config/auth');
const EnkySecurity = require('../services/security/EnkySecurity');
const UserModel = require('../services/mysql/UserModel');
const passwordModel = require('../services/mysql/PasswordModel');
const {authLimiterMiddle} = require('../services/rateLimiter/rateLimiter');
const {check, validationResult} = require('express-validator');

/**
 * Forgot password Post
 * Save reset token in DB
 */
router.post('/forgotPassword', (req, res) => {
  const {email} = req.body;
  let errors = [];
  if (email === '') {
    return res.render('password/forgotPassword', 
      { error: 'Please enter your email.', email});
  }
  // Check user
  UserModel.findActiveByEmail(email)
  .catch(() => {
    res.render('password/forgotPassword', 
      {error: "Database error", email});
    return false;
  })
  .then((user) => {
    if (user == null) {
      return res.render('password/forgotPassword', 
        {error: "No user found for this email.", email});
    }
    if (user && user !== null) {
      EnkySecurity.genRandomPair()
      .then((keyPair) => {
        // Save hash in DB 
        const pass = new passwordModel(email, keyPair.randomKeyHash);
        pass.saveResetToken()
        .catch(err => {
          res.render('password/forgotPassword', 
            {error_msg: "Error saving reset link.", email});
          return false;
        })
        return keyPair;
      })
      .then(keyPair => {
        mailPassword(email, keyPair.randomKey).catch(console.error);
        res.render('password/forgotPassword', 
          {success_msg:"An email has been sent with the reset link.", email});
      })
      .catch(err => {
        console.log(err)
        res.render('password/forgotPassword', 
          {error_msg: "An Error Occured.", email});
      });
    }  // if user exists
  })
});

/**
 * Send email with password reset link
 */
const mailPassword = async (mailAddr, randomKey) => {
  const makeMailer = require('../config/mail');
  const mailer = makeMailer();  // or makeMailer('other_custom_config')
  let validStr = authConf.passwordResetHours;
  validStr += (validStr === 1) ? ' hour.' : ' hours.';
  const surl = `${process.env.ENKY_URL}/password/resetPassword/?key=${randomKey}&email=${mailAddr}`;
  const htmlMsg = `
    <p><strong>Reset Password</strong></p>
    <p>
    Click on the link bellow to reset you password:<br />
    <a href="${surl}" target="blank">${surl}</a>
    </p>
    <p>
    The link will be valid for ${validStr}
    </p>
  `;
  const txtMsg = `
    Reset Password
    \n
    Copy the link bellow, and paste it in the browser address bar, \n
    to reset you password:\n
    ${surl}\n
    The link will be valid for ${validStr}\n`;
  let info = await mailer.sendMail({
    from: '"Igor Balden" <ib@ib.loc>',
    to: mailAddr,
    subject: `${process.env.ENKY_TITLE} - Password Reset`,
    text: txtMsg,
    html: htmlMsg
  });
  console.log("Email sent: %s", info.messageId);
};

/**
 * Reset password Post
 */
router.post('/resetPassword', [
  authLimiterMiddle,
  // Validation
  check('key')
    .custom((key, {req}) => {
      return(
        new Promise((resolve, reject) => {
          verifyKey(key, req)
          .then((ver) => {
            if (ver === true) return resolve();
            return reject('Invalid link-2');
          })
          .catch((err) => reject(err))
        }));
    }),
  check('email').trim().isEmail(),
  check('password').isLength({min:8})
    .withMessage('Password min length 8 chars')
    .custom((value,{req}) => {
      if (value !== req.body.password2) return false;
      else return true;
    }).withMessage("Passwords don't match")
  ], 
  (req, res) => {
    const { key, email, password, password2 } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('password/resetPassword', 
        { key, email, password, password2, errors: errors.errors});
    }
    // Store new pass in DB
    const passUser = new UserModel();
    passUser.email = email;
    bcrypt.genSalt(12, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          return res.render('password/resetPassword', 
            {error_msg: 'Error saving user data', key, email});
        };
        passUser.password = hash;
        try {
          const updated = await passUser.updateUsPass();
        } catch(err) {
          return res.render('password/resetPassword', 
            {error_msg: 'Error saving in database', key, email});
        }
        req.flash(
          'success_msg',
          'Password reset successful.'
        );
        res.redirect('/users/login');
      })
    });
  }
);

/**
 * Verify valid reset Url provided
 */
const verifyKey = (key, req) => {
  return new Promise((resolve, reject) => {
    passwordModel.findByEmail(req.body.email)
    .then((dbToken) => {
      if (!dbToken) {
        return reject("Invalid link-1");
      } else {
        bcrypt.compare(key, dbToken[0].token).then(
          (result) => {
            if (result === true) return resolve(true);
            return resolve("Invalid link-3");
        })
      }
    })
    .catch(err => {
      return reject("Key verification error");
    });
  });
};

/**
 * Forgot Password Page
 */
router.get('/forgotPassword', 
  (req, res) => res.render('password/forgotPassword')
);

/**
 * Reset Password Page
 */
router.get('/resetPassword', 
  (req, res) => res.render('password/resetPassword', 
    {key: req.query.key, email: req.query.email})
);

module.exports = router;
