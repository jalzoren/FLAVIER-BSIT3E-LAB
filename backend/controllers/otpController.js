const supabase = require('../config/supabase');
const emailService = require('../services/emailService');
const otpService = require('../services/otpService');

exports.sendEmailOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(`[EMAIL OTP] Request for userId: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .select('email, username')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error("[EMAIL OTP] User not found:", error);
      return res.status(404).json({ message: "User not found" });
    }

    const otp = otpService.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // Delete old OTPs
    await supabase
      .from('otp_store')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'email');
    
    // Store new OTP
    const { error: insertError } = await supabase
      .from('otp_store')
      .insert({
        user_id: userId,
        otp: otp,
        type: 'email',
        expires_at: expiresAt
      });

    if (insertError) {
      console.error("[EMAIL OTP] Store error:", insertError);
      return res.status(500).json({ message: "Failed to store OTP" });
    }

    // Send email
    const emailSent = await emailService.sendOtpEmail(user.email, otp);
    
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send email" });
    }
    
    console.log(`[EMAIL OTP] ✅ Sent to ${user.email}: ${otp}`);
    
    res.json({ 
      message: "OTP sent successfully",
      userId: userId,
      otp: otp // Remove this in production, just for testing
    });
    
  } catch (err) {
    console.error("[EMAIL OTP] Error:", err);
    res.status(500).json({ message: "Failed to send OTP: " + err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp, method } = req.body;
    console.log(`[VERIFY OTP] User ${userId}, Method: ${method}, OTP: ${otp}`);

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
          message: "Google Authenticator not set up",
          needsSetup: true
        });
      }

      const verified = otpService.verifyGoogleToken(user.totp_secret, otp, 2);

      if (verified) {
        return res.json({ 
          message: "Verification successful!",
          verified: true,
          method: 'google'
        });
      } else {
        return res.status(400).json({ 
          message: "Invalid 6-digit code. Please try again.",
          verified: false
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
          message: "Invalid or expired OTP. Please request a new one."
        });
      }

      await supabase
        .from('otp_store')
        .delete()
        .eq('id', storedOTP.id);

      return res.json({ 
        message: "Verification successful!",
        verified: true,
        method: 'email'
      });
    }

    return res.status(400).json({ message: "Invalid verification method" });
    
  } catch (err) {
    console.error("[VERIFY OTP] Error:", err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(`[RESEND OTP] Request for userId: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .select('email, username')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = otpService.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // Delete old OTPs
    await supabase
      .from('otp_store')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'email');
    
    // Store new OTP
    const { error: insertError } = await supabase
      .from('otp_store')
      .insert({
        user_id: userId,
        otp: otp,
        type: 'email',
        expires_at: expiresAt
      });

    if (insertError) {
      return res.status(500).json({ message: "Failed to store OTP" });
    }

    // Send email
    await emailService.sendOtpEmail(user.email, otp);
    
    console.log(`[RESEND OTP] ✅ Sent to ${user.email}: ${otp}`);
    
    res.json({ 
      message: "OTP resent successfully",
      userId: userId
    });
    
  } catch (err) {
    console.error("[RESEND OTP] Error:", err);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};