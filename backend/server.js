const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

const app = express();
app.use(cors());
app.use(express.json());

const users = [
  {
    id: 1,
    username: "jalgorithm",
    password: "jal01",
    email: "dumpblj@gmail.com",
    totpSecret: null,
    userDetails: {
      name: "jalgorithm",
      dateOfIssue: "2026-03-20",
      location: "BSIT3E",
      whatILike: "COFFEE",
      memberOf: "정보기술\nInformation Technology",
      profileImage: "/WONN.jpg"
    }
  },
  {
    id: 2,
    username: "hannimylovesosweet",
    password: "hannipham",
    email: "dumpblj@gmail.com",
    totpSecret: null,
    userDetails: {
      name: "HANNI PHAM",
      dateOfIssue: "2026-03-20",
      location: "BSIT3E",
      whatILike: "MILK TEA",
      memberOf: "정보기술\nInformation Technology",
      profileImage: "/HANNI.jpg"
    }
  },
  {
    id: 3,
    username: "joid",
    password: "joid123",
    email: "joid@example.com",
    totpSecret: null,
    userDetails: {
      name: "joid",
      dateOfIssue: "2026-03-20",
      location: "BSIT3E",
      whatILike: "BUBBLE TEA",
      memberOf: "정보기술\nInformation Technology",
      profileImage: "/WONN.jpg"
    }
  }
];

let otpStore = {};
let tempSecrets = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tacitustaesan@gmail.com",
    pass: "vmeybkqevpkaeyka"
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Transporter verification failed:", error);
  } else {
    console.log("Server is ready to send emails");
  }
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(to, otp) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Outfit', sans-serif; background-color: #f6f6f6;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f6f6; padding: 20px;">
          <tr>
          <td align="center">
            <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #eaeaea;">
                  <h1 style="margin: 0; color: #333333; font-size: 24px; font-weight: 600;">Verification Code</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                    Please use the following verification code:
                  </p>
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <span style="font-family: 'Courier New', monospace; font-size: 48px; font-weight: 700; color: #333333; letter-spacing: 8px;">${otp}</span>
                  </div>
                  <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; text-align: center;">
                    This code will expire in <strong>5 minutes</strong>
                  </p>
                  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea;">
                    <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5; text-align: center;">
                      For security reasons, never share this code with anyone.<br>
                      If you didn't request this code, please ignore this email.
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                  <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                    ${new Date().getFullYear()} Laurence James Flavier // Laboratory Activity2. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: '"Verification Service" <tacitustaesan@gmail.com>',
    to,
    subject: "Your Verification Code",
    text: `Your verification code is: ${otp}. This code will expire in 5 minutes.`,
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
}

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", username);

    const user = users.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    res.json({ 
      userId: user.id, 
      username: user.username,
      hasTotp: !!user.totpSecret,
      message: "Login successful. Please choose verification method."
    });
    
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Failed to process login" });
  }
});

app.get("/api/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Fetching user data for: ${username}`);

    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.userDetails.name || user.username,
      dateOfIssue: user.userDetails.dateOfIssue,
      location: user.userDetails.location,
      whatILike: user.userDetails.whatILike,
      memberOf: user.userDetails.memberOf,
      profileImage: user.userDetails.profileImage
    });
    
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
});

app.post("/send-email-otp", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();
    otpStore[userId] = {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      type: 'email'
    };

    await sendOtpEmail(user.email, otp);
    console.log(`Email OTP sent to ${user.email}: ${otp}`);
    
    res.json({ 
      message: "OTP sent successfully",
      userId: userId
    });
    
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// ========== GOOGLE AUTH SETUP (STEP 1) ==========
app.post("/setup-google-auth", async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(`[STEP 1] Setting up Google Auth for userId: ${userId}`);

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a new secret for Google Authenticator
    const secret = speakeasy.generateSecret({
      name: `NewJeans (${user.username})`,
      issuer: "NewJeans ID",
      length: 20
    });

    console.log(`Generated secret for ${user.username}:`, secret.base32);

    // Store temporary secret for verification
    tempSecrets[userId] = {
      secret: secret.base32,
      expiresAt: Date.now() + 10 * 60 * 1000,
      username: user.username,
      createdAt: new Date().toISOString()
    };

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    console.log(`[STEP 1] Google Auth setup initiated for user: ${user.username}`);
    
    res.json({
      success: true,
      message: "Google Auth setup initiated. Please scan QR code with Google Authenticator.",
      qrCode: qrCodeUrl,
      secret: secret.base32,
      userId: userId,
      expiresIn: "10 minutes"
    });

  } catch (err) {
    console.error("Google Auth setup error:", err);
    res.status(500).json({ message: "Failed to setup Google Auth" });
  }
});

