const express = require("express");
const { acknowledgePaymentController, createPaymentController, downloadInvoice, generateReciept } = require("../../controllers/v2/payment.controllers");
const { validateJwtToken } = require("../../middleware/jwtValidator");
const { validateUser } = require("../../middleware/validateUser");


const router = express.Router();

/**
 * @openapi
 * /api/v2/payment/create-payment:
 *   post:
 *     tags: [Payment V2]
 *     summary: Create a new payment
 *     description: Initiates a subscription payment for the authenticated customer. Requires an active session (`CookieAuth`).
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentV2CreateRequest'
 *     responses:
 *       200:
 *         description: Payment created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     ref: { type: string, description: Payment reference number }
 *                     paymentUrl: { type: string, description: Payment gateway redirect URL }
 *       401:
 *         description: Unauthorized — no active session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create-payment',validateUser,createPaymentController);

/**
 * @openapi
 * /api/v2/payment/acknowledge/{ref}:
 *   post:
 *     tags: [Payment V2]
 *     summary: Acknowledge a completed payment
 *     description: >
 *       Called after the payment gateway redirects back. Verifies the payment status and activates the customer subscription.
 *       Requires an active session (`CookieAuth`).
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: ref
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference number returned by create-payment
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Payment gateway callback data (varies by provider)
 *     responses:
 *       200:
 *         description: Payment acknowledged and subscription activated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/acknowledge/:ref',validateUser, acknowledgePaymentController)

/**
 * @openapi
 * /api/v2/payment/generate-reciept:
 *   get:
 *     tags: [Payment V2]
 *     summary: Generate a payment receipt PDF
 *     description: >
 *       Generates a PDF receipt for a customer's payment. Returns the PDF as a base64-encoded string or binary.
 *       Note: endpoint name intentionally uses legacy spelling "reciept".
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The customer's user_id
 *     responses:
 *       200:
 *         description: Receipt PDF generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     pdf: { type: string, description: Base64-encoded PDF content }
 */
router.get('/generate-reciept',  generateReciept)

/**
 * @openapi
 * /api/v2/payment/download-invoice:
 *   post:
 *     tags: [Payment V2]
 *     summary: Download payment invoice
 *     description: Returns invoice data for the given payment, optionally sending it via email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id: { type: string, example: USR-001 }
 *               ref: { type: string, description: Payment reference number }
 *     responses:
 *       200:
 *         description: Invoice data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/download-invoice', downloadInvoice)

module.exports = router;
