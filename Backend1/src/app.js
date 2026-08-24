const dns = require("dns");
try {
  dns.setDefaultResultOrder?.("ipv4first");
} catch (e) {
  console.warn("dns.setDefaultResultOrder not available on this Node version");
}

const express = require('express');
require('dotenv').config();
const logger = require('morgan');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const { connectDatabase } = require('./config/databaseConnection');
const passport = require('./config/passportSession'); // session decode only, no OAuth strategies here
const { setupSwagger } = require('./config/swagger');
const { adminRoutes, jobRoutes, contactRoutes, blogRoutes, maidsV2Routes, analyticsRoutes, testRoutes } = require('./routes');

const app = express();
const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Same cookie name + COOKIE_KEY as Backend2, so a session started there
// is readable here too (cookie-session keeps session data in the cookie).
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

app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));

app.use('*/images', express.static('./public/uploads'));
app.use('/public', express.static(path.join(__dirname, 'public')));

connectDatabase();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.get('/', (req, res) => res.send('Pickmymaid Backend1 (admin/maids/blog/contact/analytics)'));
app.get('/health', (req, res) => res.status(200).send({ status: 'ok', service: 'backend1' }));

app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/job', jobRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v2/maids', maidsV2Routes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/test', testRoutes);

setupSwagger(app);

const rootDir = __dirname;
module.exports.rootDir = rootDir;
module.exports.app = app;
