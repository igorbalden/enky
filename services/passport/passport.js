const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const UserModel = require('../mysql/UserModel');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({usernameField: 'email'}, (email, password, done) => {
      // Match user
      UserModel.findOneActivePassw(email, 'email')
      .then((user) => {
        if (!user) {
          return done(null, false, { message: 'Email/Password incorrect' });
        }
        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) return done(err, false, {message: "DB error"});
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Email/Password incorrect' });
          }
        }); // bcrypt
      })
      .catch(err => {
        console.log('Authentication error', err)
        return done(null, false, {message: "DB error"});
      });
    })  // LocalStrategy
  );

  /**
   * Serialize use for storing
   */
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  /**
   * Deserialize User out of DB
   */
  passport.deserializeUser(function(id, done) {
    UserModel.findById(id)
    .catch(err => done(err, null))
    .then((user) => {
      done(null, user);
    });
  });
};
