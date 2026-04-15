import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../css/Auth.css';

function GoogleAuthDirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, username } = location.state || {};
  const [token, setToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
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
      const response = await axios.post('http://localhost:5000/api/google-auth/direct-verify', {
        userId: parseInt(userId),
        token: token.toString().trim()
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Verification successful!',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/home', { state: { userId, username } });
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      
      let errorMessage = 'Failed to verify code';
      
      if (error.response?.data?.message) {
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

  return (
    <div className="login-container">
      <div className="card">
        <h1 className="title">GOOGLE AUTHENTICATOR</h1>
        <p className="subtitle">Welcome, {username}</p>
        
        <div style={{ 
          backgroundColor: '#e0f2fe', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#0369a1' }}>
            📱 Open Google Authenticator and enter the 6-digit code
          </p>
        </div>

        <div style={{ margin: '20px 0' }}>
          <input
            type="text"
            value={token}
            onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength="6"
            disabled={isVerifying}
            autoFocus
            style={{
              width: '100%',
              textAlign: 'center',
              letterSpacing: '10px',
              fontSize: '32px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              padding: '15px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px'
            }}
          />
        </div>

        <button 
          className="login-btn" 
          onClick={handleVerify}
          disabled={isVerifying || token.length !== 6}
          style={{ marginTop: '20px' }}
        >
          {isVerifying ? 'Verifying...' : 'VERIFY'}
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

export default GoogleAuthDirect;