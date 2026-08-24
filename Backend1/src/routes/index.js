const adminRoutes = require('./admin.routes');
const jobRoutes = require('./jobapplication.routes');
const contactRoutes = require('./contact.routes');
const blogRoutes = require('./blog.routes');
const maidsV2Routes = require('./v2/maids.routes');
const analyticsRoutes = require('./analytics.routes');
const testRoutes = require('./test.routes');

module.exports = {
  adminRoutes,
  jobRoutes,
  contactRoutes,
  blogRoutes,
  maidsV2Routes,
  analyticsRoutes,
  testRoutes,
};
