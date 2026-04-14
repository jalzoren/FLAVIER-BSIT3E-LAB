import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEnvelope, FaGoogle } from "react-icons/fa";
import "../css/Auth.css";

function OTPMethod() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { userId, username, hasTotp } = location.state || {};

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

  if (!userId || !username) {
    navigate("/");
    return null;
  }

  const handleEmailOTP = async () => {
    setSelectedMethod('email');
    setIsLoading(true);
    
    Swal.fire({
      ...swalConfig.loading,
      title: 'Sending OTP...',
      text: 'Please wait while we send OTP to your email'
    });

    try {
      await axios.post("http://localhost:5000/api/otp/send-email", { userId });
      Swal.close();
      
      Swal.fire({
        ...swalConfig.success,
        title: 'Success',
        text: 'OTP sent to your email!',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate("/verify-otp", { state: { userId, username, method: 'email' } });
      });
    } catch (err) {
      Swal.close();
      Swal.fire({
        ...swalConfig.error,
        title: 'Error',
        text: err.response?.data?.message || 'Failed to send OTP. Please try again!'
      });
      setSelectedMethod(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setSelectedMethod('google');
    setIsLoading(true);
    
    Swal.fire({
      ...swalConfig.loading,
      title: 'Checking Google Auth...',
      text: 'Please wait while we verify Google Authenticator setup'
    });

    try {
      const response = await axios.get(`http://localhost:5000/api/google-auth/status/${userId}`);
      
      if (response.data.enabled) {
        Swal.close();
        Swal.fire({
          ...swalConfig.success,
          title: 'Ready',
          text: 'Please enter the code from your Google Authenticator app',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          navigate("/verify-otp", { state: { userId, username, method: 'google' } });
        });
      } else {
        Swal.close();
        Swal.fire({
          ...swalConfig.info,
          title: 'Setup Required',
          text: 'Google Authenticator is not set up. Would you like to set it up now?',
          showCancelButton: true,
          confirmButtonText: 'Set Up Now',
          cancelButtonText: 'Cancel'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/setup-google-auth", { state: { userId, username } });
          } else {
            setSelectedMethod(null);
          }
        });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({
        ...swalConfig.error,
        title: 'Error',
        text: err.response?.data?.message || 'Failed to check Google Auth status'
      });
      setSelectedMethod(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="login-container">
      <div className="card">
        <h1 className="title">VERIFY ACCOUNT</h1>
        <p className="subtitle">Choose your verification method</p>
        <p className="welcome-text">Welcome, {username}!</p>

        <div className="otp-method-grid">
          <button
            className={`otp-method-card ${selectedMethod === 'email' ? 'active' : ''}`}
            onClick={handleEmailOTP}
            disabled={isLoading}
          >
            <div className="method-icon">
              <FaEnvelope />
            </div>
            <h2 className="method-title">Email OTP</h2>
            <p className="method-description">Receive a one-time code via email</p>
          </button>

          <button
            className={`otp-method-card ${selectedMethod === 'google' ? 'active' : ''}`}
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            <div className="method-icon">
              <FaGoogle />
            </div>
            <h2 className="method-title">Google Auth</h2>
            <p className="method-description">Use Google Authenticator app</p>
          </button>
        </div>

        {!hasTotp && (
          <div className="setup-hint">
          </div>
        )}

        <button className="back-btn" onClick={handleBack}>
          BACK TO LOGIN
        </button>
      </div>
    </div>
  );
}

export default OTPMethod;