const express = require('express');
require('dotenv/config');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const sessionConfig = require('./config/session');
const ejsLayouts = require('express-ejs-layouts');
const passport = require('passport');
const flash = require('connect-flash');
const app = express();

app.use(cookieParser(process.env.ENKY_SECRET_KEY));
app.set('trust proxy', 1); // trust proxie required for https
app.use(session(sessionConfig));

// EJS
app.use(ejsLayouts);
app.set('layout', 'layouts/default');
app.set('view engine', 'ejs');
// Not needed behind a reverse proxy
if (process.env.ENKY_ENV === 'local') {
  app.use(express.static('public'));
}
// Express body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Connect flash
app.use(flash());
// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.session = req.session;
  res.locals.enkyDebug = process.env.ENKY_DEBUG;
  // res.locals.debug = true;
  next();
});

// Passport middleware
require('./services/passport/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', require('./routes/index.js'));

const PORT = process.env.ENKY_PORT || 5000;
app.listen(PORT, console.log(`Enky started on port ${PORT}`));
