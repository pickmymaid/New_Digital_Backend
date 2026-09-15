const { Buffer } = require("buffer");
const nodemailer = require("nodemailer");

// DigitalOcean blocks outbound SMTP on 25/465/587 for all droplets and K8s
// worker nodes, so Gmail's SMTP transport can never connect from here.
// Port 2525 isn't blocked, so we relay through an SMTP provider that
// supports it (Brevo by default) instead of connecting to Gmail directly.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 2525,
  secure: false,
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
