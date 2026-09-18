const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

const sendOTPEmail = async (toEmail, otpCode) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in .env');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `EcoChargeHub <${FROM_EMAIL}>`,
      to: toEmail,
      subject: '🔐 Your EcoChargeHub Login Code',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f7f9f7; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px;">
            <div style="text-align: center; font-size: 40px;">🍃</div>
            <h1 style="color: #17201a; text-align: center;">EcoChargeHub Login</h1>
            <p style="color: #66736a; text-align: center;">Use this code to sign in</p>
            <div style="background: #eaf7ec; border: 2px dashed #238636; border-radius: 12px; padding: 30px; text-align: center; margin: 25px 0;">
              <p style="font-size: 44px; font-weight: 800; color: #238636; letter-spacing: 12px; margin: 0; font-family: monospace;">${otpCode}</p>
            </div>
            <p style="color: #66736a; font-size: 13px; text-align: center;">⏱️ Expires in 5 minutes</p>
            <p style="color: #8b9590; font-size: 12px; text-align: center; margin-top: 30px;">© 2026 EcoChargeHub</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(error.message);
    }

    console.log('✅ OTP email sent to:', toEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    throw error;
  }
};

module.exports = { sendOTPEmail };