const bcrypt = require('bcryptjs');
const UserModel = require('../mysql/UserModel');
const authConf = require('../../config/auth');
const ckName = authConf.rememberCookieName;

module.exports = class EnkySecurity {
  /**
   * Generate random string
   */
  static genRandomKey() {
    return new Promise((resolve, reject) => {
      let rKey = '';
      require('crypto').randomBytes(24, function(ex, buf) {
        rKey = 
            buf.toString('base64').replace(/\//g,'_').replace(/\+/g,'-');
        resolve(rKey);
      });
    });
  };

  /**
   * Generate random key pair
   */
  static genRandomPair() {
    return new Promise((resolve, reject) => {
      EnkySecurity.genRandomKey()
      .then((randomKey) => { 
        bcrypt.genSalt(12, (err, salt) => {
          bcrypt.hash(randomKey, salt, (err, hash) => {
            if (err) {
              reject("err");
              return false;
            }
            resolve({randomKey: randomKey, randomKeyHash: hash});
          })
        })
      })
      .catch(err => reject('fin Err'));
    });
  };

  /**
   * Actions to log user out.
   */
  static logUserOut(req, res) {
    return new Promise((resolve) => {
      UserModel.deleteRemember(req.user.id);
      res.clearCookie(ckName, '1', { httpOnly: true });
      delete req.session.user;
      req.logout();
      resolve();
    });
  };

}
