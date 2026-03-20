import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../css/Auth.css";

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const { userId, username, method } = location.state || {};
  
  // Google Auth Setup States
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifyingSetup, setIsVerifyingSetup] = useState(false);

  const swalConfig = {
    success: {
      icon: 'success',
      background: '#ffffff',
      color: '#1e293b',
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Continue',
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: true,
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        htmlContainer: 'swal-custom-text',
        confirmButton: 'swal-custom-button',
        timerProgressBar: 'swal-custom-progress'
      }
    },
    error: {
      icon: 'error',
      background: '#ffffff',
      color: '#1e293b',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Try Again',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        htmlContainer: 'swal-custom-text',
        confirmButton: 'swal-custom-button-error'
      }
    },
    loading: {
      title: 'Processing...',
      allowOutsideClick: false,
      showConfirmButton: false,
      background: '#ffffff',
      color: '#1e293b',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        htmlContainer: 'swal-custom-text'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    },
    info: {
      icon: 'info',
      background: '#ffffff',
      color: '#1e293b',
      confirmButtonColor: '#667eea',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        htmlContainer: 'swal-custom-text',
        confirmButton: 'swal-custom-button-info'
      }
    }
  };

  const checkGoogleAuthStatus = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/google-auth-status/${userId}`);
      if (!response.data.enabled) {
        // User needs to set up Google Auth first
        setShowGoogleSetup(true);
      }
    } catch (error) {
      console.error("Error checking Google Auth status:", error);
    }
  }, [userId]);

  // Handle redirect if no state
  useEffect(() => {
    if (!userId || !username || !method) {
      navigate("/");
      return;
    }

    // Check if Google Auth is enabled for this user
    if (method === 'google') {
      checkGoogleAuthStatus();
    }
  }, [userId, username, method, navigate, checkGoogleAuthStatus]);

  // Timer countdown for email OTP only
  useEffect(() => {
    if (method !== 'email') return;
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, method]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Invalid Code',
        text: 'Please enter a valid 6-digit code!'
      });
      return;
    }

    setIsLoading(true);
    Swal.fire({
      ...swalConfig.loading,
      title: 'Verifying...',
      text: 'Please wait while we verify your code'
    });

    try {
      // Pass the method to the backend
      const res = await axios.post("http://localhost:5000/verify-otp", {
        userId,
        otp,
        method // Important: Pass the method
      });

      if (res.data.verified) {
        Swal.fire({
          ...swalConfig.success,
          title: 'Success!',
          text: 'Verification successful! Welcome back!',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          navigate("/dashboard", { state: { username, userId } });
        });
      } else {
        throw new Error("Verification failed");
      }
    } catch (err) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Verification Failed',
        text: err.response?.data?.message || 'Invalid or expired code. Please try again!'
      });
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupGoogleAuth = async () => {
    setIsSettingUp(true);
    Swal.fire({
      ...swalConfig.loading,
      title: 'Setting up Google Auth...',
      text: 'Generating QR code'
    });

    try {
      const response = await axios.post("http://localhost:5000/setup-google-auth", { userId });
      setQrCode(response.data.qrCode);
      setShowGoogleSetup(true);
      Swal.close();
    } catch (err) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Setup Failed',
        text: err.response?.data?.message || 'Failed to setup Google Authenticator'
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleVerifyAndEnableGoogleAuth = async () => {
    if (!setupToken || setupToken.length !== 6) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Invalid Code',
        text: 'Please enter a valid 6-digit code from Google Authenticator'
      });
      return;
    }

    setIsVerifyingSetup(true);
    Swal.fire({
      ...swalConfig.loading,
      title: 'Verifying...',
      text: 'Please wait while we verify your code'
    });

    try {
      const response = await axios.post("http://localhost:5000/verify-and-enable-google-auth", {
        userId,
        token: setupToken
      });

      if (response.data.enabled) {
        Swal.fire({
          ...swalConfig.success,
          title: 'Success!',
          text: 'Google Authenticator enabled successfully!',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          setShowGoogleSetup(false);
          setSetupToken('');
          // Now proceed to verify with the code
          handleVerifyWithGoogleCode();
        });
      }
    } catch (err) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Verification Failed',
        text: err.response?.data?.message || 'Invalid code. Please try again!'
      });
    } finally {
      setIsVerifyingSetup(false);
    }
  };

  const handleVerifyWithGoogleCode = () => {
    // After enabling, ask user to enter the code for verification
    Swal.fire({
      title: 'Enter Code',
      text: 'Please enter the 6-digit code from Google Authenticator to complete login',
      input: 'text',
      inputAttributes: {
        maxlength: 6,
        pattern: '[0-9]{6}',
        inputmode: 'numeric'
      },
      showCancelButton: true,
      confirmButtonText: 'Verify',
      cancelButtonText: 'Cancel',
      preConfirm: async (code) => {
        if (!code || code.length !== 6) {
          Swal.showValidationMessage('Please enter a 6-digit code');
          return false;
        }
        return code;
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        setIsLoading(true);
        try {
          const res = await axios.post("http://localhost:5000/verify-otp", {
            userId,
            otp: result.value,
            method: 'google'
          });
          
          if (res.data.verified) {
            Swal.fire({
              ...swalConfig.success,
              title: 'Success!',
              text: 'Verification successful! Welcome back!',
              timer: 2000,
              showConfirmButton: false
            }).then(() => {
              navigate("/dashboard", { state: { username, userId } });
            });
          }
        } catch (err) {
          Swal.fire({
            ...swalConfig.error,
            title: 'Verification Failed',
            text: err.response?.data?.message || 'Invalid code. Please try again!'
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleResendOTP = async () => {
    if (method !== 'email') return;
    
    Swal.fire({
      ...swalConfig.loading,
      title: 'Resending...',
      text: 'Please wait while we resend the OTP'
    });

    try {
      await axios.post("http://localhost:5000/send-email-otp", { userId });
      setTimeLeft(300); // Reset timer
      Swal.fire({
        ...swalConfig.success,
        title: 'Resent!',
        text: 'A new OTP has been sent to your email',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Error',
        text: err.response?.data?.message || 'Failed to resend OTP'
      });
    }
  };

  const handleBack = () => {
    navigate("/otp-method", { state: { userId, username } });
  };

  // Google Auth Setup UI
  if (showGoogleSetup && method === 'google') {
    return (
      <div className="login-container">
        <div className="card">
          <h1 className="title">SETUP GOOGLE AUTHENTICATOR</h1>
          <p className="subtitle">Scan the QR code with your Google Authenticator app</p>

          <div className="qr-code-container" style={{ textAlign: 'center', margin: '30px 0' }}>
            {qrCode && (
              <img 
                src={qrCode} 
                alt="QR Code for Google Authenticator" 
                style={{ 
                  maxWidth: '200px', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              />
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            <label className="label">Enter the 6-digit code from the app:</label>
            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={setupToken}
              onChange={(e) => setSetupToken(e.target.value.replace(/[^0-9]/g, ''))}
              className="input"
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '5px' }}
            />
          </div>

          <button
            className="login-btn"
            onClick={handleVerifyAndEnableGoogleAuth}
            disabled={isVerifyingSetup || setupToken.length !== 6}
            style={{ marginTop: '20px' }}
          >
            {isVerifyingSetup ? 'Verifying...' : 'Verify & Enable'}
          </button>

          <button className="back-btn" onClick={() => setShowGoogleSetup(false)}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // Main OTP Verification UI
  return (
    <div className="login-container">
      <div className="card">
        <h1 className="title">
          {method === 'email' ? 'VERIFY OTP' : 'GOOGLE AUTHENTICATOR'}
        </h1>
        <p className="subtitle">
          {method === 'email' 
            ? 'Enter the 6-digit code sent to your email' 
            : 'Enter the 6-digit code from Google Authenticator'}
        </p>

        {method === 'google' && (
          <div style={{ 
            backgroundColor: '#f0f9ff', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#0369a1', fontSize: '14px' }}>
              🔐 Open Google Authenticator app and enter the 6-digit code
            </p>
          </div>
        )}

        <form onSubmit={handleVerifyOTP}>
          <div className="form-group" style={{ marginTop: '30px' }}>
            <label className="label" style={{ textAlign: 'center', display: 'block' }}>
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength="6"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              className="input"
              disabled={isLoading}
              style={{
                textAlign: 'center',
                letterSpacing: '10px',
                fontSize: '32px',
                fontWeight: 'bold',
                marginTop: '15px',
                fontFamily: 'monospace'
              }}
              autoFocus
              required
            />

            {method === 'email' && (
              <>
                <div style={{
                  textAlign: 'center',
                  marginTop: '20px',
                  fontSize: '14px',
                  color: timeLeft <= 60 ? '#ef4444' : '#666666'
                }}>
                  Code expires in: <strong>{formatTime(timeLeft)}</strong>
                </div>

                {timeLeft <= 0 && (
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      className="resend-btn"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Resend Code
                    </button>
                  </div>
                )}
              </>
            )}

            {method === 'google' && !showGoogleSetup && (
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleSetupGoogleAuth}
                  className="resend-btn"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  disabled={isSettingUp}
                >
                  {isSettingUp ? 'Setting up...' : 'Setup Google Authenticator'}
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading || otp.length !== 6}
            style={{ marginTop: '30px' }}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <button className="back-btn" onClick={handleBack} style={{ marginTop: '15px' }}>
          Change Method
        </button>
      </div>
    </div>
  );
}