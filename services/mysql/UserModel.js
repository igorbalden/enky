const pool = require('./pool');

class UserModel {

  /**
   * Find one user by email, return all fields, exclude password
   */
  static findByEmail(emIn) {
    return this.findOne(emIn, 'email');
  }
  
  /**
   * Find one user by id, return all fields, exclude password
   */
  static findById(idIn) {
    return this.findOne(idIn, 'id');
  }

  /**
   * Find one user by uuid, return all fields, exclude password
   */
  static findByUuid(uuidIn) {
    return this.findOnePassw(uuidIn, 'uuid');
  }
  
  /**
   * Find one user, return all fields, exclude password, remember_me
   */
  static findOne(val, field) {
    let sql = `SELECT id, name, email, is_admin, uuid FROM users 
              WHERE ${field} = ? LIMIT 1`;
    return new Promise((resolve, reject) => {
      pool.query(sql, val, (err, result) => {
        if (err) reject(new Error("Database error"));
        else {
          if(Object.keys(result)) {
            resolve(result[0]);
          } else {
            resolve(null);
          }
        }
      });
    });
  }
  
  /**
   * Find one user, return all fields, include password
   */
  static findOnePassw(val, field) {
    let sql = `SELECT * FROM users WHERE ${field} = ? LIMIT 1`;
    return new Promise((resolve, reject) => {
      pool.query(sql, val, (err, result) => {
        if (err) reject(new Error("Database error"));
        else {
          if(Object.keys(result)) {
            resolve(result[0]);
          } else {
            resolve(null);
          }
        }
      });
    });
  }

  /**
   * Save New User
   * First inserted user will be admin
   */
  saveUs() {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO users SET 
        name =?, email =?, 
        is_admin = IF((SELECT COUNT(u1.id) FROM users u1) = 0, 1, 0), 
        password =?, uuid =?,
        created_at = NOW(), updated_at = NOW()`;
      pool.query(sql, [ this.name, this.email,
                        this.password, this.uuid], 
      (err, result) => {
        if (err) reject(new Error("Database saving error"));
        else 
          resolve({id: result.insertId, name: this.name, email: this.email});
      });
    });
  }

  /**
   * Update User Password
   */
  updateUsPass() {
    return new Promise((resolve, reject) => {
      let sql = `UPDATE users SET password = ?, updated_at = NOW() 
                WHERE email = ?` ;
      pool.query(sql, [this.password, this.email], 
      (err, result) => {
        if (err) reject(new Error("Database update error"));
        else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Update is_admins field for users
   */
  static async updateAdmins(admins) {
    return new Promise((resolve, reject) => {
      const sql1 = "UPDATE users SET is_admin = 0";
      pool.query(sql1, (err, result) => {
        if (err) return reject("Database update error"); 
        else {
          if (admins !== '') {
            const sql = `UPDATE users SET is_admin = 1 WHERE id IN (${admins})`;
            pool.query(sql,
            (err, result) => {
              if (err) return reject(err); 
              else return resolve(result);
            });
          }
          // There will be no admin
          return resolve(true);
        }
      })
    });
  }

  /**
   * Save User remember_me field
   */
  static saveRemember_me(remToken, id) {
    return new Promise((resolve, reject) => {
      let sql = `UPDATE users SET remember_me = ?, updated_at = NOW() 
                WHERE id = ?` ;
      pool.query(sql, [remToken, id], 
      (err, result) => {
        if (err) reject(new Error("Database update error"));
        else resolve(result);
      });
    });
  }

  /**
   * Get All Users if admin.
   * Else get self user.
   */
  static getAllAdmin(req, res) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT u2.id, u2.name, u2.email, u2.is_admin 
      FROM users u1 
      LEFT JOIN users u2
      ON (u1.id = ?)
      WHERE (u2.id = ?) OR (u1.is_admin = 1 AND u2.id IS NOT NULL)
      ORDER BY u1.id`; 
      pool.query(sql, [req.user.id, req.user.id],
      (err, result) => {
        if (err) reject("Database error");
        else {resolve(result);}
      });
    });
  }

  /**
   * Delete user remember_me token
   */
  static deleteRemember(usIn) {
    let sql = `UPDATE users SET remember_me = NULL  WHERE id = ? LIMIT 1`;
    pool.query(sql, [usIn],
    (err, result) => {
      if (err) return(console.log("Delete 'remember_me' error."));
      else return(result);
    });
  }
  
}

module.exports = UserModel;
