const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');

// Render Login Page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  const message = req.query.message || null;
  const redirect = req.query.redirect || '/';
  res.render('login', { title: 'Sign In - ShopSphere', error: null, message, redirect });
});

// Handle Login Form Submission
router.post('/login', async (req, res) => {
  const { email, password, redirect } = req.body;

  try {
    if (!email || !password) {
      return res.render('login', {
        title: 'Sign In - ShopSphere',
        error: 'Please fill in all fields.',
        message: null,
        redirect: redirect || '/'
      });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.trim()]);
    if (!user) {
      return res.render('login', {
        title: 'Sign In - ShopSphere',
        error: 'Invalid email or password.',
        message: null,
        redirect: redirect || '/'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', {
        title: 'Sign In - ShopSphere',
        error: 'Invalid email or password.',
        message: null,
        redirect: redirect || '/'
      });
    }

    // Set user session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };

    const targetUrl = redirect && redirect.startsWith('/') ? redirect : '/';
    res.redirect(targetUrl);
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', {
      title: 'Sign In - ShopSphere',
      error: 'An unexpected error occurred. Please try again.',
      message: null,
      redirect: redirect || '/'
    });
  }
});

// Render Register Page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('register', { title: 'Create Account - ShopSphere', error: null });
});

// Handle Register Form Submission
router.post('/register', async (req, res) => {
  const { username, email, password, full_name } = req.body;

  try {
    if (!username || !email || !password || !full_name) {
      return res.render('register', {
        title: 'Create Account - ShopSphere',
        error: 'All fields are required.'
      });
    }

    if (password.length < 6) {
      return res.render('register', {
        title: 'Create Account - ShopSphere',
        error: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists
    const existingUser = await db.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email.trim(), username.trim()]
    );

    if (existingUser) {
      return res.render('register', {
        title: 'Create Account - ShopSphere',
        error: 'Email or Username is already registered.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      `INSERT INTO users (username, email, password, full_name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [username.trim(), email.trim(), hashedPassword, full_name.trim(), 'user']
    );

    req.session.user = {
      id: result.lastID,
      username: username.trim(),
      email: email.trim(),
      full_name: full_name.trim(),
      role: 'user'
    };

    res.redirect('/?registered=1');
  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', {
      title: 'Create Account - ShopSphere',
      error: 'Registration failed. Please try again.'
    });
  }
});

// Handle Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Logout session destroy error:', err);
    res.redirect('/');
  });
});

module.exports = router;
