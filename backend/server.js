const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

const users = [
  {
    id: 1,
    username: "jalgorithm",
    password: "jal01",
    email: "dumpblj@gmail.com"
  }
];

let otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tacitustaesan@gmail.com",
    pass: "vmeybkqevpkaeyka"         
  }
});

transporter.verify()


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
    <body style="margin: 0; padding: 0; font-family: "Outfit", sans-serif; background-color: #f6f6f6;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f6f6; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #eaeaea;">
                  <h1 style="margin: 0; color: #333333; font-size: 24px; font-weight: 600;">Verification Code</h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                    Please use the following verification code to complete your action:
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

  return transporter.sendMail({
    from: "tacitustaesan@gmail.com",
    to,
    subject: "Your Verification Code",
    text: `Your verification code is: ${otp}. This code will expire in 5 minutes. For security, never share this code with anyone.`, // Plain text fallback
    html: htmlContent
  });
}

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", username);

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    console.log("Invalid credentials for:", username);
    return res.status(401).json({ message: "Invalid credentials!" });
  }

  const otp = generateOtp();

  otpStore[user.id] = {
    otp: otp,
    expiresAt: Date.now() + 5 * 60 * 1000 
  };

  console.log(`Generated OTP for ${username}: ${otp}`);

  try {
    await sendOtpEmail(user.email, otp);
    console.log(`OTP email sent to: ${user.email}`);
    res.json({ userId: user.id, message: "OTP sent to your email!" });
  } catch (err) {
    console.error("SMTP send error:", err);
    res.status(500).json({ message: "Failed to send OTP!" });
  }
});

app.post("/verify-otp", (req, res) => {
  const { userId, otp } = req.body;
  console.log(`Verifying OTP for userId: ${userId}`, otp);

  if (!userId || !otp) {
    return res.status(400).json({ message: "userId and OTP required" });
  }

  const storedData = otpStore[userId];

  if (!storedData) {
    return res.status(400).json({ message: "OTP not found" });
  }

  if (Date.now() > storedData.expiresAt) {
    delete otpStore[userId];
    console.log("OTP expired");
    return res.status(400).json({ message: "OTP expired" });
  }

  if (storedData.otp === otp) {
    delete otpStore[userId];
    console.log("OTP verified");
    return res.json({ message: "OTP verified" });
  }

  console.log("Invalid OTP");
  return res.status(400).json({ message: "Invalid OTP" });
});

app.listen(5000, () => console.log("Backend running on port 5000"));