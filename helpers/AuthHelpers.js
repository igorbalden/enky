const UserModel = require('../services/mysql/UserModel');
const authConf = require('../config/auth');
const ckName = authConf.rememberCookieName;

module.exports = class AuthHelpers {

  /**
   * Actions to log user out.
   */
  static logUserOut(req, res) {
    return new Promise((resolve) => {
      if (req.session.user && req.session.user.id) {
        UserModel.deleteRemember(req.session.user.id);
      }
      res.clearCookie(ckName, '1', { httpOnly: true });
      delete req.session.user;
      resolve();
    });
  };

}
