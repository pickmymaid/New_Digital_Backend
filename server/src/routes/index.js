const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const jobRoutes = require('./jobapplication.routes');
const contactRoutes = require('./contact.routes');
const paymentRoutes = require('./payment.routes');
const blogRoutes = require('./blog.routes');
const paymentV2Routes = require('./v2/payment.routes');
const maidsV2Routes = require('./v2/maids.routes');
const authRoutesV2 = require('./v2/auth.routes');
const analyticsRoutes = require('./analytics.routes');
const testRoutes = require('./test.routes');

module.exports = {
  authRoutes,
  adminRoutes,
  jobRoutes,
  contactRoutes,
  paymentRoutes,
  blogRoutes,
  maidsV2Routes,
  paymentV2Routes,
  authRoutesV2,
  analyticsRoutes,
  testRoutes
}
