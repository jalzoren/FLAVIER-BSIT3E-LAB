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
  const [setupComplete, setSetupComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    if (!userId || !username) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Missing user information. Please login again.'
      }).then(() => {
        navigate('/');
      });
      return;
    }
    setupGoogleAuth();
  }, [userId, username]);

  useEffect(() => {
    if (setupComplete && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            Swal.fire({
              icon: 'warning',
              title: 'QR Code Expired',
              text: 'Setup session expired. Please go back and try again.',
              confirmButtonColor: '#ef4444'
            }).then(() => {
              navigate('/otp-method', { state: { userId, username } });
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [setupComplete, timeLeft, userId, username, navigate]);

  const setupGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/google-auth/setup', { 
        userId: parseInt(userId)
      });
      
      console.log('Setup response:', response.data);
      
      if (response.data.qrCode) {
        setSecret(response.data.secret);
        setQrCode(response.data.qrCode);
        setSetupComplete(true);
        
        Swal.fire({
          icon: 'success',
          title: 'QR Code Generated',
          text: 'Scan the QR code with Google Authenticator app',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Setup error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Setup Failed',
        text: error.response?.data?.message || 'Failed to setup Google Authenticator'
      }).then(() => {
        navigate('/otp-method', { state: { userId, username } });
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!token || token.length !== 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Code',
        text: 'Please enter a valid 6-digit code'
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/google-auth/verify', {
        userId: parseInt(userId),
        token: token.toString().trim()
      });

      console.log('Verify response:', response.data);

      if (response.data.success === true || response.data.verified === true) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Google Authenticator enabled successfully!',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/otp-method', { state: { userId, username, hasTotp: true } });
        });
      } else {
        throw new Error(response.data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      
      let errorMessage = 'Failed to verify code';
      
      if (error.response?.data?.code === 'NO_SETUP') {
        errorMessage = 'Setup session expired. Please go back and try again.';
        Swal.fire({
          icon: 'error',
          title: 'Session Expired',
          text: errorMessage
        }).then(() => {
          navigate('/otp-method', { state: { userId, username } });
        });
        return;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: errorMessage
      });
      setToken('');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
        
        {setupComplete && timeLeft > 0 && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '15px',
            fontSize: '13px',
            color: '#64748b'
          }}>
            QR expires in: {formatTime(timeLeft)}
          </div>
        )}

        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          {qrCode ? (
            <img 
              src={qrCode} 
              alt="QR Code" 
              style={{ 
                width: '180px', 
                height: '180px', 
                margin: '0 auto',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px'
              }} 
            />
          ) : (
            <div style={{ 
              width: '180px', 
              height: '180px', 
              margin: '0 auto',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px'
            }}>
              Loading...
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', margin: '15px 0' }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>Manual entry code:</p>
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '8px', 
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '13px',
            wordBreak: 'break-all'
          }}>
            {secret}
          </div>
        </div>

        <div style={{ margin: '20px 0' }}>
          <input
            type="text"
            value={token}
            onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength="6"
            disabled={isVerifying || !setupComplete}
            style={{
              width: '100%',
              textAlign: 'center',
              letterSpacing: '8px',
              fontSize: '28px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              padding: '12px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px'
            }}
          />
        </div>

        <button 
          className="login-btn" 
          onClick={verifyAndEnable}
          disabled={isVerifying || token.length !== 6 || !setupComplete}
          style={{ marginTop: '20px' }}
        >
          {isVerifying ? 'Verifying...' : 'VERIFY & ENABLE'}
        </button>

        <button 
          className="back-btn" 
          onClick={() => navigate('/otp-method', { state: { userId, username } })}
          style={{ marginTop: '10px' }}
          disabled={isVerifying}
        >
          BACK
        </button>
      </div>
    </div>
  );
}

export default GoogleAuthSetup;