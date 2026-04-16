import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/Auth.css";
import { Link } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const swalConfig = {
    success: {
      icon: 'success',
      background: '#ffffff',
      color: '#1e293b',
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Continue',
      timer: 2000,
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
      didOpen: () => {
        Swal.showLoading();
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Error',
        text: 'Please enter username & password!'
      });
      return;
    }

    Swal.fire({
      ...swalConfig.loading,
      title: 'Logging in...',
      text: 'Please wait while we verify your credentials'
    });

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { 
        username, 
        password 
      });
      
      Swal.close();
      
      // Check if logged in user is admin (jalgorithm)
      if (res.data.username === 'jalgorithm') {
        Swal.fire({
          ...swalConfig.success,
          title: 'Admin Login Successful!',
          text: 'Welcome Admin! Redirecting to Admin Dashboard...',
          showConfirmButton: true,
          confirmButtonText: 'Go to Dashboard'
        }).then(() => {
          navigate("/admin", { 
            state: { 
              userId: res.data.userId, 
              username: res.data.username,
              isAdmin: true
            } 
          });
        });
      } else {
        Swal.fire({
          ...swalConfig.success,
          title: 'Login Successful!',
          text: 'Welcome! Please choose your verification method.',
          showConfirmButton: true,
          confirmButtonText: 'Continue'
        }).then(() => {
          navigate("/otp-method", { 
            state: { 
              userId: res.data.userId, 
              username: res.data.username,
              hasTotp: res.data.hasTotp || false
            } 
          });
        });
      }
    } catch (err) {
      Swal.close();
      
      console.error("Login error details:", err.response?.data);
      
      const errorMessage = err.response?.data?.message || 'Invalid credentials. Please try again!';
      const accountLocked = err.response?.data?.accountLocked;
      const attemptsRemaining = err.response?.data?.attemptsRemaining;
      const isThirdAttempt = err.response?.data?.isThirdAttempt;
      
      // Handle 3rd attempt - account gets locked
      if (isThirdAttempt && accountLocked) {
        Swal.fire({
          icon: 'error',
          title: 'Account Locked',
          text: 'You have used all 3 attempts. Your account has been locked. Please contact the administrator to unlock your account.',
          confirmButtonText: 'Contact Administrator',
          confirmButtonColor: '#d33'
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              icon: 'info',
              title: 'Contact Administrator',
              html: 'Please contact JALGORITHM to unlock your account.',
              confirmButtonText: 'OK',
              confirmButtonColor: '#3085d6'
            });
          }
        });
        setPassword('');
      }
      // Handle Account Locked (4th attempt and beyond)
      else if (accountLocked && !isThirdAttempt) {
        Swal.fire({
          icon: 'error',
          title: 'Account Locked',
          text: 'Your account has been locked due to too many failed attempts. Please contact the administrator to unlock your account.',
          confirmButtonText: 'Contact Administrator',
          confirmButtonColor: '#d33',
          allowOutsideClick: false
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              icon: 'info',
              title: 'Contact Administrator',
              html: 'Please contact JALGORITHM to unlock your account.',
              confirmButtonText: 'OK',
              confirmButtonColor: '#3085d6'
            });
          }
        });
        setPassword('');
      } 
      // Handle remaining attempts (1st and 2nd attempt)
      else if (attemptsRemaining !== undefined && attemptsRemaining > 0) {
        Swal.fire({
          ...swalConfig.warning,
          title: 'Login Failed',
          text: errorMessage,
          confirmButtonText: 'Try Again'
        });
        setPassword('');
      } 
      // Handle other errors
      else {
        Swal.fire({
          ...swalConfig.error,
          title: 'Login Failed',
          text: errorMessage
        });
        setPassword('');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="card">
        <h1 className="title">LOGIN</h1>

        <div className="form-grid">
          <div className="left-col">
            <label>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />

            <label>PASSWORD</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button className="login-btn" onClick={handleLogin}>LOGIN</button>

            <div className="register-link">
              <p>Don't have an account? <Link to="/register">Register here</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;