const pool = require('../mysql/pool');
const {RateLimiterMySQL} = require('rate-limiter-flexible');
const authConf = require('../../config/auth');

const opts = {
  storeClient: pool,
  dbName: process.env.ENKY_MYSQL_DATABASE,
  tableName: authConf.raterDBTable, // all limiters data in one table
  points: 2, // Number of points
  duration: 2, // Per second(s)
};

const ready = (err) => {
  if (err) {
   console.log("Rate limiter database error.")
   return false;
  } else {
    return true;
  }
};

// if 'ready' is not a function or not provided, 
// it may throw unhandled error on creation of db or table
const rateLimiter = new RateLimiterMySQL(opts, ready);

module.exports = { 
  authLimiterMiddle: function (req, res, next) {
    rateLimiter.consume(req.ip)
    .then((rateLimiterRes) => {
      next();
    })
    .catch((rej) => {
      req.flash('error_msg','Too Many Requests. Try again later');
      res.status(429).redirect('back');
    });
  }
}