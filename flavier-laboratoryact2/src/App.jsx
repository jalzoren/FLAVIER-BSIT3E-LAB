import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import OTPMethod from "./pages/OTPMethod.jsx";
import Home from "./pages/Home";
import GoogleAuthSetup from "./components/GoogleAuthSetup.jsx";
import VerifyOTP from "./pages/VerifyOTP.jsx";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/otp-method" element={<OTPMethod />} />
        <Route path="/home" element={<Home />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/setup-google-auth" element={<GoogleAuthSetup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;