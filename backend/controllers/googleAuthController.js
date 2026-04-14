const supabase = require('../config/supabase');
const otpService = require('../services/otpService');

exports.setupGoogleAuth = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(`[SETUP] Google Auth for userId: ${userId}`);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('[SETUP] User not found:', error);
      return res.status(404).json({ message: "User not found" });
    }

    // Generate Google Authenticator secret
    const secret = otpService.generateGoogleSecret(user.username);
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    console.log(`[SETUP] Expires at: ${expiresAt.toISOString()}`);
    
    // First, delete ALL existing temp secrets for this user
    const { error: deleteError } = await supabase
      .from('temp_secrets')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error("[SETUP] Error deleting old secrets:", deleteError);
    }
    
    // Insert new temp secret
    const { data: insertedData, error: insertError } = await supabase
      .from('temp_secrets')
      .insert({
        user_id: userId,
        secret: secret.base32,
        username: user.username,
        expires_at: expiresAt.toISOString()
      })
      .select();

    if (insertError) {
      console.error("[SETUP] Error storing temp secret:", insertError);
      return res.status(500).json({ message: "Failed to setup Google Auth: " + insertError.message });
    }

    console.log("[SETUP] Temp secret inserted:", insertedData);

    // Generate QR code
    const qrCodeUrl = await otpService.generateQRCode(secret.otpauth_url);

    res.json({
      success: true,
      message: "Google Auth setup initiated. Please scan QR code with Google Authenticator.",
      qrCode: qrCodeUrl,
      secret: secret.base32,
      userId: userId,
      expiresIn: "10 minutes",
      expiresAt: expiresAt.toISOString()
    });

  } catch (err) {
    console.error("[SETUP] Error:", err);
    res.status(500).json({ message: "Failed to setup Google Auth: " + err.message });
  }
};

exports.verifyGoogleAuth = async (req, res) => {
  try {
    console.log("[VERIFY] Request received");
    const { userId, token } = req.body;
    
    if (!userId || !token) {
      console.error("[VERIFY] Missing userId or token");
      return res.status(400).json({ 
        success: false,
        message: "Missing userId or token"
      });
    }
    
    const tokenStr = String(token).trim();
    const now = new Date();
    
    console.log(`[VERIFY] userId: ${userId}, token: ${tokenStr}`);
    console.log(`[VERIFY] Current time: ${now.toISOString()}`);

    // Get ALL temp secrets for debugging
    const { data: allSecrets } = await supabase
      .from('temp_secrets')
      .select('*')
      .eq('user_id', userId);
    
    console.log(`[VERIFY] Found ${allSecrets?.length || 0} temp secrets for user`);
    
    if (allSecrets && allSecrets.length > 0) {
      allSecrets.forEach(secret => {
        console.log(`[VERIFY] Secret ID: ${secret.id}, expires_at: ${secret.expires_at}`);
      });
    }

    // Get valid (non-expired) temp secret
    const { data: tempSecret, error } = await supabase
      .from('temp_secrets')
      .select('*')
      .eq('user_id', userId)
      .gte('expires_at', now.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !tempSecret) {
      console.error("[VERIFY] No valid temp secret found");
      console.error("[VERIFY] Error details:", error);
      
      return res.status(400).json({ 
        success: false,
        message: "No pending Google Auth setup found. Please go back and setup again.",
        code: "NO_SETUP"
      });
    }

    console.log(`[VERIFY] Found valid temp secret ID: ${tempSecret.id}`);
    console.log(`[VERIFY] Secret expires at: ${tempSecret.expires_at}`);

    // Verify the code
    const verified = otpService.verifyGoogleToken(tempSecret.secret, tokenStr);

    console.log(`[VERIFY] Verification result: ${verified}`);

    if (verified) {
      // Update user with TOTP secret
      const { error: updateError } = await supabase
        .from('users')
        .update({ totp_secret: tempSecret.secret })
        .eq('id', userId);

      if (updateError) {
        console.error("[VERIFY] Error updating user:", updateError);
        return res.status(500).json({ message: "Failed to enable Google Auth" });
      }

      // Delete used temp secret
      await supabase
        .from('temp_secrets')
        .delete()
        .eq('id', tempSecret.id);

      console.log(`[VERIFY] ✅ Google Auth enabled for user ID: ${userId}`);

      return res.json({ 
        success: true,
        message: "Google Authenticator enabled successfully!",
        enabled: true,
        verified: true
      });
    }

    return res.status(400).json({ 
      success: false,
      message: "Invalid 6-digit code. Please check your Google Authenticator app and try again.",
      verified: false,
      code: "INVALID_CODE"
    });

  } catch (err) {
    console.error("[VERIFY] Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to verify Google Auth: " + err.message 
    });
  }
};

exports.getGoogleAuthStatus = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    console.log(`[STATUS] Checking status for userId: ${userId}`);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('totp_secret, username')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      enabled: !!user.totp_secret,
      username: user.username,
      userId: userId
    });

  } catch (err) {
    console.error("[STATUS] Error:", err);
    res.status(500).json({ message: "Failed to check status" });
  }
};

exports.disableGoogleAuth = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(`[DISABLE] Disabling Google Auth for userId: ${userId}`);
    
    const { error } = await supabase
      .from('users')
      .update({ totp_secret: null })
      .eq('id', userId);

    if (error) {
      return res.status(404).json({ message: "User not found" });
    }

    await supabase
      .from('temp_secrets')
      .delete()
      .eq('user_id', userId);

    console.log(`[DISABLE] Google Auth disabled for user ID: ${userId}`);

    res.json({ 
      message: "Google Authenticator disabled successfully.",
      disabled: true 
    });

  } catch (err) {
    console.error("[DISABLE] Error:", err);
    res.status(500).json({ message: "Failed to disable Google Auth" });
  }
};

// Add this to your googleAuthController.js for testing
exports.testVerify = async (req, res) => {
  try {
    const { token, secret } = req.body;
    const testSecret = secret || 'JBSWY3DPEHPK3PXP';
    
    const verified = otpService.verifyGoogleToken(testSecret, token);
    
    res.json({
      verified: verified,
      message: verified ? 'Code is valid!' : 'Code is invalid',
      token: token,
      secret: testSecret
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkAuthMethod = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    console.log(`[CHECK] Checking auth method for userId: ${userId}`);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('totp_secret, username')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      hasGoogleAuth: !!user.totp_secret,
      username: user.username
    });

  } catch (err) {
    console.error("[CHECK] Error:", err);
    res.status(500).json({ message: "Failed to check auth method" });
  }
};