const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", username);

    // Get user with login attempts info
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    // Check if account is locked
    if (user.account_locked) {
      return res.status(401).json({ 
        message: "Account is locked. Please contact administrator to unlock your account.",
        accountLocked: true 
      });
    }

    // Verify password - Check if it's hashed or plain text
    let isPasswordValid = false;
    
    try {
      // Check if password looks like a bcrypt hash (starts with $2b$)
      if (user.password && user.password.startsWith('$2b$')) {
        // Password is hashed - use bcrypt compare
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else {
        // Password is plain text - direct comparison
        isPasswordValid = (password === user.password);
        
        // If valid, update to hashed password for security
        if (isPasswordValid) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', user.id);
          console.log(`Updated password for user ${username} to hashed format`);
        }
      }
    } catch (err) {
      console.error("Password comparison error:", err);
      isPasswordValid = false;
    }
    
    if (!isPasswordValid) {
      // Increment login attempts
      const newAttempts = (user.login_attempts || 0) + 1;
      
      // Check if account should be locked (after 3 attempts)
      if (newAttempts >= 3) {
        // Lock the account
        await supabase
          .from('users')
          .update({ 
            login_attempts: newAttempts,
            account_locked: true,
            locked_until: new Date()
          })
          .eq('id', user.id);
        
        return res.status(401).json({ 
          message: "Account has been locked due to too many failed attempts. Please contact administrator.",
          accountLocked: true,
          attemptsRemaining: 0
        });
      } else {
        // Update attempts count
        await supabase
          .from('users')
          .update({ login_attempts: newAttempts })
          .eq('id', user.id);
        
        const remainingAttempts = 3 - newAttempts;
        return res.status(401).json({ 
          message: `Invalid credentials! You have ${remainingAttempts} attempt(s) remaining before your account is locked.`,
          attemptsRemaining: remainingAttempts
        });
      }
    }

    // Successful login - reset attempts
    await supabase
      .from('users')
      .update({ 
        last_login: new Date(),
        login_attempts: 0,
        account_locked: false,
        locked_until: null
      })
      .eq('id', user.id);

    res.json({ 
      userId: user.id, 
      username: user.username,
      hasTotp: !!user.totp_secret,
      role: user.role || 'user',
      isAdmin: user.username === 'jalgorithm',
      message: "Login successful. Please choose verification method."
    });
    
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Failed to process login" });
  }
};

// REGISTER FUNCTION - FIXED
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log("Registration attempt:", username, email);

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate username length
    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      });
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user object - matching your database schema
    const newUser = {
      username: username,
      email: email,
      password: hashedPassword,
      created_at: new Date(),
      last_login: null,
      totp_secret: null,
      login_attempts: 0,
      account_locked: false
    };

    // Insert new user
    const { data: createdUser, error: insertError } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (insertError) {
      console.error("Insert error details:", insertError);
      
      // Handle duplicate key errors
      if (insertError.code === '23505') {
        if (insertError.message.includes('username')) {
          return res.status(400).json({ message: 'Username already exists' });
        }
        if (insertError.message.includes('email')) {
          return res.status(400).json({ message: 'Email already registered' });
        }
      }
      
      return res.status(500).json({ 
        message: 'Database error: ' + insertError.message,
        details: insertError
      });
    }

    console.log("User registered successfully:", createdUser.id);
    
    res.status(201).json({
      message: 'User registered successfully',
      userId: createdUser.id,
      username: createdUser.username,
      email: createdUser.email
    });
    
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ 
      message: "Server error during registration",
      error: err.message 
    });
  }
};

// Get locked accounts (Only for jalgorithm)
exports.getLockedAccounts = async (req, res) => {
  try {
    const { adminUsername } = req.query;

    // Verify admin is 'jalgorithm'
    if (adminUsername !== 'jalgorithm') {
      return res.status(403).json({ 
        message: 'Unauthorized. Only jalgorithm can access this resource.' 
      });
    }

    const { data: lockedUsers, error } = await supabase
      .from('users')
      .select('id, username, email, login_attempts, locked_until, last_login, created_at')
      .eq('account_locked', true)
      .neq('username', 'jalgorithm');

    if (error) {
      console.error("Error fetching locked accounts:", error);
      return res.status(500).json({ message: 'Failed to fetch locked accounts' });
    }

    res.json({ lockedUsers: lockedUsers || [] });
  } catch (err) {
    console.error("Get locked accounts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Unlock account (Only for jalgorithm)
exports.unlockAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminUsername } = req.body;

    // Verify admin is 'jalgorithm'
    if (adminUsername !== 'jalgorithm') {
      return res.status(403).json({ 
        message: 'Unauthorized. Only jalgorithm can unlock accounts.' 
      });
    }

    // Get user to unlock
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow unlocking admin account
    if (user.username === 'jalgorithm') {
      return res.status(403).json({ message: 'Cannot unlock admin account' });
    }

    // Unlock the user account
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ 
        account_locked: false, 
        login_attempts: 0,
        locked_until: null
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error("Error unlocking account:", error);
      return res.status(500).json({ message: 'Failed to unlock account' });
    }

    res.json({ 
      message: 'Account unlocked successfully',
      user: { id: updatedUser.id, username: updatedUser.username }
    });
  } catch (err) {
    console.error("Unlock account error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users (Only for jalgorithm)
exports.getAllUsers = async (req, res) => {
  try {
    const { adminUsername } = req.query;

    // Verify admin is 'jalgorithm'
    if (adminUsername !== 'jalgorithm') {
      return res.status(403).json({ 
        message: 'Unauthorized. Only jalgorithm can access this resource.' 
      });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, login_attempts, account_locked, last_login, created_at')
      .neq('username', 'jalgorithm')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching all users:", error);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }

    res.json({ users: users || [] });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Check password strength
exports.checkPasswordStrength = async (req, res) => {
  try {
    const { password } = req.body;
    
    const checks = {
      length: password.length >= 12,
      capital: /[A-Z]/.test(password),
      small: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    const isValid = Object.values(checks).every(check => check === true);
    
    res.json({
      isValid,
      checks
    });
  } catch (err) {
    console.error("Password check error:", err);
    res.status(500).json({ message: "Failed to check password strength" });
  }
};