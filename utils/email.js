//npm i nodemailer
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //Email handlerFucntion
  //OPTIONS=>1)the address where we want to send an email to,2) Subject line, 3) The mail content, and maybe some other staff

  //We need to follow three steps in order to send Email with nodemailer 
  //1) We need to create a transporter, TRANSPORTER IS THE SERVICE THAT SEND THE EMAIL, because its not nodejs that send the email itself, service like GMAIL for example.
  //WE can use some other services will known link SendGrid and MailGun

  //The Transporter is always the  service we gonna use 
  const transporter = nodemailer.createTransport({
    /*service: 'gmail',if we use gmail or yahoo...
    auth: {
      user: process.env.EMAIL_USERNAME,your mail
      pass: process.env.EMAIL_PASSWORD,your password
    }*/
    //But here we using Mailtrap service its special development service.
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    //Activate in gmail "less secure app" option if you using gmail, and not MAILTRAP mail
  });

  //2) Define the email options
 
  const mailOption = {
    from: 'Salim  <hello@gmail.com>',//wher the emailcoming from
    to: options.email,//wher the email go
    subject: options.subject,
    text: options.message,
    //html:
  };
  //3)Actually send the email with nodemailer
  
  
  await transporter.sendMail(mailOption);
};

module.exports = sendEmail;