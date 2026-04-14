import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import OTPMethod from "./pages/OTPMethod";
import Home from "./pages/Home";
import GoogleAuthSetup from "./pages/GoogleAuthSetup";
import VerifyOTP from "./pages/VerifyOTP";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/otp-method" element={<OTPMethod />} />
        <Route path="/home" element={<Home />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/setup-google-auth" element={<GoogleAuthSetup />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;