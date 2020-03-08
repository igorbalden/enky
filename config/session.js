const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('../services/mysql/pool');
const sessionStore= new MySQLStore({}, pool);

const sessionConfig = {
  store: sessionStore,
  secret: process.env.ENKY_SECRET_KEY,
  secure: 'auto',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    maxAge: 30 * 60 * 1000
  }
}

module.exports = sessionConfig;
