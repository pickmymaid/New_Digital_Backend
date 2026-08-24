const express = require("express");
const passport = require('passport');
const { responseHandler } = require("../../utils/responseHandler/responseHandler");
const { getCustomerWithEmail } = require("../../queries/user.queries");
const { logErrorWithSource } = require("../../config/logger");

const router = express.Router();

/**
 * @openapi
 * /api/v2/auth/google:
 *   get:
 *     tags: [Auth V2]
 *     summary: Initiate Google OAuth login
 *     description: >
 *       Redirects the browser to Google's OAuth consent screen.
 *       **Not directly callable from Swagger UI — open in a browser tab.**
 *       After successful authentication, redirects back to the `redirect` query param URL (or `BASE_URL`).
 *     parameters:
 *       - in: query
 *         name: redirect
 *         schema:
 *           type: string
 *         description: URL-encoded redirect destination after successful login
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google', (req, res, next) => {
    const redirectUrl = req.query.redirect ?  decodeURIComponent(req.query.redirect) : process.env.BASE_URL;
    req.session.redirectUrl = redirectUrl;
    next();
}, passport.authenticate('google', {
    scope: ['profile','email']
}))

/**
 * @openapi
 * /api/v2/auth/google/redirect:
 *   get:
 *     tags: [Auth V2]
 *     summary: Google OAuth callback
 *     description: >
 *       Handles the OAuth callback from Google. Sets the session cookie and redirects to the stored `redirect` URL.
 *       Redirects to `/api/v2/auth/login/failed` on failure.
 *     responses:
 *       302:
 *         description: Redirect to destination URL or login/failed
 */
router.get('/google/redirect', passport.authenticate('google', {
    failureRedirect: '/api/v2/auth/login/failed',
    session: true,
  }), (req, res) => {
    if(req.user){
        const redirectUrl = req.session.redirectUrl || process.env.BASE_URL;
        delete req.session.redirectUrl;
        res.redirect(redirectUrl);
    }else{
        res.redirect('/api/v2/auth/login/failed')
    }
})

/**
 * @openapi
 * /api/v2/auth/apple:
 *   get:
 *     tags: [Auth V2]
 *     summary: Initiate Apple Sign-In
 *     description: >
 *       Redirects to Apple's OAuth consent screen.
 *       **Not directly callable from Swagger UI — open in a browser tab.**
 *     parameters:
 *       - in: query
 *         name: redirect
 *         schema:
 *           type: string
 *         description: URL-encoded redirect destination after successful login
 *     responses:
 *       302:
 *         description: Redirect to Apple Sign-In
 */
router.get('/apple', (req, res, next) => {
    console.log(req.query.redirect, "redirectUrl")
    const redirectUrl = req.query.redirect
        ? decodeURIComponent(req.query.redirect)
        : process.env.BASE_URL;
    req.session.redirectUrl = redirectUrl;
    next();
}, passport.authenticate('apple', { scope: ['name', 'email'] }));

/**
 * @openapi
 * /api/v2/auth/apple/redirect:
 *   post:
 *     tags: [Auth V2]
 *     summary: Apple Sign-In callback
 *     description: >
 *       Handles Apple's POST callback (Apple uses POST, not GET, for OAuth callbacks).
 *       Sets the session cookie and redirects to the stored redirect URL.
 *     responses:
 *       302:
 *         description: Redirect to destination URL or login/failed
 */
router.post('/apple/redirect', passport.authenticate('apple'), (req, res) => {
    if (req.user) {
        const redirectUrl = req.session.redirectUrl;
        delete req.session.redirectUrl;
        res.redirect(redirectUrl);
    }else{
        res.redirect('/api/v2/auth/login/failed')
    }
});

/**
 * @openapi
 * /api/v2/auth/facebook:
 *   get:
 *     tags: [Auth V2]
 *     summary: Initiate Facebook OAuth login
 *     description: >
 *       Redirects to Facebook's OAuth consent screen.
 *       **Not directly callable from Swagger UI — open in a browser tab.**
 *     responses:
 *       302:
 *         description: Redirect to Facebook OAuth
 */
router.get('/facebook', passport.authenticate('facebook', {
    scope: ['public_profile', 'email']
}))

