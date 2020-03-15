const authConf = {
  // How long the password reset link will be valid. Hours.
  passwordResetHours: 1,
  // How long the remember cookie will be valid. Days.
  rememberCookieDays: 360,
  // Random string. Remember me cookie name.
  rememberCookieName: 'EnkyRememberCookie',
  // Rate limiter database table name
  raterDBTable: 'rate_limiter'
};

module.exports = authConf;
