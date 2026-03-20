import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../css/Auth.css';

function GoogleAuthSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, username } = location.state || {};
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!userId || !username) {
      navigate('/');
      return;
    }
    setupGoogleAuth();
  }, [userId, username]);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (token.length === 6 && !isVerifying) {
      verifyAndEnable();
    }
  }, [token]);

  const setupGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/setup-google-auth', { userId });
      setSecret(response.data.secret);
      setQrCode(response.data.qrCode);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Setup Failed',
        text: error.response?.data?.message || 'Failed to setup Google Authenticator'
      });
      navigate('/otp-method', { state: { userId, username } });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!token || token.length !== 6) {
      return;
    }

    setIsVerifying(true);
    try {
      const response = await axios.post('http://localhost:5000/verify-google-auth', {
        userId,
        token: token.toString().trim()
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Google Authenticator enabled successfully!',
          confirmButtonColor: '#8b5cf6',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          navigate('/otp-method', { state: { userId, username } });
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to verify code.';
      const code = error.response?.data?.code;
      
      let title = 'Verification Failed';
      let text = errorMsg;
      
      if (code === 'NO_SETUP') {
        title = 'Session Expired';
        text = 'Your setup session expired. Please start over.';
        navigate('/otp-method', { state: { userId, username } });
        return;
      } else if (code === 'EXPIRED') {
        title = 'Session Expired';
        text = 'Your setup session expired (10 minutes). Please start over.';
        navigate('/otp-method', { state: { userId, username } });
        return;
      } else if (code === 'INVALID_CODE') {
        title = 'Invalid Code';
        text = 'Try again with the current 6-digit code from your Authenticator';
      }
      
      Swal.fire({
        icon: 'error',
        title: title,
        text: text,
        confirmButtonColor: '#ef4444'
      });
      setToken('');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="card">
          <h1 className="title">Setting up Google Authenticator...</h1>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="card">
        <h1 className="title">SETUP GOOGLE AUTHENTICATOR</h1>
        <p className="subtitle">Step 1: Scan the QR code with Google Authenticator app</p>

        <div className="qr-code-container">
          {qrCode && <img src={qrCode} alt="QR Code" className="qr-code" />}
        </div>

        <div className="secret-container">
          <p className="secret-label">Or enter this secret manually:</p>
          <div className="secret-code">{secret}</div>
        </div>

        <p className="subtitle" style={{ marginTop: '20px' }}>
          Step 2: Enter the 6-digit code from Google Authenticator
        </p>

        <div className="otp-input-container">
          <input
            type="text"
            className="otp-input"
            value={token}
            onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength="6"
            autoFocus
            disabled={isVerifying}
            style={{
              textAlign: 'center',
              letterSpacing: '10px',
              fontSize: '32px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              padding: '15px'
            }}
          />
        </div>

        {isVerifying && (
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            color: '#667eea',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Verifying code...
          </div>
        )}

        <button 
          className="verify-btn" 
          onClick={verifyAndEnable}
          disabled={isVerifying || token.length !== 6}
          style={{ marginTop: '30px' }}
        >
          {isVerifying ? 'Verifying...' : 'VERIFY AND ENABLE'}
        </button>

        <button 
          className="back-btn" 
          onClick={() => navigate('/otp-method', { state: { userId, username } })}
          style={{ marginTop: '15px' }}
        >
          BACK
        </button>
      </div>
    </div>
  );
}

export default GoogleAuthSetup;