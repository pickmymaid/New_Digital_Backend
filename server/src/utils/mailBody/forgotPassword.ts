export const forgetPasswordTemplate = (name: string,link: string) => `
    <div>
        <p>Dear ${name},</p>
        <br><br>
        <p>
        We hope this message finds you well. It appears that you've requested to reset your password for your Pickmymaid account. We're here to assist you in securely updating your login credentials.
        <br><br>
        To reset your password, please click on the following link:
        <br><br>
        <a href=${link}>Click here to reset password</a>
        <br><br>
        If you did not initiate this request or if you have any concerns about the security of your account, please contact our support team immediately at support@pickmymaid.com.
        <br><br>
        For security purposes, please do not share this email with anyone. The link provided is unique to your account and will expire after a certain period.
        <br><br>
        Thank you for choosing Pickmymaid. We appreciate your trust in our service.
        </p>
        <br><br>
        <p>
        Best regards,
        <br>
        Pickmymaid
        </p>
    </div>
`