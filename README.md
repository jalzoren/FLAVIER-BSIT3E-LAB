# FLAVIER-BSIT3E-LAB2ACTOTP

A full-stack authentication system built using Node.js, Express, React (Vite), and Supabase.  
It includes secure authentication features such as email verification, Google OAuth, OTP verification, password complexity enforcement, and account lockout protection with admin control.

---

## Tech Stack

Frontend: React.js (Vite), JavaScript, CSS  
Backend: Node.js, Express.js  
Database & Authentication: Supabase (PostgreSQL + Auth)

---

## Features

- User registration with password complexity validation  
- Email and password login system  
- Google OAuth authentication  
- OTP-based email verification  
- Redirect to Home page after successful login  
- Password security enforcement:
  - Minimum 12 characters  
  - At least one uppercase letter  
  - At least one lowercase letter  
  - At least one number  
  - At least one special character  
- Account security system:
  - Tracks failed login attempts  
  - Account locks after 3 failed attempts  
  - On 4th attempt, account remains locked  
  - Admin is required to unlock the account  
- Email system for OTP and authentication notifications  

---

## User Flow

1. User registers an account  
2. Password is validated based on security rules  
3. OTP is sent to email for verification  
4. User verifies OTP  
5. User logs in using email/password or Google OAuth  
6. Successful login redirects to Home page  

---

## Project Structure
FLAVIER-BSIT3E-LAB2ACTOTP/<br>
│
├── backend/
│ ├── config/
│ │ └── supabase.js
│ ├── controllers/
│ │ ├── authController.js
│ │ ├── googleAuthController.js
│ │ ├── otpController.js
│ │ └── userController.js
│ ├── middleware/
│ │ └── errorHandler.js
│ ├── models/
│ ├── routes/
│ │ ├── authRoutes.js
│ │ ├── googleAuthRoutes.js
│ │ ├── otpRoutes.js
│ │ └── userRoutes.js
│ ├── services/
│ │ ├── emailService.js
│ │ └── otpService.js
│ ├── utils/
│ ├── server.js
│ ├── package.json
│ └── package-lock.json
│
├── flavier-laboratoryact2/
│ ├── public/
│ │ ├── HANNI.jpg
│ │ ├── mjtan.jpg
│ │ ├── WONN.jpg
│ │ └── vite.svg
│ ├── src/
│ │ ├── assets/
│ │ ├── components/
│ │ ├── css/
│ │ │ ├── AdminDashboard.css
│ │ │ ├── Auth.css
│ │ │ └── Home.css
│ │ ├── pages/
│ │ │ ├── AdminDashboard.jsx
│ │ │ ├── GoogleAuthDirect.jsx
│ │ │ ├── GoogleAuthSetup.jsx
│ │ │ ├── Home.jsx
│ │ │ ├── Login.jsx
│ │ │ ├── OTPMethod.jsx
│ │ │ ├── Register.jsx
│ │ │ └── VerifyOTP.jsx
│ │ ├── App.jsx
│ │ ├── main.jsx
│ │ ├── App.css
│ │ └── index.css
│ ├── index.html
│ ├── vite.config.js
│ ├── package.json
│ ├── package-lock.json
│ └── eslint.config.js
│
└── README.md



---

## Installation

Backend:
```bash
cd backend
npm install
npm run dev

cd flavier-laboratoryact2
npm install
npm run dev




