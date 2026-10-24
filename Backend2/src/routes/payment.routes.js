const express = require('express');
const {
  generatePaymentTokenController,
  getPaymentsController,
  getUserPaymentDetailsController,
  manualPaymentController,
  verifyPaymentTokenController,
  updatePaymentController,
} = require('../controllers/payment.controller');
const { validateJwtToken } = require('../middleware/jwtValidator');
const { roleValidator } = require('../middleware/roleValidator');
const { validateUser } = require('../middleware/validateUser');

const router = express.Router();

/**
 * @openapi
 * /api/v1/payment/subscribe:
 *   post:
 *     tags: [Payment V1]
 *     summary: Generate a payment token / initiate subscription
 *     description: Creates a payment record and returns a payment gateway URL or token for the customer to complete payment.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentSubscribeRequest'
 *     responses:
 *       200:
 *         description: Payment token generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *                     paymentUrl: { type: string }
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/subscribe', generatePaymentTokenController);

/**
 * @openapi
 * /api/v1/payment/verify:
 *   post:
 *     tags: [Payment V1]
 *     summary: Verify a payment token
 *     description: Verifies the payment gateway callback token and activates the customer subscription.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, user_id]
 *             properties:
 *               token: { type: string, description: Payment gateway token from callback }
 *               user_id: { type: string, example: USR-001 }
 *     responses:
 *       200:
 *         description: Payment verified and subscription activated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify', verifyPaymentTokenController);

/**
 * @openapi
 * /api/v1/payment/:
 *   get:
 *     tags: [Payment V1]
 *     summary: Get all payment records (admin)
 *     description: Returns a paginated list of all payment transactions. Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by user_id or receipt number
 *     responses:
 *       200:
 *         description: Paginated payment records
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentRecord'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', validateJwtToken, roleValidator(['SA']), getPaymentsController);

/**
 * @openapi
 * /api/v1/payment/manual-verify:
 *   post:
 *     tags: [Payment V1]
 *     summary: Manually verify a payment
 *     description: Admin tool to re-check a payment with the gateway by its transaction reference and mark it verified if paid. SA only.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ref]
 *             properties:
 *               ref: { type: string, description: Payment transaction reference }
 *     responses:
 *       200:
 *         description: Payment manually verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Missing reference
 *       401:
 *         description: Not a super admin
 */
router.post('/manual-verify', validateJwtToken, roleValidator(['SA']), manualPaymentController);

/**
 * @openapi
 * /api/v1/payment/payment-details:
 *   get:
 *     tags: [Payment V1]
 *     summary: Get payment details for the current session user
 *     description: Returns the subscription and payment status for the authenticated customer. Requires active session (`CookieAuth`).
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Customer payment details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PaymentRecord'
 *       401:
 *         description: Unauthorized — no active session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/payment-details', validateUser, getUserPaymentDetailsController);

/**
 * @openapi
 * /api/v1/payment/{id}:
 *   patch:
 *     tags: [Payment V1]
 *     summary: Edit a payment's expiry date or status (admin)
 *     description: >
 *       Requires SA role. Use it to extend or shorten a subscription, or to
 *       reactivate/suspend it. Status 1 (active) requires an expiry date in
 *       the future — otherwise the expiry job would flip it straight back to 2.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Payment _id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiryDate: { type: string, format: date-time, example: '2026-12-31T23:59:00.000Z' }
 *               status: { type: integer, enum: [0, 1, 2], description: '0=pending, 1=active, 2=expired/suspended' }
 *     responses:
 *       200:
 *         description: Payment updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment: { $ref: '#/components/schemas/PaymentRecord' }
 *       400:
 *         description: Invalid id, date or status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */
router.patch('/:id', validateJwtToken, roleValidator(['SA']), updatePaymentController);

module.exports = router;
