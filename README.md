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
│<br>
├── backend/<br>
│ ├── config/<br>
│ │ └── supabase.js<br>
│ ├── controllers/<br>
│ │ ├── authController.js<br>
│ │ ├── googleAuthController.js<br>
│ │ ├── otpController.js<br>
│ │ └── userController.js<br>
│ ├── middleware/<br>
│ │ └── errorHandler.js<br>
│ ├── models/<br>
│ ├── routes/<br>
│ │ ├── authRoutes.js<br>
│ │ ├── googleAuthRoutes.js<br>
│ │ ├── otpRoutes.js<br>
│ │ └── userRoutes.js<br>
│ ├── services/<br>
│ │ ├── emailService.js<br>
│ │ └── otpService.js<br>
│ ├── utils/<br>
│ ├── server.js<br>
│ ├── package.json<br>
│ └── package-lock.json<br>
│<br>
├── flavier-laboratoryact2/<br>
│ ├── public/<br>
│ │ ├── HANNI.jpg<br>
│ │ ├── mjtan.jpg<br>
│ │ ├── WONN.jpg<br>
│ │ └── vite.svg<br>
│ ├── src/<br>
│ │ ├── assets/<br>
│ │ ├── components/<br>
│ │ ├── css/<br>
│ │ │ ├── AdminDashboard.css<br>
│ │ │ ├── Auth.css<br>
│ │ │ └── Home.css<br>
│ │ ├── pages/<br>
│ │ │ ├── AdminDashboard.jsx<br>
│ │ │ ├── GoogleAuthDirect.jsx<br>
│ │ │ ├── GoogleAuthSetup.jsx<br>
│ │ │ ├── Home.jsx<br>
│ │ │ ├── Login.jsx<br>
│ │ │ ├── OTPMethod.jsx<br>
│ │ │ ├── Register.jsx<br>
│ │ │ └── VerifyOTP.jsx<br>
│ │ ├── App.jsx<br>
│ │ ├── main.jsx<br>
│ │ ├── App.css<br>
│ │ └── index.css<br>
│ ├── index.html<br>
│ ├── vite.config.js<br>
│ ├── package.json<br>
│ ├── package-lock.json<br>
│ └── eslint.config.js<br>
│<br>
└── README.md<br>
<br>



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




