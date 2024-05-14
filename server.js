const express = require("express");
const { sequelize, connectToDatabase } = require('./database');
const { connectMongooseDb } = require('./mongoose');
const User = require('./sequelize_models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.APP_PORT;

async function syncDb(){
  await sequelize.sync({ force: true });
  console.log('All models were synchronized successfully.');
}

async function startServer() {
  try {
    await connectToDatabase();
    await connectMongooseDb();
    
    app.listen(PORT, () => {
      console.log(`Serverul a pornit, port: ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();

app.post('/api/register', async (req, res) => {
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

      await sendConfirmationEmail(email,token);

      res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'An internal server error occurred' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
          return res.status(401).json({ error: 'Invalid email or password' });
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
          return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });

      res.status(200).json({ token });
  } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'An internal server error occurred' });
  }
});

app.get('/confirm', async (req, res) => {
  const { token } = req.query;

  const user = await User.findOne({ where: { confirmationToken: token } });

  if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
  }

  user.confirmed = true;
  await user.save();

  res.status(200).json({ message: 'Email confirmed successfully' });
});

