const nodemailer = require('nodemailer');

const sendMail = (email, subject, message, attachements) => {
  return new Promise((resolve, reject) => {
    // DigitalOcean blocks outbound SMTP on 25/465/587, so Gmail's SMTP
    // transport can't connect from here. Port 2525 isn't blocked, so we
    // relay through an SMTP provider that supports it (Brevo by default).
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: Number(process.env.SMTP_PORT) || 2525,
      secure: false,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASS
      }
    });
    let mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject,
      html: message,
      attachments: attachements || []
    }

    transporter.sendMail(mailOptions, (error, info) => {
      console.log(error,info, "this is error and info")
      if (error) reject(error);
      else resolve(info)
    })
  })
}

module.exports = { sendMail };
