# ENKY

Boilerplate for Express applications with user authentication.  
Uses MySql, express-session, and passport.

## Features
1.  Password forgot, reset  
2.  Remember me cookie
3.  Throttling
4.  Administrator level set, reset  
5.  Activate, deactivate user

### MySql
Create a new database and import **enky.sql** in it.

### Usage
1.  Clone the repo locally.  
2.  Run `npm install`.  
3.  Copy **.env.example** to **.env**  
  Change the secret key.  
  Edit Mysql section properly.  

```sh
# Start application locally
$ npm run dev

# Visit http://localhost:5014
```
Go to */users/register* page to create the first user.
This user will be an admin.  

The administrator can make other admins, and activate, deactivate users.

## Configuration  
### Email
Uses [Nodemailer](https://github.com/nodemailer/nodemailer).  
In **/config/mail.js** there are two configured example mailers.  
1.  The 'local' one will work with [Mailhog](https://github.com/mailhog/MailHog) SMTP testing server.
2.  The 'production' mailer uses a common linux server configuration.  

There configurations can be modified, and other configurations can be added as needed.

### Auth  Parameters  
In **/config/auth.js**  

### Session
In **/config/session.js**  
Default configuration:  
Session store in MySql, duration 30mins, auto-renewal.  
