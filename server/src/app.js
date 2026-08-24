const dns = require("dns");

try {
  dns.setDefaultResultOrder?.("ipv4first");
  console.log("dns defaultResultOrder:", dns.getDefaultResultOrder && dns.getDefaultResultOrder());
} catch (e) {
  console.warn("dns.setDefaultResultOrder not available on this Node version");
}


const express = require('express');
require('dotenv').config();
const logger = require('morgan');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const { connectDatabase } = require('./config/databaseConnection');
const { adminRoutes, authRoutes, jobRoutes, paymentRoutes, contactRoutes, blogRoutes, paymentV2Routes, maidsV2Routes, authRoutesV2, analyticsRoutes, testRoutes } = require('./routes');
const cookieSession = require('cookie-session');
const multer = require('multer');
const { subscriptionCron } = require('./utils/CronJob/Cronjob');
const path = require('path');
const { setupSwagger } = require('./config/swagger');
const passport = require('passport');
const cookieParser = require('cookie-parser');
// configure environment variables


// require('./config/passport')
require('./config/passport');

const app = express();

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

// Middlewarep
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.COOKIE_KEY],
    maxAge: ONE_YEAR
  })
);

// register regenerate & save after the cookieSession middleware initialization
app.use(function(req, _, next) {
  if (req.session && !req.session.regenerate) {
      req.session.regenerate = (cb) => {
          cb()
      }
  }
  if (req.session && !req.session.save) {
      req.session.save = (cb) => {
          cb()
      }
  }
  next()
})

// Parse Cookies
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())

app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));


// parse application/json
app.use('*/images', express.static('./public/uploads'));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Connect to database
connectDatabase();

subscriptionCron();
// Setup the cors
app.use(cors({
  origin: true,
  credentials: true //Allow session cookie from browser to pass through
})); //cors Configuration for development

app.get('/', (req, res) => {
  res.send('Pickmymaid');
});

app.get('/health', (req, res) => {
  res.status(200).send({ status: "ok" });
})

// Server routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/job', jobRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/blog', blogRoutes)
app.use('/api/v2/payment',paymentV2Routes)
app.use('/api/v2/maids',maidsV2Routes)
app.use('/api/v1/analytics', analyticsRoutes)
app.use('/api/v2/auth', authRoutesV2)
app.use('/api/v1/test', testRoutes)

setupSwagger(app);

const rootDir = __dirname;
module.exports.rootDir = rootDir;
module.exports.app = app;
