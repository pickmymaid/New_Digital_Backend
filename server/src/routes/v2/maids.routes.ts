import express, { Router } from "express";
import { getPaginatedMaidsController } from "../../controllers/v2/maids.controllers";

const router:Router = express.Router();

/**
 * @openapi
 * /api/v2/maids/find/{page}:
 *   get:
 *     tags: [Maids V2]
 *     summary: Get paginated maids with advanced filters
 *     description: >
 *       Returns a paginated list of maid profiles with comprehensive filtering and sorting options.
 *       If a customer session is present, the response includes wishlist status per maid.
 *       All filter parameters are optional — omitting them returns all active, verified maids.
 *     parameters:
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: option
 *         schema:
 *           type: string
 *         description: Filter preset option identifier
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (coalesced with `country` param)
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country (same field as `location` — either works)
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           example: Immediate
 *         description: Filter by availability status
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *           example: Cooking,Childcare
 *         description: Comma-separated list of skills to filter by
 *       - in: query
 *         name: ageFrom
 *         schema:
 *           type: integer
 *           example: 25
 *         description: Minimum age filter
 *       - in: query
 *         name: ageTo
 *         schema:
 *           type: integer
 *           example: 45
 *         description: Maximum age filter
 *       - in: query
 *         name: nationality
 *         schema:
 *           type: string
 *           example: Filipino
 *         description: Filter by nationality
 *       - in: query
 *         name: salary
 *         schema:
 *           type: number
 *           example: 1500
 *         description: Maximum salary filter
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *           example: Live-in
 *         description: Service type (Live-in, Live-out, Part-time, etc.)
 *       - in: query
 *         name: visa
 *         schema:
 *           type: string
 *           example: Visit Visa
 *         description: Filter by current visa status
 *       - in: query
 *         name: religion
 *         schema:
 *           type: string
 *           example: Christian
 *         description: Filter by religion
 *       - in: query
 *         name: searchParams
 *         schema:
 *           type: string
 *         description: Free-text search across name, nationality, skills
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, salary_asc, salary_desc]
 *         description: Sort order for results
 *     responses:
 *       200:
 *         description: Paginated maid profiles
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     maids:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MaidProfile'
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     totalPages: { type: integer }
 */
router.get(`/find/:page`, getPaginatedMaidsController);

export default router;