// ========== VERIFY AND ENABLE GOOGLE AUTH (STEP 2) ==========
app.post("/verify-google-auth", (req, res) => {
  try {
    const { userId, token } = req.body;
    const tokenStr = String(token).trim();
    console.log(`[STEP 2] Verifying 6-digit code for userId: ${userId}, code: ${tokenStr}, type: ${typeof tokenStr}, length: ${tokenStr.length}`);

    const tempSecret = tempSecrets[userId];

    if (!tempSecret) {
      console.log(`[ERROR] No pending setup for userId: ${userId}. Available: ${Object.keys(tempSecrets).join(', ')}`);
      return res.status(400).json({ 
        success: false,
        message: "No pending Google Auth setup found. Please start over.",
        code: "NO_SETUP"
      });
    }

    if (Date.now() > tempSecret.expiresAt) {
      delete tempSecrets[userId];
      console.log(`[ERROR] Setup session expired for userId: ${userId}`);
      return res.status(400).json({ 
        success: false,
        message: "Setup session expired (10 minutes). Please start over.",
        code: "EXPIRED"
      });
    }

    console.log(`[DEBUG] Verifying with secret: ${tempSecret.secret}, username: ${tempSecret.username}`);

    // Verify the 6-digit TOTP token
    // Try verification with increasing window to be more forgiving of time sync issues
    let verified = speakeasy.totp.verify({
      secret: tempSecret.secret,
      encoding: 'base32',
      token: tokenStr,
      window: 4,  // Increased from 2 to 4 to allow for time sync variations
      step: 30
    });

    console.log(`[DEBUG] First verification attempt (window: 4): ${verified}`);

    // If failed, try generating what the code SHOULD be to help debug
    if (!verified) {
      const currentToken = speakeasy.totp({
        secret: tempSecret.secret,
        encoding: 'base32',
        step: 30
      });
      console.log(`[DEBUG] Expected token at current time: ${currentToken}, got: ${tokenStr}`);
      
      // Try with even larger window
      verified = speakeasy.totp.verify({
        secret: tempSecret.secret,
        encoding: 'base32',
        token: tokenStr,
        window: 6,  // Try even larger window
        step: 30
      });
      console.log(`[DEBUG] Second verification attempt (window: 6): ${verified}`);
    }

    console.log(`[DEBUG] Final verification result: ${verified}`);

    if (verified) {
      const user = users.find(u => u.id === userId);
      if (user) {
        user.totpSecret = tempSecret.secret;
        console.log(`[SUCCESS] Google Auth enabled for user: ${user.username} (ID: ${userId})`);
      }
      delete tempSecrets[userId];

      return res.json({ 
        success: true,
        message: "Google Authenticator enabled successfully! You can now use it for login.",
        enabled: true,
        verified: true
      });
    }

    return res.status(400).json({ 
      success: false,
      message: "Invalid 6-digit code. Please check your Google Authenticator app and make sure your device time is synced correctly.",
      verified: false,
      code: "INVALID_CODE"
    });

  } catch (err) {
    console.error("Google Auth verification error:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ message: "Failed to verify Google Auth: " + err.message });
  }
});

// ========== VERIFY OTP DURING LOGIN ==========
app.post("/verify-otp", (req, res) => {
  try {
    const { userId, otp, method } = req.body;
    console.log(`Verifying OTP for userId: ${userId}, method: ${method}`);

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (method === 'google') {
      if (!user.totpSecret) {
        console.log(`[ERROR] Google Auth not set up for user: ${user.username}`);
        return res.status(400).json({ 
          message: "Google Authenticator not set up for this user.",
          needsSetup: true,
          code: "NOT_SETUP"
        });
      }

      const otpStr = String(otp).trim();
      console.log(`[DEBUG] Verifying Google Auth OTP for user: ${user.username}, code: ${otpStr}, length: ${otpStr.length}`);
      
      // Generate expected token for debugging
      const expectedToken = speakeasy.totp({
        secret: user.totpSecret,
        encoding: 'base32',
        step: 30
      });
      console.log(`[DEBUG] Expected token at current time: ${expectedToken}, Received: ${otpStr}`);

      // Try verification with window 4
      let verified = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: otpStr,
        window: 4,
        step: 30
      });
      console.log(`[DEBUG] Verification attempt (window: 4): ${verified}`);

      // Try with larger window if failed
      if (!verified) {
        verified = speakeasy.totp.verify({
          secret: user.totpSecret,
          encoding: 'base32',
          token: otpStr,
          window: 6,
          step: 30
        });
        console.log(`[DEBUG] Verification attempt (window: 6): ${verified}`);
      }

      if (verified) {
        console.log(`[SUCCESS] Login verified with Google Auth for user: ${user.username}`);
        return res.json({ 
          message: "Verification successful! Redirecting to your ID card...",
          verified: true,
          method: 'google'
        });
      } else {
        console.log(`[DEBUG] Invalid Google Auth code for user: ${user.username}, received: ${otpStr}`);
        return res.status(400).json({ 
          message: "Invalid 6-digit code. Ensure your device time is correct and use the current code.",
          verified: false,
          code: "INVALID"
        });
      }
    }

    if (method === 'email') {
      const storedData = otpStore[userId];
      
      if (!storedData) {
        return res.status(400).json({ 
          message: "OTP not found or expired. Please request a new one.",
          code: "NOT_FOUND"
        });
      }

      if (Date.now() > storedData.expiresAt) {
        delete otpStore[userId];
        return res.status(400).json({ 
          message: "OTP expired. Please request a new one.",
          code: "EXPIRED"
        });
      }

      if (storedData.otp === otp) {
        delete otpStore[userId];
        console.log(`[SUCCESS] Login verified with Email OTP for user: ${user.username}`);
        return res.json({ 
          message: "Verification successful! Redirecting to your ID card...",
          verified: true,
          method: 'email'
        });
      } else {
        console.log(`[DEBUG] Invalid email OTP - Expected: ${storedData.otp}, Got: ${otp}`);
        return res.status(400).json({ 
          message: "Invalid OTP code. Please try again.",
          verified: false,
          code: "INVALID"
        });
      }
    }

    return res.status(400).json({ message: "Invalid verification method" });
    
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
});

