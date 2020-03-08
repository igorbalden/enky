const pool = require('./pool');
const authConf = require('../../config/auth');

class PasswordModel {

  constructor(email, token) {
    this.email = email; 
    this.token = token;
  }

  /**
   * Delete expired reset tokens
   * Return password reset token
   */
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      this.deletOlds()
      .then(() => {
        let sql = `SELECT token FROM password_resets
                WHERE email = ? ORDER BY id desc`;
        pool.query(sql, [email], (err,result) => {
          if (err) reject("Database error-1");
          else {
            if (result.length === 0) resolve(null);
            resolve(result);
          }
        })
      })
    });
  }

  /**
   * Delete expired tokens
   */
  static deletOlds() {
    return new Promise((resolve,reject) => {
      const timeInt = authConf.passwordResetHours;
      const d = new Date();
      d.setHours(d.getHours() - timeInt);
      const timeB4 = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');
      let sql = `DELETE FROM password_resets WHERE created_at < ?`; 
      pool.query(sql, [timeB4], (err,result) => {
        if (err) reject("Database error-1");
        else resolve(result);
      })
    });
  }

  /**
   * Store email, hash, pair in password_resets
   */
  saveResetToken() {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO password_resets 
                SET email = ?, token = ?, created_at = ?`;
      let timeNow = new Date().toISOString().replace(/T/, ' ')
                                            .replace(/\..+/, '');
      pool.query(sql, [this.email, this.token, timeNow],
      (err, result) => {
        if (err) reject(new Error("Database error"));
        else {
          resolve(result);
        }
      }); 
    });
  }
}

module.exports = PasswordModel;
