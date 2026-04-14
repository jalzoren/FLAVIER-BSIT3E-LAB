const supabase = require('../config/supabase');
const emailService = require('../services/emailService');
const otpService = require('../services/otpService');

exports.sendEmailOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = otpService.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    await supabase
      .from('otp_store')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'email');
    
    const { error: insertError } = await supabase
      .from('otp_store')
      .insert({
        user_id: userId,
        otp: otp,
        type: 'email',
        expires_at: expiresAt
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return res.status(500).json({ message: "Failed to store OTP" });
    }

    await emailService.sendOtpEmail(user.email, otp);
    console.log(`Email OTP sent to ${user.email}: ${otp}`);
    
    res.json({ 
      message: "OTP sent successfully",
      userId: userId
    });
    
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp, method } = req.body;
    console.log(`Verifying OTP for userId: ${userId}, method: ${method}`);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (method === 'google') {
      if (!user.totp_secret) {
        return res.status(400).json({ 
          message: "Google Authenticator not set up for this user.",
          needsSetup: true,
          code: "NOT_SETUP"
        });
      }

      const verified = otpService.verifyGoogleToken(user.totp_secret, otp, 1);

      if (verified) {
        console.log(`Login verified with Google Auth for user: ${user.username}`);
        return res.json({ 
          message: "Verification successful! Redirecting to your ID card...",
          verified: true,
          method: 'google'
        });
      } else {
        return res.status(400).json({ 
          message: "Invalid 6-digit code. Ensure your device time is correct.",
          verified: false,
          code: "INVALID"
        });
      }
    }

    if (method === 'email') {
      const { data: storedOTP, error: otpError } = await supabase
        .from('otp_store')
        .select('*')
        .eq('user_id', userId)
        .eq('otp', otp)
        .eq('type', 'email')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (otpError || !storedOTP) {
        return res.status(400).json({ 
          message: "Invalid or expired OTP. Please request a new one.",
          code: "INVALID_OR_EXPIRED"
        });
      }

      await supabase
        .from('otp_store')
        .delete()
        .eq('id', storedOTP.id);

      console.log(`Login verified with Email OTP for user: ${user.username}`);
      return res.json({ 
        message: "Verification successful! Redirecting to your ID card...",
        verified: true,
        method: 'email'
      });
    }

    return res.status(400).json({ message: "Invalid verification method" });
    
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};