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
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const sendConfirmationEmail = require('./nodemailer/sender');
const sharp = require('sharp');

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("uploads");
}

if (!fs.existsSync("./uploads/rescaled")) {
  fs.mkdirSync("uploads/rescaled");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

const app = express();
app.use(express.json({ limit: '50mb' })); // Increase the JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increase the URL-encoded payload limit
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

app.get('/confirm', async (req, res) => {
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

app.post('/api/images/uploadb64', async (req, res) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }

  try {
    const { image, fileName } = req.body;

    if (!image || !fileName) {
      return res.status(400).json({ error: 'Image and filename are required' });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(fileName);
    const standardFileName = `file-${uniqueSuffix}${ext}`;
    const filePath = path.join('uploads', standardFileName);

    const buffer = Buffer.from(image, 'base64');

    await fs.promises.writeFile(filePath, buffer);

    const resizedFileName = `rescaled_${standardFileName}`;
    const resizedFilePath = path.join('uploads', 'rescaled', resizedFileName);

    await sharp(filePath)
      .resize({ width: 1280 })
      .toFile(resizedFilePath);

    const newMedia = new Media({
      uploadedFileName: standardFileName
    });
    await newMedia.save();

    res.status(201).json({ uploadedFileId: newMedia._id });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

app.delete('/api/images/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const mediaToDelete = await Media.findByIdAndDelete(id);

    if (!mediaToDelete) {
      return res.status(404).json({ error: 'Media not found.' });
    }

    const filePath = path.join(__dirname, 'uploads', mediaToDelete.uploadedFileName);
    const resizedFilePath = path.join(__dirname, 'uploads', 'rescaled', `rescaled_${mediaToDelete.uploadedFileName}`);

    try {
      await fs.promises.unlink(filePath);
      await fs.promises.unlink(resizedFilePath);
      res.status(200).json({ message: 'Media and files deleted successfully' });
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
      res.status(500).json({ error: 'Error deleting files from the server' });
    }
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

app.get('/api/image/view/full/:id', async (req, res) => {
  try {
    const mediaId = req.params.id;
    const media = await Media.findById(mediaId);

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    const fileToSend = path.join(__dirname, "uploads", media.uploadedFileName);
    res.sendFile(fileToSend);
  } catch (error) {
    console.error('Error retrieving media:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

app.get('/api/image/view/resized/:id', async (req, res) => {
  try {
    const mediaId = req.params.id;
    const media = await Media.findById(mediaId);

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    const resizedFileName = `rescaled_${media.uploadedFileName}`;
    const resizedFilePath = path.join(__dirname, 'uploads', 'rescaled', resizedFileName);
    res.sendFile(resizedFilePath);
  } catch (error) {
    console.error('Error retrieving media:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

app.delete('/api/messages/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const messageToDelete = await Message.findByIdAndDelete(id);

    if(messageToDelete == null){
      res.status(404).json({error: 'Message not found.'});
    } else{
      res.status(200).json({ message: 'Message deleted successfully' });
    }

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

app.post('/api/messages/save', async (req, res) => {
  const { senderId, recipientId, content, mediaId } = req.body;

  try {
    const newMessage = await Message.create({ senderId, recipientId, content, mediaId });

    res.status(201).json({message:newMessage});
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

