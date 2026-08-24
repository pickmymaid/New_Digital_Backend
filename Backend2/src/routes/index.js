const authRoutes = require('./auth.routes');
const authRoutesV2 = require('./v2/auth.routes');
const paymentRoutes = require('./payment.routes');
const paymentV2Routes = require('./v2/payment.routes');
const internalRoutes = require('./internal.routes');

module.exports = {
  authRoutes,
  authRoutesV2,
  paymentRoutes,
  paymentV2Routes,
  internalRoutes,
};
