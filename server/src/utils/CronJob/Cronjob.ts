import cron from 'node-cron';
import { paymentModel } from '../../models/payment/payment.model';


export const subscriptionCron = ()=>{

    cron.schedule('0 0 * * *', async () => {
        try {
            console.log("Started cron")
          // Find subscriptions that are expired
          const expiredSubscriptions = await paymentModel.find({
            expiryDate: { $lt: new Date() },
            status: { $ne: 2 }, // Exclude already expired subscriptions
          });
      
          // Update status to 'expired' for each expired subscription
          for (const subscription of expiredSubscriptions) {
            subscription.status = 2; // Expired status
            await subscription.save();
          }
      
          console.log('Subscription statuses updated successfully.');
        } catch (error) {
          console.error('An error occurred while updating subscription statuses:', error);
        }
      });
      
}
