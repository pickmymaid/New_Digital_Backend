const { paymentModel } = require('../../models/payment/payment.model');

// Runs from a K8s CronJob (see k8s/05-backend2-cronjob.yaml), triggered via
// the /internal/expire-subscriptions route — not scheduled in-process
// anymore, so this is safe to call from any number of Backend2 replicas.
const expireSubscriptions = async () => {
  const expiredSubscriptions = await paymentModel.find({
    expiryDate: { $lt: new Date() },
    status: { $ne: 2 }, // Exclude already expired subscriptions
  });

  for (const subscription of expiredSubscriptions) {
    subscription.status = 2; // Expired status
    await subscription.save();
  }

  return { expiredCount: expiredSubscriptions.length };
};

module.exports = { expireSubscriptions };
