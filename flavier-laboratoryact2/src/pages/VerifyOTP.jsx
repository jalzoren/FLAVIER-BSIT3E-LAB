import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../css/Auth.css";

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const { userId, username, method } = location.state || {};
  const autoVerifyTimeoutRef = useRef(null);

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
    },
    error: {
      icon: 'error',
      background: '#ffffff',
      color: '#1e293b',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Try Again',
    },
    warning: {
      icon: 'warning',
      background: '#ffffff',
      color: '#1e293b',
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'OK',
    },
    loading: {
      title: 'Processing...',
      allowOutsideClick: false,
      showConfirmButton: false,
      background: '#ffffff',
      didOpen: () => {
        Swal.showLoading();
      }
    }
  };

  useEffect(() => {
    if (!userId || !username || !method) {
      navigate("/");
      return;
    }
    console.log("VerifyOTP mounted with:", { userId, username, method });
    
    // Clear any existing timeout on unmount
    return () => {
      if (autoVerifyTimeoutRef.current) {
        clearTimeout(autoVerifyTimeoutRef.current);
      }
    };
  }, [userId, username, method, navigate]);

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
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Validate OTP
    if (!otp || otp.length !== 6) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Invalid Code',
        text: 'Please enter a valid 6-digit code!'
      });
      return;
    }

    // Prevent multiple submissions
    if (isLoading) return;

    setIsLoading(true);
    
    // Show loading indicator
    Swal.fire({
      ...swalConfig.loading,
      title: 'Verifying...',
      text: 'Please wait while we verify your code'
    });

    try {
      console.log(`Sending verification for userId: ${userId}, method: ${method}, otp: ${otp}`);
      
      const res = await axios.post("http://localhost:5000/verify-otp", {
        userId,
        otp: otp.toString().trim(),
        method
      });

      console.log("Verification response:", res.data);

      if (res.data.verified) {
        Swal.close();
        Swal.fire({
          ...swalConfig.success,
          title: 'Success!',
          text: 'Verification successful! Welcome to NewJeans!',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          navigate("/home", { state: { username, userId } });
        });
      } else {
        throw new Error("Verification failed");
      }
    } catch (err) {
      Swal.close();
      console.error("Verification error:", err.response?.data || err.message);
      
      const errorMsg = err.response?.data?.message || 'Invalid or expired code. Please try again!';
      const needsSetup = err.response?.data?.needsSetup;
      const code = err.response?.data?.code;
      
      if (needsSetup) {
        Swal.fire({
          ...swalConfig.warning,
          title: 'Setup Required',
          text: 'Google Authenticator not set up. Would you like to set it up now?',
          confirmButtonText: 'Setup Now',
          showCancelButton: true,
          cancelButtonText: 'Try Email',
          cancelButtonColor: '#6b7280'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/setup-google-auth", { state: { userId, username } });
          } else {
            navigate("/otp-method", { state: { userId, username } });
          }
        });
      } else if (code === 'INVALID') {
        Swal.fire({
          ...swalConfig.error,
          title: 'Invalid Code',
          text: errorMsg,
          confirmButtonText: 'Try Again'
        });
        setOtp("");
      } else if (code === 'EXPIRED') {
        Swal.fire({
          ...swalConfig.error,
          title: 'Code Expired',
          text: errorMsg,
          confirmButtonText: 'Request New Code'
        }).then(() => {
          if (method === 'email') {
            handleResendOTP();
          } else {
            navigate("/otp-method", { state: { userId, username } });
          }
        });
      } else {
        Swal.fire({
          ...swalConfig.error,
          title: 'Verification Failed',
          text: errorMsg
        });
        setOtp("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupGoogleAuth = () => {
    navigate("/setup-google-auth", { state: { userId, username } });
  };

  const handleResendOTP = async () => {
    if (method !== 'email') return;
    
    if (isLoading) return;
    
    setIsLoading(true);
    Swal.fire({
      ...swalConfig.loading,
      title: 'Resending...',
      text: 'Please wait while we resend the OTP'
    });

    try {
      await axios.post("http://localhost:5000/send-email-otp", { userId });
      setTimeLeft(300);
      Swal.close();
      Swal.fire({
        ...swalConfig.success,
        title: 'Resent!',
        text: 'A new OTP has been sent to your email',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.close();
      Swal.fire({
        ...swalConfig.error,
        title: 'Error',
        text: err.response?.data?.message || 'Failed to resend OTP'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/otp-method", { state: { userId, username } });
  };

  // Auto-verify when 6 digits are entered for Google Auth
  useEffect(() => {
    if (method === 'google' && otp.length === 6 && !isLoading) {
      // Clear any existing timeout
      if (autoVerifyTimeoutRef.current) {
        clearTimeout(autoVerifyTimeoutRef.current);
      }
      // Set a small delay to ensure user has finished typing
      autoVerifyTimeoutRef.current = setTimeout(() => {
        handleVerifyOTP({ preventDefault: () => {} });
      }, 300);
    }
    
    return () => {
      if (autoVerifyTimeoutRef.current) {
        clearTimeout(autoVerifyTimeoutRef.current);
      }
    };
  }, [otp, method, isLoading]);

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
              Open Google Authenticator app and enter the 6-digit code
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
              onChange={(e) => {
                const newVal = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                setOtp(newVal);
              }}
              className="input"
              disabled={isLoading}
              style={{
                textAlign: 'center',
                letterSpacing: '10px',
                fontSize: '32px',
                fontWeight: 'bold',
                marginTop: '15px',
                fontFamily: 'monospace',
                padding: '15px'
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
                      disabled={isLoading}
                      className="resend-btn"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        textDecoration: 'underline',
                        fontSize: '14px',
                        opacity: isLoading ? 0.5 : 1
                      }}
                    >
                      Resend Code
                    </button>
                  </div>
                )}
              </>
            )}

            {method === 'google' && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={handleSetupGoogleAuth}
                  disabled={isLoading}
                  className="resend-btn"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  Setup Google Authenticator
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

        <button 
          className="back-btn" 
          onClick={handleBack} 
          disabled={isLoading}
          style={{ marginTop: '15px', opacity: isLoading ? 0.5 : 1 }}
        >
          Change Method
        </button>
      </div>
    </div>
  );
}

export default VerifyOTP;