import express, {Router} from 'express'
import { emailClickCapture, getCategoryAnalyticsDataController, saveCategoryForAnalyticsController } from '../controllers/analytics.controllers';
import { validateJwtToken } from '../middleware/jwtValidator';
import { roleValidator } from '../middleware/roleValidator';

const router: Router = express.Router();

/**
 * @openapi
 * /api/v1/analytics/category-usage:
 *   post:
 *     tags: [Analytics V1]
 *     summary: Record a category usage event
 *     description: Tracks which service categories are viewed or clicked by users. No auth required — optionally enriched with user_id from JWT if present.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category]
 *             properties:
 *               category: { type: string, example: Cooking }
 *               user_id: { type: string, description: Optional — if the user is authenticated }
 *     responses:
 *       200:
 *         description: Event recorded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/category-usage', saveCategoryForAnalyticsController)

/**
 * @openapi
 * /api/v1/analytics/category-analytics:
 *   get:
 *     tags: [Analytics V1]
 *     summary: Get category analytics data
 *     description: Returns aggregated category usage statistics. Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Category analytics data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category: { type: string }
 *                       count: { type: integer }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/category-analytics',validateJwtToken, roleValidator(['SA']), getCategoryAnalyticsDataController)

/**
 * @openapi
 * /api/v1/analytics/email-click-capture:
 *   post:
 *     tags: [Analytics V1]
 *     summary: Capture an email link click event
 *     description: Records when a user clicks a link from a marketing email. Used to track email campaign effectiveness.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type: { type: string, description: Event type identifier, example: subscription-cta }
 *               email: { type: string, format: email, description: Optional sender email }
 *     responses:
 *       200:
 *         description: Click event recorded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/email-click-capture', emailClickCapture)

export default router;
