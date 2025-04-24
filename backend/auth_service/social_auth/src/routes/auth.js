const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google Auth Routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard');
  }
);

// LinkedIn Auth Routes
router.get('/linkedin',
  passport.authenticate('linkedin')
);

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard');
  }
);

// Microsoft Auth Routes
router.get('/microsoft',
  passport.authenticate('microsoft')
);

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard');
  }
);

// Logout Route
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Get Current User
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Email/Password Registration
router.post('/register', async (req, res) => {
  // TODO: Implement user creation logic (hash password, save to DB, etc.)
  const { name, email, password } = req.body;
  // For now, just return a success response
  res.json({ success: true, message: 'User registered (placeholder)', user: { name, email } });
});

// Email/Password Login
router.post('/login', async (req, res) => {
  // TODO: Implement user authentication logic (check password, etc.)
  const { email, password } = req.body;
  // For now, just return a success response
  res.json({ success: true, message: 'User logged in (placeholder)', user: { email } });
});

module.exports = router; 