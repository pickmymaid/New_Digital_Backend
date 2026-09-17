const otpVerificationTemplate = (name, otp) => `
    <div>
        <p>Dear ${name},</p>
        <br><br>
        <p>
        Thank you for signing up with Pickmymaid. Please use the following One-Time Password (OTP) to verify your email address and complete your registration:
        <br><br>
        <h2>${otp}</h2>
        <br><br>
        This OTP is valid for 10 minutes. Please do not share it with anyone.
        <br><br>
        If you did not request this, please ignore this email.
        </p>
        <br><br>
        <p>
        Best regards,
        <br>
        Pickmymaid
        </p>
    </div>
`

module.exports = { otpVerificationTemplate };