app.get("/google-auth-status/:userId", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      enabled: !!user.totpSecret,
      username: user.username,
      userId: user.id
    });

  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ message: "Failed to check status" });
  }
});

app.post("/disable-google-auth", (req, res) => {
  try {
    const { userId } = req.body;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.totpSecret = null;
    console.log(`Google Auth disabled for user: ${user.username} (ID: ${userId})`);

    res.json({ 
      message: "Google Authenticator disabled successfully. You will now use email verification.",
      disabled: true 
    });

  } catch (err) {
    console.error("Disable error:", err);
    res.status(500).json({ message: "Failed to disable Google Auth" });
  }
});

app.get("/check-auth-method/:userId", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      hasGoogleAuth: !!user.totpSecret,
      username: user.username
    });

  } catch (err) {
    console.error("Check auth method error:", err);
    res.status(500).json({ message: "Failed to check auth method" });
  }
});

// Debug endpoint to check temp secrets
app.get("/debug/temp-secrets", (req, res) => {
  res.json({
    tempSecrets: Object.keys(tempSecrets).map(key => ({
      userId: key,
      hasSecret: !!tempSecrets[key],
      expiresAt: tempSecrets[key]?.expiresAt,
      username: tempSecrets[key]?.username
    }))
  });
});

setInterval(() => {
  const now = Date.now();
  
  Object.keys(otpStore).forEach(key => {
    if (now > otpStore[key].expiresAt) {
      delete otpStore[key];
      console.log(`Cleaned up expired OTP for userId: ${key}`);
    }
  });

  Object.keys(tempSecrets).forEach(key => {
    if (now > tempSecrets[key].expiresAt) {
      delete tempSecrets[key];
      console.log(`Cleaned up expired temp secret for userId: ${key}`);
    }
  });
}, 60 * 1000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Server is ready with Google Authenticator support!`);
  console.log(`Make sure your phone time is synced correctly for TOTP to work`);
});