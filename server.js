const express = require("express");
const { sequelize, connectToDatabase } = require('./database');
const { connectMongooseDb } = require('./mongoose');
const { Media } = require('./mongo_models/media');
const { Message } = require('./mongo_models/message');
const { Conversation } = require('./mongo_models/conversation');
const User = require('./sequelize_models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer'); // for handling file uploads
const path = require('path');
const fs = require('fs'); // for file operations

if(!fs.existsSync("./uploads")){
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    // Generate a unique filename for the uploaded file
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

const app = express();
app.use(express.json());
app.use(cors({
  origin: `localhost:${process.env.APP_PORT}`,
  methods: ['GET', 'POST']
}));

const PORT = process.env.APP_PORT;

async function syncDb() {
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

    await sendConfirmationEmail(email, token);

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

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

app.get('/confirm', async (req, res) => {
  const { token } = req.query;
  if (token != undefined) {
    const user = await User.findOne({ where: { confirmationToken: token } });

    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    user.confirmed = true;
    await user.save();

    res.status(200).json({ message: 'Email confirmed successfully' });
  } else {
    res.status(400).json({ message: "Bad request." });
  }

});

app.post('/api/messages/save', async (req, res) => {
  const { senderId, recipientId, content, mediaId } = req.body;

  try {
    const newMessage = await Message.create({ senderId, recipientId, content, mediaId });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

app.post('/api/media/upload', upload.single('file'), async (req, res) => {
  try {
    const newMedia = await Media.create({ filePath: req.file.path });

    res.status(201).json(newMedia);
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Message.findByIdAndDelete(id);

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

