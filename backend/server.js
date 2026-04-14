require('dotenv').config();
const express = require('express');
const cors = require('cors');
const emailService = require('./services/emailService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const otpRoutes = require('./routes/otpRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/google-auth', googleAuthRoutes);

// Debug endpoint (optional)
app.get('/debug/temp-secrets', async (req, res) => {
  const supabase = require('./config/supabase');
  const { data } = await supabase.from('temp_secrets').select('*');
  res.json({ tempSecrets: data });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Verify email connection
emailService.verifyConnection()
  .then(() => console.log('Email service ready'))
  .catch(err => console.error('Email service error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Supabase integrated`);
});