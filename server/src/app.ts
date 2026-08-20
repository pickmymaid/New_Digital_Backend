import dns from "dns";

try {
  dns.setDefaultResultOrder?.("ipv4first");
  console.log("dns defaultResultOrder:", dns.getDefaultResultOrder && dns.getDefaultResultOrder());
} catch (e) {
  console.warn("dns.setDefaultResultOrder not available on this Node version");
}


import express, { Application, Request, Response } from 'express';
require('dotenv').config();
import logger from 'morgan';
const fileUpload = require('express-fileupload');
import cors from 'cors';
import { connectDatabase } from './config/databaseConnection';
import { adminRoutes, authRoutes, jobRoutes, paymentRoutes, contactRoutes, blogRoutes, paymentV2Routes, maidsV2Routes, authRoutesV2, analyticsRoutes, testRoutes } from './routes';
import cookieSession from 'cookie-session'
import multer from 'multer';
import { subscriptionCron } from './utils/CronJob/Cronjob';
import path from 'path';
import { setupSwagger } from './config/swagger';
import passport from 'passport'
import cookieParser from 'cookie-parser'
// configure environment variables


// import './config/passport'
import './config/passport'

const app: Application = express();

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

// Middlewarep
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.COOKIE_KEY as any],
    maxAge: ONE_YEAR
  })
);

// register regenerate & save after the cookieSession middleware initialization
app.use(function(req, _, next) {
  if (req.session && !req.session.regenerate) {
      req.session.regenerate = (cb:any) => {
          cb()
      }
  }
  if (req.session && !req.session.save) {
      req.session.save = (cb: any) => {
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

app.get('/', (req: Request, res: Response) => {
  res.send('Pickmymaid');
});

app.get('/health', (req: Request, res: Response) => {
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

export const rootDir = __dirname;
export { app };
