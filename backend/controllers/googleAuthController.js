const supabase = require('../config/supabase');
const otpService = require('../services/otpService');

class GoogleAuthController {
  async setupGoogleAuth(req, res) {
    try {
      console.log('=== SETUP GOOGLE AUTH START ===');
      console.log('Request body:', req.body);
      
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid User ID format'
        });
      }

      // Clean up any existing temp secrets for this user
      await supabase
        .from('temp_secrets')
        .delete()
        .eq('user_id', parsedUserId);

      // Get user from database
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, username, email, totp_secret')
        .eq('id', parsedUserId)
        .single();

      if (userError || !user) {
        console.error('User fetch error:', userError);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('User found:', user.username);

      // Generate new secret for Google Authenticator
      const secret = otpService.generateGoogleSecret(user.username);
      
      if (!secret || !secret.base32) {
        throw new Error('Failed to generate secret');
      }

      // Store temporary secret (increased to 30 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      const { error: tempError } = await supabase
        .from('temp_secrets')
        .insert([{
          user_id: parsedUserId,
          secret: secret.base32,
          username: user.username,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }]);

      if (tempError) {
        console.error('Error storing temp secret:', tempError);
        return res.status(500).json({
          success: false,
          message: 'Failed to setup authentication: ' + tempError.message
        });
      }

      console.log('Temp secret saved, expires at:', expiresAt.toISOString());

      // Generate QR code
      let qrCode = null;
      if (secret.otpauth_url) {
        qrCode = await otpService.generateQRCode(secret.otpauth_url);
      }

      res.json({
        success: true,
        secret: secret.base32,
        qrCode: qrCode,
        expiresAt: expiresAt.toISOString(),
        message: 'Google Authenticator setup initialized'
      });

    } catch (error) {
      console.error('Setup error details:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during setup: ' + error.message
      });
    }
  }

  async verifyGoogleAuth(req, res) {
    try {
      console.log('=== VERIFY GOOGLE AUTH START ===');
      console.log('Request body:', req.body);
      
      const { userId, token } = req.body;

      if (!userId || !token) {
        return res.status(400).json({
          success: false,
          message: 'User ID and token are required'
        });
      }

      const cleanToken = String(token).trim();
      
      if (cleanToken.length !== 6 || !/^\d+$/.test(cleanToken)) {
        return res.status(400).json({
          success: false,
          message: 'Token must be a 6-digit number'
        });
      }

      const parsedUserId = parseInt(userId);
      
      // Get temporary secret (not expired)
      const { data: tempSecrets, error: tempError } = await supabase
        .from('temp_secrets')
        .select('*')
        .eq('user_id', parsedUserId)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('Temp secrets found:', tempSecrets ? tempSecrets.length : 0);
      
      if (tempError) {
        console.error('Temp secret fetch error:', tempError);
        return res.status(400).json({
          success: false,
          message: 'Error checking setup session'
        });
      }

      if (!tempSecrets || tempSecrets.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No pending setup found. Please go back and start over.'
        });
      }

      const secretData = tempSecrets[0];
      console.log('Found active temp secret');
      console.log('Verifying token:', cleanToken);

      const speakeasy = require('speakeasy');
      let isValid = false;
      
      // Use LARGER window to accept the code (from -10 to +10 = 10 minutes tolerance)
      for (let window = -10; window <= 10; window++) {
        const isValidForWindow = speakeasy.totp.verify({
          secret: secretData.secret,
          encoding: 'base32',
          token: cleanToken,
          window: window,
          step: 30
        });
        
        if (isValidForWindow) {
          isValid = true;
          console.log(`✓ VERIFIED at window ${window}`);
          break;
        }
      }

      if (!isValid) {
        const currentToken = speakeasy.totp({
          secret: secretData.secret,
          encoding: 'base32',
          step: 30
        });
        
        console.log('Current expected token:', currentToken);
        console.log('User provided token:', cleanToken);
        
        // Try to find any matching token in an even wider range
        let foundMatch = false;
        for (let window = -15; window <= 15; window++) {
          const testToken = speakeasy.totp({
            secret: secretData.secret,
            encoding: 'base32',
            step: 30,
            window: window
          });
          
          if (testToken === cleanToken) {
            foundMatch = true;
            console.log(`Found matching token at window ${window}`);
            break;
          }
        }
        
        if (foundMatch) {
          // Accept the code
          isValid = true;
          console.log('Accepting code due to manual match');
        } else {
          return res.status(400).json({
            success: false,
            message: `Invalid code. Please enter the current 6-digit code from Google Authenticator.`
          });
        }
      }

      // Update user with TOTP secret
      const { error: updateError } = await supabase
        .from('users')
        .update({ totp_secret: secretData.secret })
        .eq('id', parsedUserId);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to save authentication method'
        });
      }

      // Clean up temporary secret
      await supabase
        .from('temp_secrets')
        .delete()
        .eq('user_id', parsedUserId);

      console.log('Google Authenticator enabled successfully for user:', parsedUserId);

      res.json({
        success: true,
        message: 'Google Authenticator enabled successfully'
      });

    } catch (error) {
      console.error('Verification error details:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during verification: ' + error.message
      });
    }
  }

  async directVerify(req, res) {
    try {
      console.log('=== DIRECT VERIFY ===');
      const { userId, token } = req.body;

      if (!userId || !token) {
        return res.status(400).json({
          success: false,
          message: 'User ID and token are required'
        });
      }

      const cleanToken = String(token).trim();
      const parsedUserId = parseInt(userId);

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('totp_secret, username')
        .eq('id', parsedUserId)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.totp_secret) {
        return res.status(400).json({
          success: false,
          message: 'Google Authenticator not set up for this user'
        });
      }

      const speakeasy = require('speakeasy');
      let isValid = false;
      
      // Use larger window for direct verify
      for (let window = -10; window <= 10; window++) {
        const isValidForWindow = speakeasy.totp.verify({
          secret: user.totp_secret,
          encoding: 'base32',
          token: cleanToken,
          window: window,
          step: 30
        });
        
        if (isValidForWindow) {
          isValid = true;
          console.log(`✓ Direct verify matched at window ${window}`);
          break;
        }
      }

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code. Please try again.'
        });
      }

      res.json({
        success: true,
        message: 'Verification successful'
      });

    } catch (error) {
      console.error('Direct verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during verification'
      });
    }
  }

  async debugToken(req, res) {
    try {
      const { userId } = req.params;
      const parsedUserId = parseInt(userId);
      
      const { data: user, error } = await supabase
        .from('users')
        .select('totp_secret, username')
        .eq('id', parsedUserId)
        .single();
      
      if (error || !user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const speakeasy = require('speakeasy');
      const results = {
        userId: parsedUserId,
        username: user.username,
        hasTotp: !!user.totp_secret,
        serverTime: new Date().toISOString(),
        serverTimestamp: Date.now(),
        tokens: {}
      };
      
      if (user.totp_secret) {
        for (let window = -10; window <= 10; window++) {
          const token = speakeasy.totp({
            secret: user.totp_secret,
            encoding: 'base32',
            step: 30,
            window: window
          });
          results.tokens[`window_${window}`] = token;
        }
        
        results.currentToken = speakeasy.totp({
          secret: user.totp_secret,
          encoding: 'base32',
          step: 30
        });
      }
      
      res.json({
        success: true,
        debug: results
      });
      
    } catch (error) {
      console.error('Debug error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async checkAuthMethod(req, res) {
    try {
      const { userId } = req.params;
      const parsedUserId = parseInt(userId);

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('totp_secret')
        .eq('id', parsedUserId)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        hasTotp: !!user.totp_secret
      });

    } catch (error) {
      console.error('Check auth method error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  async getGoogleAuthStatus(req, res) {
    try {
      const { userId } = req.params;
      const parsedUserId = parseInt(userId);

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('totp_secret')
        .eq('id', parsedUserId)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        enabled: !!user.totp_secret
      });

    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  async disableGoogleAuth(req, res) {
    try {
      const { userId } = req.body;
      const parsedUserId = parseInt(userId);

      const { error: updateError } = await supabase
        .from('users')
        .update({ totp_secret: null })
        .eq('id', parsedUserId);

      if (updateError) {
        console.error('Error disabling TOTP:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to disable Google Authenticator'
        });
      }

      res.json({
        success: true,
        message: 'Google Authenticator disabled successfully'
      });

    } catch (error) {
      console.error('Disable error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  async resetGoogleAuth(req, res) {
    try {
      const { userId } = req.body;
      const parsedUserId = parseInt(userId);
      
      await supabase
        .from('users')
        .update({ totp_secret: null })
        .eq('id', parsedUserId);
      
      await supabase
        .from('temp_secrets')
        .delete()
        .eq('user_id', parsedUserId);
      
      res.json({
        success: true,
        message: 'Google Authenticator has been reset'
      });
      
    } catch (error) {
      console.error('Reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during reset'
      });
    }
  }

  async cleanupExpiredSecrets(req, res) {
    try {
      await supabase
        .from('temp_secrets')
        .delete()
        .lt('expires_at', new Date().toISOString());

      res.json({
        success: true,
        message: 'Expired secrets cleaned up'
      });
    } catch (error) {
      console.error('Cleanup error:', error);
      res.status(500).json({
        success: false,
        message: 'Cleanup failed'
      });
    }
  }
}

module.exports = new GoogleAuthController();