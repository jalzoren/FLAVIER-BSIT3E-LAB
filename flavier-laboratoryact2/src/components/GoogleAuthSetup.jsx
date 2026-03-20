import React, { useState, useEffect, useCallback } from 'react';
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

  const setupGoogleAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/setup-google-auth', { userId });
      setSecret(response.data.secret);
      setQrCode(response.data.qrCode);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to setup Google Authenticator'
      });
      navigate('/otp-method', { state: { userId, username } });
    } finally {
      setIsLoading(false);
    }
  }, [userId, username, navigate]);

  useEffect(() => {
    if (!userId || !username) {
      navigate('/');
      return;
    }
    setupGoogleAuth();
  }, [userId, username, navigate, setupGoogleAuth]);

  const verifyAndEnable = async () => {
    if (!token || token.length !== 6) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter a valid 6-digit code'
      });
      return;
    }

    setIsVerifying(true);
    try {
      await axios.post('http://localhost:5000/verify-and-enable-google-auth', {
        userId,
        token
      });

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Google Authenticator enabled successfully!',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate('/otp-method', { state: { userId, username } });
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to verify code'
      });
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
        <p className="subtitle">Scan the QR code with Google Authenticator app</p>

        <div className="qr-code-container">
          <img src={qrCode} alt="QR Code" className="qr-code" />
        </div>

        <div className="secret-container">
          <p className="secret-label">Or enter this secret manually:</p>
          <div className="secret-code">{secret}</div>
        </div>

        <div className="otp-input-container">
          <input
            type="text"
            className="otp-input"
            value={token}
            onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            maxLength="6"
          />
        </div>

        <button 
          className="verify-btn" 
          onClick={verifyAndEnable}
          disabled={isVerifying || token.length !== 6}
        >
          {isVerifying ? 'Verifying...' : 'VERIFY AND ENABLE'}
        </button>

        <button className="back-btn" onClick={() => navigate('/otp-method', { state: { userId, username } })}>
          BACK
        </button>
      </div>