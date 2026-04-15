import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import OTPMethod from './pages/OTPMethod';
import VerifyOTP from './pages/VerifyOTP';
import GoogleAuthSetup from './pages/GoogleAuthSetup';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/otp-method" element={<OTPMethod />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/google-auth-setup" element={<GoogleAuthSetup />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;