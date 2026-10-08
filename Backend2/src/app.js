const dns = require("dns");
try {
  dns.setDefaultResultOrder?.("ipv4first");
} catch (e) {
  console.warn("dns.setDefaultResultOrder not available on this Node version");
}

const path = require('path');
const express = require('express');
require('dotenv').config();
const logger = require('morgan');
const cors = require('cors');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const { connectDatabase } = require('./config/databaseConnection');
const { fixCustomerAccountIdIndex } = require('./migrations/customerAccountIdIndex');
require('./config/passport'); // registers Google/Facebook/Apple/Local strategies (auth) + serialize/deserialize (shared by payment routes too)
const { authRoutes, authRoutesV2, paymentRoutes, paymentV2Routes, internalRoutes } = require('./routes');

const app = express();
const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

const IS_PROD = process.env.NODE_ENV === 'production';

app.use(logger(IS_PROD ? 'combined' : 'dev'));

// TLS terminates at the Ingress; trust X-Forwarded-Proto so secure cookies can be set.
app.set('trust proxy', 1);

// Same cookie name + COOKIE_KEY as Backend1, so a session cookie set by
// this service's /api/v2/auth/local (or OAuth) login is readable there too.
// The frontend (www.pickmymaid.com) and API (api.backendpickmymaid.site) are
// different sites, so the cookie must be SameSite=None; Secure to be sent.
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.COOKIE_KEY],
    maxAge: ONE_YEAR,
    sameSite: IS_PROD ? 'none' : 'lax',
    secure: IS_PROD,
  })
);

app.use(function (req, _, next) {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = (cb) => cb();
  }
  if (req.session && !req.session.save) {
    req.session.save = (cb) => cb();
  }
  next();
});

app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json({ limit: '10mb' }));

app.use(cors({
  origin: true,
  credentials: true,
}));

connectDatabase().then(() =>
  fixCustomerAccountIdIndex().catch((error) => console.error('customers.account_id index fix failed:', error.message))
);

app.get('/', (req, res) => res.send('Pickmymaid Backend2 (auth + payment)'));
app.get('/health', (req, res) => res.status(200).send({ status: 'ok', service: 'backend2-auth-payment' }));

// Images referenced by outgoing emails (e.g. the logo in the OTP mail). Mounted
// under /api/v1/auth so the existing Ingress prefix already routes it here.
app.use('/api/v1/auth/email-assets', express.static(path.join(__dirname, 'assets', 'email'), { maxAge: '30d' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v2/auth', authRoutesV2);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v2/payment', paymentV2Routes);
// Not exposed via nginx/Ingress — cluster/network-internal calls only
// (currently just Backend1's admin "verify payment" action).
app.use('/internal', internalRoutes);

module.exports = { app };
