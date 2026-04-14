import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/Auth.css";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    capital: false,
    small: false,
    number: false,
    special: false
  });
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
    warning: {
      icon: 'warning',
      background: '#ffffff',
      color: '#1e293b',
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        htmlContainer: 'swal-custom-text',
        confirmButton: 'swal-custom-button-warning'
      }
    }
  };

  const validatePassword = (pwd) => {
    const checks = {
      length: pwd.length >= 12,
      capital: /[A-Z]/.test(pwd),
      small: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
    };
    setPasswordChecks(checks);
    return Object.values(checks).every(check => check === true);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const handleRegister = async () => {
    // Validate username
    if (!username || !email || !password || !confirmPassword) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Error',
        text: 'Please fill in all fields!'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Invalid Email',
        text: 'Please enter a valid email address!'
      });
      return;
    }

    // Validate password complexity
    const isPasswordValid = validatePassword(password);
    if (!isPasswordValid) {
      Swal.fire({
        ...swalConfig.warning,
        title: 'Password Requirements Not Met',
        html: `
          <div style="text-align: left;">
            <p>Please ensure your password meets all requirements:</p>
            <ul style="margin-top: 10px;">
              <li>✓ At least 12 characters</li>
              <li>✓ At least one capital letter</li>
              <li>✓ At least one small letter</li>
              <li>✓ At least one number</li>
              <li>✓ At least one special character</li>
            </ul>
          </div>
        `,
        confirmButtonText: 'Got it'
      });
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Password Mismatch',
        text: 'Passwords do not match! Please re-enter your password.'
      });
      return;
    }

    Swal.fire({
      ...swalConfig.loading,
      title: 'Creating Account...',
      text: 'Please wait while we create your account'
    });

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password
      });
      
      Swal.close();
      
      Swal.fire({
        ...swalConfig.success,
        title: 'Registration Successful!',
        text: 'Your account has been created successfully. Please login to continue.',
        showConfirmButton: true,
        confirmButtonText: 'Go to Login'
      }).then(() => {
        navigate("/");
      });
    } catch (err) {
      Swal.fire({
        ...swalConfig.error,
        title: 'Registration Failed',
        text: err.response?.data?.message || 'An error occurred during registration. Please try again!'
      });
    }
  };

  return (
    <div className="login-container">
      <div className="card">
        <h1 className="title">REGISTER</h1>

        <div className="form-grid">
          <div className="left-col">
            <label>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username"
              onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
            />

            <label>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
            />

            <label>PASSWORD</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Create a password"
                onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Password requirements checklist */}
            {password && (
              <div className="password-checklist">
                <p className="checklist-title">Password must contain:</p>
                <ul>
                  <li className={passwordChecks.length ? 'valid' : 'invalid'}>
                    {passwordChecks.length ? '✓' : '○'} At least 12 characters
                  </li>
                  <li className={passwordChecks.capital ? 'valid' : 'invalid'}>
                    {passwordChecks.capital ? '✓' : '○'} At least one capital letter
                  </li>
                  <li className={passwordChecks.small ? 'valid' : 'invalid'}>
                    {passwordChecks.small ? '✓' : '○'} At least one small letter
                  </li>
                  <li className={passwordChecks.number ? 'valid' : 'invalid'}>
                    {passwordChecks.number ? '✓' : '○'} At least one number
                  </li>
                  <li className={passwordChecks.special ? 'valid' : 'invalid'}>
                    {passwordChecks.special ? '✓' : '○'} At least one special character
                  </li>
                </ul>
              </div>
            )}

            <label>CONFIRM PASSWORD</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Password match indicator */}
            {confirmPassword && (
              <div className={`password-match ${password === confirmPassword ? 'match' : 'mismatch'}`}>
                {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}

            <button className="login-btn" onClick={handleRegister}>REGISTER</button>

            <div className="register-link">
              <p>Already have an account? <Link to="/">Login here</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;