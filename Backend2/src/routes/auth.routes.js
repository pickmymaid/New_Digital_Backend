
const express = require('express');
const { AdminLoginScheme, AdminRegisterSchema, CustomerForgetPasswordSchema, CustomerLoginSchema, CustomerRegisterSchema, CustomerResetPasswordSchema, CustomerVerifyOtpSchema } = require('../middleware/requestValidators/auth.validator');
const { validator } = require('../middleware/validator');
const { adminLoginController, adminLogoutController, adminSignupController, createCustomerController, verifyCustomerOtpController, customerForgetPasswordController, customerLoginController, customerResetPasswordController } = require('../controllers/auth.controller');
const { validateJwtToken } = require('../middleware/jwtValidator');
const { roleValidator } = require('../middleware/roleValidator');

const router = express.Router();

// Customer routes

/**
 * @openapi
 * /api/v1/auth/customer/register:
 *   post:
 *     tags: [Auth V1]
 *     summary: Start customer registration — sends an email OTP
 *     description: >
 *       Validates the registration details and, if the email/phone isn't already in use, emails
 *       a 6-digit OTP to the given address. No account is created yet — call
 *       /customer/verify-otp with the same email and the received OTP to finish registration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerRegisterRequest'
 *     responses:
 *       200:
 *         description: OTP emailed to the given address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email or phone already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/customer/register', validator(CustomerRegisterSchema), createCustomerController);

/**
 * @openapi
 * /api/v1/auth/customer/verify-otp:
 *   post:
 *     tags: [Auth V1]
 *     summary: Verify registration OTP and create the customer account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerVerifyOtpRequest'
 *     responses:
 *       201:
 *         description: Customer account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id: { type: string }
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No pending registration found for this email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/customer/verify-otp', validator(CustomerVerifyOtpSchema), verifyCustomerOtpController);

/**
 * @openapi
 * /api/v1/auth/customer/login:
 *   post:
 *     tags: [Auth V1]
 *     summary: Customer login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful — returns JWT token
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
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/customer/login', validator(CustomerLoginSchema), customerLoginController);

/**
 * @openapi
 * /api/v1/auth/customer/forget-password:
 *   post:
 *     tags: [Auth V1]
 *     summary: Request a password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerForgetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Email not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/customer/forget-password', validator(CustomerForgetPasswordSchema), customerForgetPasswordController);

/**
 * @openapi
 * /api/v1/auth/customer/reset-password:
 *   post:
 *     tags: [Auth V1]
 *     summary: Reset customer password using a reset token
 *     description: >
 *       The reset token must be passed in the `Authorization` header as `Bearer <token>`.
 *       The token is emailed to the customer via the forget-password endpoint.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
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
router.post('/customer/reset-password', validator(CustomerResetPasswordSchema), customerResetPasswordController)

// Admin routes

/**
 * @openapi
 * /api/v1/auth/admin/register:
 *   post:
 *     tags: [Auth V1]
 *     summary: Register a new admin team member
 *     description: Requires Super Admin (SA) JWT. Creates or updates an admin account.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminRegisterRequest'
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized — SA role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/admin/register', validator(AdminRegisterSchema), validateJwtToken, roleValidator(['SA']), adminSignupController)

/**
 * @openapi
 * /api/v1/auth/admin/login:
 *   post:
 *     tags: [Auth V1]
 *     summary: Admin login
 *     description: Returns a JWT token (24h for SA, 10h for other admins). Also sends a login notification email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful — returns JWT token
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
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/admin/login', validator(AdminLoginScheme), adminLoginController)

/**
 * @openapi
 * /api/v1/auth/admin/logout:
 *   post:
 *     tags: [Auth V1]
 *     summary: Admin logout
 *     description: Validates the JWT and sends a logout notification email.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized — invalid or missing JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/admin/logout', validateJwtToken, adminLogoutController)


module.exports = router;
