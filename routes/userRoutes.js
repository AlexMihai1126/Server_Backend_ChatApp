const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sendConfirmationEmail = require('../nodemailer/sender');
const User = require('../sequelize_models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

router.post('/register', async (req, res) => {
  const { nume, prenume, username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const token = uuidv4();

    await User.create({
      nume,
      prenume,
      username,
      email,
      password: hashedPassword,
      confirmed: false,
      creationToken: token
    });

    await sendConfirmationEmail(email, token);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

router.post('/login', async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body is empty' });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
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
  if (uuidPattern.test(token)) {
    const user = await User.findOne({ where: { creationToken: token } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    } else {
      if (user.confirmed == true) {
        return res.status(400).json({ error: 'Already confirmed' });
      } else {
        user.confirmed = true;
        await user.save();
        res.status(200).json({ message: 'Email confirmed successfully' });
      }
    }
  } else {
    res.status(400).json({ message: "Bad request." });
  }

});

router.get("/conversations", async (req, res) =>{
  //get all the user's conversations (for the current logged in user with JWT)
})


const checkToken = (req, res, next) => {
  const header = req.headers['authorization'];

  if (typeof header !== 'undefined') {
    const bearer = header.split(' ');
    const token = bearer[1];

    req.token = token;
    next();
  } else {
    //If header is undefined return Forbidden (403)
    res.sendStatus(403)
  }
}

//This is a protected route 
router.get('/data', checkToken, (req, res) => {
  //verify the JWT token generated for the user
  jwt.verify(req.token, process.env.JWT_SECRET, (err, authorizedData) => {
    if (err) {
      //If error send Forbidden (403)
      console.log('ERROR: Could not connect to the protected route');
      res.sendStatus(403);
    } else {
      //If token is successfully verified, we can send the autorized data 
      res.json({
        message: 'Successful log in',
        authorizedData
      });
      console.log('SUCCESS: Connected to protected route');
    }
  })
});

module.exports = router;