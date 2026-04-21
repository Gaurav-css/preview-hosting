import Mailjet from 'node-mailjet';

const mailjet = new Mailjet({
    apiKey: process.env.MAILJET_API_KEY || 'dummy_key',
    apiSecret: process.env.MAILJET_SECRET_KEY || 'dummy_secret'
});

export async function sendOtpEmail(email: string, otp: string) {
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
        console.warn('Mailjet API/Secret Key not found. Mocking OTP send to:', email);
        console.warn('OTP IS:', otp);
        return; 
    }
    
    await mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
            {
                From: {
                    Email: process.env.MAILJET_FROM_EMAIL || 'support@webhosting.demo',
                    Name: 'Preview Hosting Auth',
                },
                To: [
                    {
                        Email: email,
                    },
                ],
                Subject: 'Your Verification Code',
                HTMLPart: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #0f172a; margin: 0; font-size: 24px;">Confirm your email</h2>
                    </div>
                    <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                        Here is the verification code you requested to access your account:
                    </p>
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 8px;">${otp}</span>
                    </div>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
                        This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.
                    </p>
                </div>
                `,
            },
        ],
    });
}
