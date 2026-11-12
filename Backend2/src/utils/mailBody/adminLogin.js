const ROLE_LABELS = { SA: 'Super Admin', A: 'Admin', Marketing: 'Marketing' };

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Always UAE time (Asia/Dubai, GMT+4) regardless of the server's own time zone.
const formatUaeTime = (date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);

const adminLoginMailBody = ({ name, email, role, loginAt = new Date() }) => {
  const roleLabel = ROLE_LABELS[role] || role || '-';
  const row = (label, value) => `
        <tr>
          <td style="padding:8px 16px 8px 0;color:#6b7280;white-space:nowrap;">${label}</td>
          <td style="padding:8px 0;color:#111827;font-weight:600;">${value}</td>
        </tr>`;

  return `
  <html>
    <body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827;">
      <p>Dear Super Admin,</p>
      <p>Someone has just logged in to the Pickmymaid admin panel.</p>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:12px 0;">
        ${row('Name', escapeHtml(name || '-'))}
        ${row('Email', escapeHtml(email || '-'))}
        ${row('Role', escapeHtml(roleLabel))}
        ${row('Login time', `${formatUaeTime(loginAt)} (UAE time, GMT+4)`)}
      </table>
      <p style="color:#6b7280;">If you don't recognise this login, change that account's password and review it in the admin panel.</p>
    </body>
  </html>
`;
};

module.exports = { adminLoginMailBody, formatUaeTime, ROLE_LABELS };
