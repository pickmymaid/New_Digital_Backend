const { Buffer } = require("buffer");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS
  }
});

const sendSesEmailWithAttachment = async (
  toAddress,
  subject,
  htmlBody,
  textBody,
  attachments = [],
  cc
) => {
  try {
    const info = await transporter.sendMail({
      from: `"Pickmymaid Support Team" <${process.env.ADMIN_EMAIL}>`,
      to: toAddress,
      cc,
      subject,
      text: textBody,
      html: htmlBody,
      attachments: attachments.map((att) => ({
          filename: att.filename,
        content: Buffer.from(att.content.replace(/^data:application\/pdf;base64,/, ""), "base64"),
          contentType: att.contentType,
      })),
    });

    return info;
  } catch (error) {
    if (error instanceof Error && error.name === "MessageRejected") {
      return error;
    }
    throw error;
  }
};

module.exports = { sendSesEmailWithAttachment };
