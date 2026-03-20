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
    totpSecret: null
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
                    © ${new Date().getFullYear()} Laurence James Flavier // Laboratory Activity2. All rights reserved.
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

// FIXED: Login endpoint - doesn't automatically send OTP
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

    // Just return user info, let the frontend choose verification method
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

// NEW: Send email OTP endpoint
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

// Setup Google Authenticator
app.post("/setup-google-auth", async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(`Setting up Google Auth for userId: ${userId}`);

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a secret for the user
    const secret = speakeasy.generateSecret({
      name: `MyApp (${user.username})`
    });

    // Store temporarily until verified
    tempSecrets[userId] = {
      secret: secret.base32,
      expiresAt: Date.now() + 10 * 60 * 1000
    };

    // Generate QR code (only QR, no secret key in response)
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      message: "Google Auth setup initiated",
      qrCode: qrCodeUrl,
      userId: userId
    });

  } catch (err) {
    console.error("Google Auth setup error:", err);
    res.status(500).json({ message: "Failed to setup Google Auth" });
  }
});

// Verify and enable Google Authenticator
app.post("/verify-and-enable-google-auth", (req, res) => {
  try {
    const { userId, token } = req.body;
    console.log(`Verifying Google Auth for userId: ${userId}`);

    const tempSecret = tempSecrets[userId];

    if (!tempSecret) {
      return res.status(400).json({ message: "No pending Google Auth setup found. Please start over." });
    }

    if (Date.now() > tempSecret.expiresAt) {
      delete tempSecrets[userId];
      return res.status(400).json({ message: "Setup expired. Please start over." });
    }

    const verified = speakeasy.totp.verify({
      secret: tempSecret.secret,
      encoding: 'base32',
      token: token,
      window: 1
    });

    if (verified) {
      const user = users.find(u => u.id === userId);
      if (user) {
        user.totpSecret = tempSecret.secret;
      }
      delete tempSecrets[userId];

      console.log(`Google Auth enabled for user: ${userId}`);
      return res.json({ 
        message: "Google Authenticator enabled successfully",
        enabled: true 
      });
    }

    return res.status(400).json({ 
      message: "Invalid code. Please try again.",
      verified: false 
    });

  } catch (err) {
    console.error("Google Auth verification error:", err);
    res.status(500).json({ message: "Failed to verify Google Auth" });
  }
});

// FIXED: Verify OTP endpoint - handles both email and TOTP
app.post("/verify-otp", (req, res) => {
  try {
    const { userId, otp, method } = req.body;
    console.log(`Verifying OTP for userId: ${userId}, method: ${method}`);

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle Google Authenticator (TOTP) verification
    if (method === 'google') {
      if (!user.totpSecret) {
        return res.status(400).json({ 
          message: "Google Authenticator not set up for this user",
          needsSetup: true 
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: otp,
        window: 1
      });

      if (verified) {
        console.log("TOTP verified successfully");
        return res.json({ 
          message: "Verification successful",
          verified: true,
          method: 'google'
        });
      } else {
        return res.status(400).json({ 
          message: "Invalid code from Google Authenticator",
          verified: false 
        });
      }
    }

    // Handle email OTP verification
    if (method === 'email') {
      const storedData = otpStore[userId];
      
      if (!storedData) {
        return res.status(400).json({ message: "OTP not found or expired. Please request a new one." });
      }

      if (Date.now() > storedData.expiresAt) {
        delete otpStore[userId];
        return res.status(400).json({ message: "OTP expired. Please request a new one." });
      }

      if (storedData.otp === otp) {
        delete otpStore[userId];
        console.log("Email OTP verified successfully");
        return res.json({ 
          message: "Verification successful",
          verified: true,
          method: 'email'
        });
      } else {
        return res.status(400).json({ 
          message: "Invalid OTP code. Please try again.",
          verified: false 
        });
      }
    }

    return res.status(400).json({ message: "Invalid verification method" });
    
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
});

// Check Google Auth status
app.get("/google-auth-status/:userId", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      enabled: !!user.totpSecret,
      username: user.username
    });

  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ message: "Failed to check status" });
  }
});

// Disable Google Authenticator
app.post("/disable-google-auth", (req, res) => {
  try {
    const { userId } = req.body;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.totpSecret = null;
    console.log(`Google Auth disabled for user: ${userId}`);

    res.json({ 
      message: "Google Authenticator disabled successfully",
      disabled: true 
    });

  } catch (err) {
    console.error("Disable error:", err);
    res.status(500).json({ message: "Failed to disable Google Auth" });
  }
});

// Cleanup function
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
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`📧 Email service: ${transporter.options.auth ? 'Configured' : 'Not configured'}`);
});