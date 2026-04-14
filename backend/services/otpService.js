const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

class OTPService {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateGoogleSecret(username) {
    return speakeasy.generateSecret({
      name: `NewJeans (${username})`,
      issuer: "NewJeans ID",
      length: 20
    });
  }

  async generateQRCode(otpauth_url) {
    try {
      if (!otpauth_url) {
        throw new Error('Invalid OTP auth URL');
      }
      const qrCodeDataUrl = await qrcode.toDataURL(otpauth_url);
      return qrCodeDataUrl;
    } catch (err) {
      console.error('QR Code generation error:', err);
      throw new Error('Failed to generate QR code');
    }
  }

  verifyGoogleToken(secret, token, window = 1) {
    try {
      if (!secret || !token) {
        console.error('Missing secret or token for verification');
        return false;
      }
      
      const result = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token.toString().trim(),
        window: window,
        step: 30
      });
      
      console.log(`Verification result for token ${token}: ${result}`);
      return result;
    } catch (err) {
      console.error('Token verification error:', err);
      return false;
    }
  }

  getCurrentGoogleToken(secret) {
    try {
      return speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        step: 30
      });
    } catch (err) {
      console.error('Get current token error:', err);
      return null;
    }
  }
}

module.exports = new OTPService();