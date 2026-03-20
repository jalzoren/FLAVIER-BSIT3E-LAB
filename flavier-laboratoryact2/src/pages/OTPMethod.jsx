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
  const { userId, username } = location.state || {};

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
    }
  };

  if (!userId || !username) {
    navigate("/");
    return null;
  }

  const handleEmailOTP = async () => {
    setSelectedMethod('email');
    Swal.fire({
      ...swalConfig.loading,
      title: 'Sending OTP...',
      text: 'Please wait while we send OTP to your email'
    });

    try {
      await axios.post("http://localhost:5000/send-email-otp", { userId });
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
      Swal.fire({
        ...swalConfig.error,
        title: 'Error',
        text: err.response?.data?.message || 'Failed to send OTP. Please try again!'
      });
      setSelectedMethod(null);
    }
  };

  const handleGoogleAuth = async () => {
    setSelectedMethod('google');
    Swal.fire({
      ...swalConfig.loading,
      title: 'Initializing Google Auth...',
      text: 'Please wait while we process Google authentication'
    });

    try {
      // Call backend to initiate Google auth
      await axios.post("http://localhost:5000/initiate-google-otp", { userId });
      Swal.fire({
        ...swalConfig.success,
        title: 'Success',
        text: 'Proceeding with Google authentication!',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate("/verify-otp", { state: { userId, username, method: 'google' } });
      });
    } catch (err) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Error',
        text: err.response?.data?.message || 'Failed to initialize Google auth. Please try again!'
      });
      setSelectedMethod(null);
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

        <div className="otp-method-grid">
          <button
            className={`otp-method-card ${selectedMethod === 'email' ? 'active' : ''}`}
            onClick={handleEmailOTP}
            disabled={selectedMethod !== null}
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
            disabled={selectedMethod !== null}
          >
            <div className="method-icon">
              <FaGoogle />
            </div>
            <h2 className="method-title">Google Auth</h2>
            <p className="method-description">Use Google Authenticator app</p>
          </button>
        </div>

        <button className="back-btn" onClick={handleBack}>
          BACK TO LOGIN
        </button>
      </div>
    </div>
  );
}

export default OTPMethod;
