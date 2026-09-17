const axios = require("axios");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Gmail's SMTP transport (ports 25/465/587) is blocked outbound from this
// cluster's worker nodes, so mail goes through Brevo's HTTPS API (port 443,
// never blocked) instead of connecting to smtp.gmail.com directly.
const sendSesEmailWithAttachment = async (
  toAddress,
  subject,
  htmlBody,
  textBody,
  attachments = [],
  cc
) => {
  const payload = {
    sender: { name: "Pickmymaid Support Team", email: process.env.ADMIN_EMAIL },
    to: [{ email: toAddress }],
    subject,
    htmlContent: htmlBody,
  };
  if (textBody) payload.textContent = textBody;
  if (cc) payload.cc = [{ email: cc }];
  if (attachments.length) {
    payload.attachment = attachments.map((att) => ({
      name: att.filename,
      content: att.content.replace(/^data:application\/pdf;base64,/, ""),
    }));
  }

  const res = await axios.post(BREVO_API_URL, payload, {
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
  });

  return res.data;
};

module.exports = { sendSesEmailWithAttachment };
