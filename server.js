const express = require("express");
const { sequelize, connectToDatabase } = require('./database');
const { connectMongooseDb } = require('./mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const imageRoutes = require('./routes/imageRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const fs = require('fs');

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("uploads");
}

if (!fs.existsSync("./uploads/rescaled")) {
  fs.mkdirSync("uploads/rescaled");
}

const app = express();
app.use(cors({
  origin: `*`,
  methods: ['GET', 'POST','DELETE'],
  allowedHeaders:['sessionId', 'Content-Type'],
  exposedHeaders: ['sessionId'],
}));
app.options('*', cors());
app.use(express.json({ limit: '50mb' })); // Increase the JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increase the URL-encoded payload limit

app.use('/user', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/images', imageRoutes);

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