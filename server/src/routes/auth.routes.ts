
import express, { Router } from 'express';
import { AdminLoginScheme, AdminRegisterSchema, CustomerForgetPasswordSchema, CustomerLoginSchema, CustomerRegisterSchema, CustomerResetPasswordSchema } from '../middleware/requestValidators/auth.validator';
import { validator } from '../middleware/validator';
import { adminLoginController, adminLogoutController, adminSignupController, createCustomerController, customerForgetPasswordController, customerLoginController, customerResetPasswordController } from '../controllers/auth.controller';
import { validateJwtToken } from '../middleware/jwtValidator';
import { roleValidator } from '../middleware/roleValidator';

const router: Router = express.Router();

// Customer routes

/**
 * @openapi
 * /api/v1/auth/customer/register:
 *   post:
 *     tags: [Auth V1]
 *     summary: Register a new customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerRegisterRequest'
 *     responses:
 *       201:
 *         description: Customer registered successfully
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
 *                     user_id: { type: string }
 *       400:
 *         description: Validation error or email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/customer/register', validator(CustomerRegisterSchema), createCustomerController);

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


export default router;
