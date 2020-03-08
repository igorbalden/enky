const nodemailer = require("nodemailer");

mailers = { 

  local: {
    host: "127.0.0.1",
    port: 1025,   //mailhog
    secure: false,
    auth: {
      user: 'null',
      pass: 'null'
    }
  },

  production: {
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
  }
  
};

const makeMailer = (mConf) => {
  const mailer = 
    nodemailer.createTransport( mailers[mConf] || 
                                mailers[process.env.ENKY_ENV]);
  return mailer;
}

module.exports = makeMailer;
