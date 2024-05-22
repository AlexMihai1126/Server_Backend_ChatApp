const express = require('express');
const router = express.Router();
const User = require('../mongo_models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const sendConfirmationEmail = require('../nodemailer/sender');

router.post('/register', async (req, res) => {
  const { nume, prenume, username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username: username }, { email: email }] }).lean();

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

    const tokenPayload = { email: user.email, username: user.username };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
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

// Middleware to check JWT token
const checkToken = (req, res, next) => {
  const header = req.headers['authorization'];

  if (typeof header !== 'undefined') {
    const bearer = header.split(' ');
    const token = bearer[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = decoded; // Set the decoded user information in the request
      next();
    });
  } else {
    res.sendStatus(403);
  }
};

// Protected route example
router.get('/data', checkToken, (req, res) => {
  res.json({
    message: 'Successful log in',
    user: req.user
  });
});

module.exports = router;
