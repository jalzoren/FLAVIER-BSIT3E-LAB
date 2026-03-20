import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/Auth.css";

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
      const res = await axios.post("http://localhost:5000/login", { username, password });
      
      Swal.close();
      
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
    } catch (err) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Login Failed',
        text: err.response?.data?.message || 'Invalid credentials. Please try again!'
      });
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;