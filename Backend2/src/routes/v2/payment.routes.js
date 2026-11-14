const express = require("express");
const { acknowledgePaymentController, createPaymentController, downloadInvoice, gatewayWebhookController } = require("../../controllers/v2/payment.controllers");
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
 *       Called after the payment gateway redirects back. Reads the order from N-Genius and, if it was paid,
 *       activates the subscription. Works without a session, because the session cookie is often lost on the
 *       way back from the gateway; when a session is present the order must belong to that customer.
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
 *       400:
 *         description: Unknown order, order belongs to another customer, or not paid (yet)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/acknowledge/:ref', acknowledgePaymentController)

/**
 * @openapi
 * /api/v2/payment/webhook:
 *   post:
 *     tags: [Payment V2]
 *     summary: N-Genius order webhook
 *     description: >
 *       Called by N-Genius when an order changes. Must carry the header named by PG_WEBHOOK_HEADER
 *       (default `x-webhook-secret`) with the value of PG_WEBHOOK_SECRET, as configured in the N-Genius portal.
 *       The order is read back from N-Genius before anything is activated, so the body is only a hint.
 *     responses:
 *       200:
 *         description: Received
 *       401:
 *         description: Missing or wrong webhook secret
 *       404:
 *         description: Webhook not enabled on this server (PG_WEBHOOK_SECRET unset)
 */
router.post('/webhook', gatewayWebhookController)

/**
 * @openapi
 * /api/v2/payment/download-invoice:
 *   post:
 *     tags: [Payment V2]
 *     summary: Download payment invoice
 *     description: Returns the logged-in customer's invoice for the given payment reference. Requires the customer session cookie; the invoice owner is taken from the session, not the body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ref]
 *             properties:
 *               ref: { type: string, description: Payment reference number }
 *     responses:
 *       200:
 *         description: Invoice data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Missing payment reference
 *       401:
 *         description: Not logged in
 *       404:
 *         description: No invoice for this reference and customer
 */
router.post('/download-invoice', validateUser, downloadInvoice)

module.exports = router;
