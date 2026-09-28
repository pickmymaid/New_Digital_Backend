// Table layout + inline styles only: most email clients (Outlook, Gmail)
// strip <style> blocks and ignore flexbox/grid.
const LOGO_URL = 'https://api.backendpickmymaid.site/api/v1/auth/email-assets/pickmymaid-logo.png';
const SUPPORT_EMAIL = 'pickmymaid@gmail.com';
const SUPPORT_PHONE = '+971 56 636 9736';
const SUPPORT_PHONE_TEL = '+971566369736';

const BRAND_ORANGE = '#F47216';
const TEXT_DARK = '#2D2D2D';
const TEXT_MUTED = '#6B6B70';

const otpVerificationTemplate = (name, otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F4F6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F4F6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="height:6px;background-color:${BRAND_ORANGE};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding:32px 32px 8px;">
              <img src="${LOGO_URL}" alt="Pickmymaid - Maid and Nannies" width="260" style="display:block;width:260px;max-width:100%;height:auto;border:0;">
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0;color:${TEXT_DARK};">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${TEXT_DARK};">Verify your email address</h1>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Dear ${name},</p>
              <p style="margin:0;font-size:15px;line-height:1.6;">
                Thank you for signing up with Pickmymaid. Use the code below to verify your email address and complete your registration.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#FFF4EC;border:2px dashed ${BRAND_ORANGE};border-radius:10px;padding:16px 32px;">
                    <span style="font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:bold;letter-spacing:10px;color:${BRAND_ORANGE};">${otp}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:13px;color:${TEXT_MUTED};">This code is valid for <strong>10 minutes</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;color:${TEXT_DARK};">
              <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">
                For your security, please do not share this code with anyone. Pickmymaid will never ask you for it.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">
                If you did not create a Pickmymaid account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAFAFB;border-radius:10px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:${TEXT_DARK};">Need help? Contact our support team</p>
                    <p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">
                      Email: <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_ORANGE};text-decoration:none;">${SUPPORT_EMAIL}</a>
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">
                      Phone: <a href="tel:${SUPPORT_PHONE_TEL}" style="color:${BRAND_ORANGE};text-decoration:none;">${SUPPORT_PHONE}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;color:${TEXT_DARK};">
              <p style="margin:0;font-size:14px;line-height:1.6;">Best regards,<br><strong>The Pickmymaid Team</strong></p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#9B9BA0;">
          &copy; ${new Date().getFullYear()} Pickmymaid &middot; <a href="https://www.pickmymaid.com" style="color:#9B9BA0;">www.pickmymaid.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`

module.exports = { otpVerificationTemplate };
