const bcrypt = require('bcryptjs');

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

}
