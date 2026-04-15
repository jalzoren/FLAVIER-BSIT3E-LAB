const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

class OTPService {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateGoogleSecret(username) {
    try {
      console.log('Generating secret for username:', username);
      
      const secret = speakeasy.generateSecret({
        name: `FlavierApp:${username}`,
        issuer: "FlavierApp",
        length: 20,
        encoding: 'base32'
      });
      
      if (!secret || !secret.base32 || !secret.otpauth_url) {
        throw new Error('Failed to generate valid secret');
      }
      
      console.log('Secret generated successfully');
      return secret;
    } catch (error) {
      console.error('Secret generation error:', error);
      throw new Error('Could not generate authentication secret');
    }
  }

  async generateQRCode(otpauth_url) {
    try {
      if (!otpauth_url) {
        throw new Error('Invalid OTP auth URL');
      }
      
      console.log('Generating QR code for URL');
      
      const qrCode = await qrcode.toDataURL(otpauth_url, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300
      });
      
      console.log('QR code generated successfully');
      return qrCode;
    } catch (err) {
      console.error('QR Code generation error:', err);
      return null;
    }
  }

  verifyGoogleToken(secret, token) {
    try {
      if (!secret || !token) {
        console.log('Missing secret or token');
        return false;
      }
      
      // Clean the token
      const cleanToken = String(token).trim().replace(/\s/g, '');
      
      if (cleanToken.length !== 6) {
        console.log('Invalid token length:', cleanToken.length);
        return false;
      }
      
      if (!/^\d+$/.test(cleanToken)) {
        console.log('Token contains non-digits');
        return false;
      }
      
      console.log('Verifying token:', cleanToken);
      
      // Try verification with different windows
      let isValid = false;
      
      // Try with window 0 (exact match)
      isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: cleanToken,
        window: 0,
        step: 30
      });
      
      if (isValid) {
        console.log('Verification successful with window 0');
        return true;
      }
      
      // Try with window 1 (30 seconds drift)
      isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: cleanToken,
        window: 1,
        step: 30
      });
      
      if (isValid) {
        console.log('Verification successful with window 1');
        return true;
      }
      
      // Try with window 2 (60 seconds drift)
      isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: cleanToken,
        window: 2,
        step: 30
      });
      
      if (isValid) {
        console.log('Verification successful with window 2');
        return true;
      }
      
      console.log('Verification failed for all windows');
      return false;
    } catch (err) {
      console.error('Token verification error:', err);
      return false;
    }
  }

  getCurrentGoogleToken(secret) {
    try {
      if (!secret) return null;
      
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        step: 30
      });
      
      return token;
    } catch (err) {
      console.error('Token generation error:', err);
      return null;
    }
  }
}

module.exports = new OTPService();