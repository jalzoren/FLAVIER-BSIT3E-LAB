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

  useEffect(() => {
    if (!userId || !username || !method) {
      navigate("/");
      return;
    }
    
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

    if (!otp || otp.length !== 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Code',
        text: 'Please enter a valid 6-digit code!'
      });
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    Swal.fire({
      title: 'Verifying...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      let response;
      
      if (method === 'google') {
        response = await axios.post("http://localhost:5000/api/google-auth/direct-verify", {
          userId: Number(userId),
          token: otp.toString().trim()
        });
      } else {
        response = await axios.post("http://localhost:5000/api/otp/verify", {
          userId,
          otp: otp.toString().trim(),
          method
        });
      }

      Swal.close();

      if (response.data.success || response.data.verified) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Verification successful!',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate("/home", { state: { username, userId } });
        });
      } else {
        throw new Error("Verification failed");
      }
    } catch (err) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: err.response?.data?.message || 'Invalid or expired code. Please try again!'
      });
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (method !== 'email') return;
    if (isLoading) return;
    
    setIsLoading(true);
    Swal.fire({
      title: 'Resending...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await axios.post("http://localhost:5000/api/otp/send-email-otp", { userId });
      setTimeLeft(300);
      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'Resent!',
        text: 'A new OTP has been sent to your email',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.close();
      Swal.fire({
        icon: 'error',
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

  useEffect(() => {
    if (method === 'google' && otp.length === 6 && !isLoading) {
      if (autoVerifyTimeoutRef.current) {
        clearTimeout(autoVerifyTimeoutRef.current);
      }
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

        <form onSubmit={handleVerifyOTP}>
          <div className="form-group" style={{ marginTop: '30px' }}>
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
                fontFamily: 'monospace',
                padding: '15px'
              }}
              autoFocus
              required
            />

            {method === 'email' && timeLeft > 0 && (
              <div style={{
                textAlign: 'center',
                marginTop: '15px',
                fontSize: '14px',
                color: '#666666'
              }}>
                Code expires in: {formatTime(timeLeft)}
              </div>
            )}

            {method === 'email' && timeLeft <= 0 && (
              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px'
                  }}
                >
                  Resend Code
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
          style={{ marginTop: '15px' }}
        >
          Change Method
        </button>
      </div>
    </div>
  );
}

export default VerifyOTP;