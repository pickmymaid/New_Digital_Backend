import { Router, Request, Response } from 'express';
import { sendSesEmailWithAttachment } from '../utils/sendMail/sendSESMail';

const router = Router();

/**
 * @openapi
 * /api/v1/test/send-test-email:
 *   post:
 *     tags: [Internal]
 *     summary: Send a test email via AWS SES
 *     description: >
 *       **Internal/debug endpoint.** Sends an email using the configured AWS SES client.
 *       Requires a secret key in the request body. Not for public use.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, subject, message, key]
 *             properties:
 *               key: { type: string, description: Secret key required to use this endpoint }
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
 *         description: Invalid key or missing required fields
 *       500:
 *         description: Failed to send email
 */
router.post('/send-test-email', async (req: Request, res: Response) => {
  const { to, cc, key, subject, message } = req.body;

  if(key !== "test-email-1122334455"){
    return res.status(400).json({ error: 'Invalid key' });
  }

  if (!to || !subject || !message) {
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
  } catch (error: any) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

export default router;
