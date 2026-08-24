const { responseHandler } = require("../utils/responseHandler/responseHandler");

// Guards service-to-service routes. Callers must present the shared
// INTERNAL_SERVICE_TOKEN (set identically on every service in the cluster)
// in the x-internal-token header. This is a simple shared-secret check,
// not mTLS — sufficient inside a private cluster network, but note in
// ARCHITECTURE.md as a spot to harden later (mTLS / service mesh).
const internalAuth = (req, res, next) => {
  const token = req.headers['x-internal-token'];
  if (!token || token !== process.env.INTERNAL_SERVICE_TOKEN) {
    return responseHandler(res, 'UNAUTHORIZED', null, { message: 'Invalid or missing internal service token' });
  }
  next();
};

module.exports = { internalAuth };
