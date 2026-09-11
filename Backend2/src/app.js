const dns = require("dns");
try {
  dns.setDefaultResultOrder?.("ipv4first");
} catch (e) {
  console.warn("dns.setDefaultResultOrder not available on this Node version");
}

const express = require('express');
require('dotenv').config();
const logger = require('morgan');
const cors = require('cors');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const { connectDatabase } = require('./config/databaseConnection');
require('./config/passport'); // registers Google/Facebook/Apple/Local strategies (auth) + serialize/deserialize (shared by payment routes too)
const { subscriptionCron } = require('./utils/CronJob/Cronjob');
const { authRoutes, authRoutesV2, paymentRoutes, paymentV2Routes, internalRoutes } = require('./routes');

const app = express();
const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Same cookie name + COOKIE_KEY as Backend1, so a session cookie set by
// this service's /api/v2/auth/local (or OAuth) login is readable there too.
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.COOKIE_KEY],
    maxAge: ONE_YEAR,
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

connectDatabase();
const cronTask = subscriptionCron();

app.get('/', (req, res) => res.send('Pickmymaid Backend2 (auth + payment)'));
app.get('/health', (req, res) => res.status(200).send({ status: 'ok', service: 'backend2-auth-payment' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v2/auth', authRoutesV2);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v2/payment', paymentV2Routes);
// Not exposed via nginx/Ingress — cluster/network-internal calls only
// (currently just Backend1's admin "verify payment" action).
app.use('/internal', internalRoutes);

module.exports = { app, cronTask };