/**
 * @openapi
 * /api/v2/auth/facebook/redirect:
 *   get:
 *     tags: [Auth V2]
 *     summary: Facebook OAuth callback
 *     description: Handles the OAuth callback from Facebook. Redirects to BASE_URL on success.
 *     responses:
 *       302:
 *         description: Redirect to home or login/failed
 */
router.get('/facebook/redirect', passport.authenticate('facebook', {
    successRedirect: process.env.BASE_URL,
    failureRedirect: '/api/v2/auth/login/failed'
}), (req, res) => {
    if(req.user){
       res.redirect("https://pickmymaid.com")
    }
})

/**
 * @openapi
 * /api/v2/auth/local:
 *   post:
 *     tags: [Auth V2]
 *     summary: Login with email and password (session-based)
 *     description: >
 *       Authenticates a customer using email and password via Passport local strategy.
 *       On success, sets a session cookie (`CookieAuth`) and returns the user object.
 *     parameters:
 *       - in: query
 *         name: redirect
 *         schema:
 *           type: string
 *         description: Optional redirect URL returned in the response payload
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: jane@example.com }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       200:
 *         description: Login successful — session cookie set
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/Customer'
 *                     message: { type: string }
 *                     redirect: { type: string }
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/local',(req,res,next) => {
    return passport.authenticate('local',(err, user, info) => {
        if(err){
            responseHandler(res, 'INTERNAL_SERVER_ERROR', null, {message: info?.message || 'Something went wrong!'})
        }else if(!user){
            responseHandler(res, 'UNAUTHORIZED',null, info)
        }else{
            req.logIn(user, (err) => {
                if(err) responseHandler(res, 'INTERNAL_SERVER_ERROR', null, {message: 'Something went wrong!'})
                responseHandler(res, 'OK', user, {message: "Logged in successfully!", redirect: req.query?.redirect})
            })
        }
    })(req,res,next)
})

/**
 * @openapi
 * /api/v2/auth/login/failed:
 *   get:
 *     tags: [Auth V2]
 *     summary: OAuth login failure redirect
 *     description: Redirects the browser to `BASE_URL?redirect=google-login-failed`. Called automatically by Passport on OAuth failure.
 *     responses:
 *       302:
 *         description: Redirect to frontend with failure indicator
 */
router.get('/login/failed', (req,res) => {
    return res.redirect(`${process.env.BASE_URL}?redirect=google-login-failed`)
})

/**
 * @openapi
 * /api/v2/auth/login/success:
 *   get:
 *     tags: [Auth V2]
 *     summary: Get the currently authenticated user
 *     description: Returns the customer profile for the active session. Used by the frontend to check login state.
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user profile
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/Customer'
 *                     message: { type: string }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/login/success', async (req,res) => {
    const user = req.user
    if(user && user?._id){
        delete user.password
        delete user.reset_token
        delete user.type
        return responseHandler(res,"OK", {
            user: user,
            message: "User has successfully authenticated",
        })
    }
    return responseHandler(res, "UNAUTHORIZED", null, {message: "You are not authenticated!"})
})

/**
 * @openapi
 * /api/v2/auth/logout:
 *   get:
 *     tags: [Auth V2]
 *     summary: Logout the current user
 *     description: Destroys the session and logs out the authenticated customer.
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         description: Server error during logout
 */
router.get("/logout", (req,res) => {
    return req.logOut((err) => {
        if(err){
            return responseHandler(res,'INTERNAL_SERVER_ERROR', {
                message: "Something went wrong, Please try again!",
                err: err
            })
        }
        return responseHandler(res,'OK',{message: "Successfully logged out!"})
    })
})

/**
 * @openapi
 * /api/v2/auth/log-error:
 *   post:
 *     tags: [Auth V2]
 *     summary: Log a client-side error
 *     description: Receives error reports from the frontend and logs them server-side with user context. Useful for diagnosing authentication-related frontend errors.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error: { type: object, description: Error details }
 *               source: { type: string, description: Source component or page }
 *     responses:
 *       200:
 *         description: Error logged
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/log-error", (req, res) => {
    logErrorWithSource({message: "Error with user data"}, {error_user: req.user, error_body: req.body})
    return responseHandler(res, "OK", {message: 'Saved successfully!'})
})



module.exports = router;
