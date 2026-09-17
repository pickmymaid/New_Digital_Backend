const axios = require("axios");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Gmail's SMTP transport is blocked outbound from this cluster's worker
// nodes, so mail goes through Brevo's HTTPS API instead of raw SMTP.
const sendMail = async (email, subject, message, attachements) => {
  const payload = {
    sender: { name: "Pickmymaid Support Team", email: process.env.ADMIN_EMAIL },
    to: [{ email }],
    subject,
    htmlContent: message,
  };
  if (attachements && attachements.length) {
    payload.attachment = attachements.map((att) => ({
      name: att.filename,
      content: (att.content || "").replace(/^data:application\/pdf;base64,/, ""),
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
}

module.exports = { sendMail };
