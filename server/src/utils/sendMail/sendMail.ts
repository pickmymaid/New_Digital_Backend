import nodemailer from 'nodemailer'

export const sendMail = (email: string, subject: string, message: string, attachements?: any[]) => {
  return new Promise((resolve, reject) => {
    let transporter = nodemailer.createTransport({
      service: 'Gmail',
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
    
    transporter.sendMail(mailOptions, (error: any, info: object) => {
      console.log(error,info, "this is error and info")
      if (error) reject(error);
      else resolve(info)
    })
  })
}