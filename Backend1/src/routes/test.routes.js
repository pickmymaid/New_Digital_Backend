const { Router } = require('express');
const { sendSesEmailWithAttachment } = require('../utils/sendMail/sendSESMail');
const { validateJwtToken } = require('../middleware/jwtValidator');
const { roleValidator } = require('../middleware/roleValidator');

const router = Router();

/**
 * @openapi
 * /api/v1/test/send-test-email:
 *   post:
 *     tags: [Internal]
 *     summary: Send a test email
 *     description: >
 *       **Internal/debug endpoint.** Sends an email through the configured mail provider.
 *       Super admins only.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, subject, message]
 *             properties:
 *               to: { type: string, format: email, example: test@example.com }
 *               cc: { type: string, format: email, description: Optional CC address }
 *               subject: { type: string, example: Test email }
 *               message: { type: string, description: HTML or plain text message body }
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not a super admin
 *       500:
 *         description: Failed to send email
 */
router.post('/send-test-email', validateJwtToken, roleValidator(['SA']), async (req, res) => {
  const { to, cc, subject, message } = req.body;

  if (typeof to !== 'string' || typeof subject !== 'string' || typeof message !== 'string' || !to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, message' });
  }

  try {
    const info = await sendSesEmailWithAttachment(
      to,
      subject,
      message,
      message.replace(/<[^>]*>?/gm, ''), // Simple text body from HTML
      [],
      cc
    );
    res.status(200).json({ message: 'Email sent successfully', info });
  } catch (error) {
    console.error('Error sending test email:', error.message);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

module.exports = router;
