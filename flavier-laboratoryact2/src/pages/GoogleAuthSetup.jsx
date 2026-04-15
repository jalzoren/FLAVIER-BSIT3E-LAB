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
  }, []);

  const setupGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/google-auth/setup', {
        userId: Number(userId),
      });

      if (response.data.success) {
        setSecret(response.data.secret);
        setQrCode(response.data.qrCode);
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Setup Failed',
        text: error.response?.data?.message || 'Failed to setup. Please try again.',
      });
      navigate('/otp-method', { state: { userId, username } });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!token || token.length !== 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Code',
        text: 'Please enter the 6-digit code shown in Google Authenticator.',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await axios.post('http://localhost:5000/api/google-auth/verify', {
        userId: Number(userId),
        token: token.trim(),
      });

      if (response.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Google Authenticator has been enabled!',
          timer: 1500,
          showConfirmButton: false,
        });
        // Go directly to home - no second verification needed
        navigate('/home', { state: { userId, username } });
      }
    } catch (error) {
      console.error('Verification error:', error.response?.data);
      
      let errorMessage = 'Invalid code. Try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: errorMessage,
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
          <h1 className="title">Setting up...</h1>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="card">
        <h1 className="title">GOOGLE AUTHENTICATOR</h1>
        <p className="subtitle">Welcome, {username}</p>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 'bold', marginBottom: 6 }}>
            Scan this QR code with Google Authenticator
          </p>
          <div style={{ textAlign: 'center' }}>
            {qrCode && (
              <img src={qrCode} alt="QR Code" style={{ width: 200, height: 200 }} />
            )}
          </div>
        </div>

        {secret && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              Can't scan? Enter this code manually:
            </p>
            <div
              style={{
                backgroundColor: '#fef3c7',
                padding: '10px 14px',
                borderRadius: 6,
                fontFamily: 'monospace',
                fontSize: 14,
                fontWeight: 'bold',
                letterSpacing: 2,
                textAlign: 'center',
              }}
            >
              {secret}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 'bold', marginBottom: 6 }}>
            Enter the 6-digit code from Google Authenticator
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength="6"
            disabled={isVerifying}
            autoFocus
            style={{
              width: '100%',
              textAlign: 'center',
              letterSpacing: 10,
              fontSize: 28,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              padding: '12px',
              border: '2px solid #e2e8f0',
              borderRadius: 10,
            }}
          />
        </div>

        <button
          className="login-btn"
          onClick={verifyAndEnable}
          disabled={isVerifying || token.length !== 6}
        >
          {isVerifying ? 'Verifying...' : 'VERIFY & ENABLE'}
        </button>

        <button
          className="back-btn"
          onClick={() => navigate('/otp-method', { state: { userId, username } })}
          style={{ marginTop: 10 }}
        >
          BACK
        </button>
      </div>
    </div>
  );
}

export default GoogleAuthSetup;