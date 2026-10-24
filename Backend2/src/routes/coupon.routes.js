const express = require('express');
const {
  validateCouponController,
  getCouponsController,
  createCouponController,
  updateCouponController,
  deleteCouponController,
} = require('../controllers/coupon.controller');
const { validateJwtToken } = require('../middleware/jwtValidator');
const { roleValidator } = require('../middleware/roleValidator');

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       properties:
 *         _id: { type: string, example: '66f1c2a9e4b0a1b2c3d4e5f6' }
 *         code: { type: string, example: 'WELCOME10' }
 *         discount_percent: { type: integer, minimum: 1, maximum: 90, example: 10 }
 *         is_active: { type: boolean, example: true }
 *         expires_at: { type: string, format: date-time, nullable: true }
 *         once_per_customer: { type: boolean, example: true }
 *         times_used: { type: integer, description: Paid orders that used this code (list only), example: 4 }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CouponRequest:
 *       type: object
 *       properties:
 *         code: { type: string, maxLength: 30, example: 'WELCOME10', description: 'Letters, numbers, "-" or "_". Stored upper-case.' }
 *         discount_percent: { type: integer, minimum: 1, maximum: 90, example: 10 }
 *         is_active: { type: boolean, example: true }
 *         expires_at: { type: string, format: date-time, nullable: true, description: 'null clears the expiry' }
 *         once_per_customer: { type: boolean, example: true }
 *
 * /api/v1/payment/coupons/validate:
 *   get:
 *     tags: [Coupons V1]
 *     summary: Check a coupon code
 *     description: >
 *       Public. Returns the discount for an active, unexpired code. When the
 *       request carries a customer session, a once-per-customer code the
 *       customer has already used is rejected.
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema: { type: string, example: WELCOME10 }
 *     responses:
 *       200:
 *         description: Coupon is valid
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: WELCOME10 }
 *                     discount_percent: { type: integer, example: 10 }
 *       400:
 *         description: Missing/invalid code, expired, or already used by this customer
 *       404:
 *         description: Unknown or inactive code
 *
 * /api/v1/payment/coupons/:
 *   get:
 *     tags: [Coupons V1]
 *     summary: List all coupons
 *     description: Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All coupons with usage counts
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags: [Coupons V1]
 *     summary: Create a coupon
 *     description: Requires SA role. Codes are unique case-insensitively.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CouponRequest'
 *             required: [code, discount_percent]
 *     responses:
 *       201:
 *         description: Coupon created
 *       400:
 *         description: Invalid body
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: A coupon with this code already exists
 *
 * /api/v1/payment/coupons/{id}:
 *   patch:
 *     tags: [Coupons V1]
 *     summary: Update a coupon
 *     description: Requires SA role. Send only the fields to change.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CouponRequest'
 *     responses:
 *       200:
 *         description: Coupon updated
 *       400:
 *         description: Invalid id or body
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Coupon not found
 *       409:
 *         description: A coupon with this code already exists
 *   delete:
 *     tags: [Coupons V1]
 *     summary: Delete a coupon
 *     description: Requires SA role. Past payments keep the code and discount they were charged with.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Coupon deleted
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Coupon not found
 */
router.get('/validate', validateCouponController);
router.get('/', validateJwtToken, roleValidator(['SA']), getCouponsController);
router.post('/', validateJwtToken, roleValidator(['SA']), createCouponController);
router.patch('/:id', validateJwtToken, roleValidator(['SA']), updateCouponController);
router.delete('/:id', validateJwtToken, roleValidator(['SA']), deleteCouponController);

module.exports = router;
