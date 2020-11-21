# ENKY

Boilerplate for Express applications with user authentication.  
Uses MySql and express-session.  
Presented at <a href="https://hackernoon.com/express-js-boilerplate-with-user-authentication-ch5032a3" target="_blank">
**Hackernoon**</a>

## Features
1.  Password forgot, reset  
2.  Remember me cookie
3.  Throttling
4.  Administrator level set, reset  
5.  Activate, deactivate user  
6.  Authenticate user with any field, not only email. New in v1.1.0.

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
Uses <a href="https://github.com/nodemailer/nodemailer" target="_blank">**Nodemailer**</a>.  
In **/config/mail.js** there are two configured example mailers.  
1.  The 'local' one will work with <a href="https://github.com/mailhog/MailHog" target="_blank">**Mailhog**</a> SMTP testing server.
2.  The 'production' mailer uses a common linux server configuration.  

There configurations can be modified, and other configurations can be added as needed.

### Auth  Parameters  
In **/config/auth.js**  

### Session
In **/config/session.js**  
Default configuration:  
Session store in MySql, duration 30mins, auto-renewal.  

## Additions in v1.1.0  
1.  Any column from DB Table 'users' can be used for authentication.  
Added a configuration option in **/config/auth.js**.  
As it is the table 'users' in the enky.sql file, the developer may  
select between 'name', or 'email' fields. Email is the default.  
If the 'name' field is configured to identify the login user,  
the developer must add a uniqueness check in the new user registration form.   
Similar action needs to be taken, if the developer adds a new field  
in the users table, to be used as login identity. In this case the new  
DB column name must contain only letters, digits, and the 2 characters _$.  
The password forgot - reset functionality is still based on the email.  
  
2.  The validation function based on the 'express-validator' middleware  
has been moved in a detached function. So it is more clear how the  
uniqueness check can be added.  
The developer may also gather all validations in a separate file.  
  
3.  The 'passport' middleware is not used anymore.  
  

