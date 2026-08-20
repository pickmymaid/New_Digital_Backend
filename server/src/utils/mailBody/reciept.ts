export const recieptBody = (user: string, subscriptionDate: string, expiryDate: string, plan: string,) => {
    return`
    <html>
    <body>
        <p>Dear ${user},</p>
    
        <p>Thank you for subscribing to our service! Your subscription details are as follows:</p>
    
        <ul>
            <li><strong>Start Date:</strong> ${subscriptionDate}</li>
            <li><strong>Expiry Date:</strong> ${expiryDate}</li>
            <li><strong>Plan Name:</strong> ${plan}</li>
        </ul>
    
        <p>An attached receipt for your subscription is included with this email.</p>
    
        <p>If you have any questions or need assistance, please feel free to contact us.</p>
    
        <p>Best regards,<br>Pickmymaid LLC</p>
    <body>
  <html>`
}