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
  const { userId, username } = location.state || {};

  if (!userId || !username) {
    navigate("/");
    return null;
  }

  const handleEmailOTP = async () => {
    setSelectedMethod('email');
    setIsLoading(true);
    
    Swal.fire({
      title: 'Sending OTP...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await axios.post("http://localhost:5000/api/otp/send-email-otp", { userId });
      Swal.close();
      
      Swal.fire({
        icon: 'success',
        title: 'OTP Sent!',
        text: 'Verification code sent to your email',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        navigate("/verify-otp", { state: { userId, username, method: 'email' } });
      });
    } catch (err) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to send OTP'
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
      title: 'Checking...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await axios.get(`http://localhost:5000/api/google-auth/check-method/${userId}`);
      
      Swal.close();
      
      if (response.data.hasTotp) {
        navigate("/verify-otp", { state: { userId, username, method: 'google' } });
      } else {
        Swal.fire({
          title: 'Setup Required',
          text: 'Google Authenticator is not set up. Set it up now?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Set Up',
          cancelButtonText: 'Cancel'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/google-auth-setup", { state: { userId, username } });
          } else {
            setSelectedMethod(null);
          }
        });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to check status'
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
            <p className="method-description">Receive a code via email</p>
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

        <button className="back-btn" onClick={handleBack}>
          BACK TO LOGIN
        </button>
      </div>
    </div>
  );
}

export default OTPMethod;