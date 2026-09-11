const express = require('express');
const { internalAuth } = require('../middleware/internalAuth');
const { verifyPaymentService } = require('../services/v2/payment.service');
const { expireSubscriptions } = require('../utils/CronJob/Cronjob');
const { responseHandler } = require('../utils/responseHandler/responseHandler');
const logger = require('../config/logger');
const { logErrorWithSource } = logger;

const router = express.Router();

// Service-to-service only — called by Backend1's admin "verify payment"
// action. Not reachable from outside the cluster (no Ingress rule routes to
// this path; the internalAuth shared-secret check is the second layer).
router.post('/verify-payment', internalAuth, async (req, res) => {
  const { ref, user_id } = req.body;
  try {
    const data = await verifyPaymentService(ref, user_id);
    responseHandler(res, 'OK', data);
  } catch (error) {
    logErrorWithSource(error, { meta: { body: req.body } });
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { message: error });
  }
});

// Triggered on a schedule by the K8s CronJob in
// k8s/05-backend2-cronjob.yaml, not run in-process — safe to call
// concurrently with any number of Backend2 replicas running.
router.post('/expire-subscriptions', internalAuth, async (req, res) => {
  try {
    const data = await expireSubscriptions();
    responseHandler(res, 'OK', data);
  } catch (error) {
    logErrorWithSource(error, {});
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { message: error });
  }
});

module.exports = router;
