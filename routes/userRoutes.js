const express = require('express');
const router = express.Router();
const User = require('../db_models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const sendConfirmationEmail = require('../nodemailer/sender');
const checkAuth = require('../middleware/checkAuth');

router.post('/register', async (req, res) => {
  const { nume, prenume, username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username: username }, { email: email }] });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = uuidv4();

    const newUser = new User({
      nume,
      prenume,
      username,
      email,
      password: hashedPassword,
      creationToken: token
    });

    await newUser.save();
    await sendConfirmationEmail(email, token);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

router.post('/login', async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.confirmed) {
      return res.status(403).json({ error: 'Account not confirmed' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokenPayload = { email: user.email, username: user.username, id: user._id };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7 days' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

router.get('/data', checkAuth, (req, res) => {
  res.json({
    message: 'Successful log in',
    user: req.user
  });
});

router.delete('/delete', checkAuth, async (req, res) => {
  try {
    const userToDelete = await User.findOneAndDelete({ username: req.user.username });
    if (userToDelete == null) {
      res.status(404).json({ error: 'User not found.' });
    } else {
      res.status(200).json({ message: 'User deleted successfully' });
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

router.get('/confirm', async (req, res) => {
  const { token } = req.query;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(token)) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  try {
    const user = await User.findOne({ creationToken: token });
    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    if (user.confirmed) {
      return res.status(400).json({ error: 'Account already confirmed' });
    }

    user.confirmed = true;
    await user.save();
    res.status(200).json({ message: 'Email confirmed successfully' });
  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

module.exports = router;
