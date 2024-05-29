const express = require("express");
const { connectMongooseDb } = require('./mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const imageRoutes = require('./routes/imageRoutes');
//const mediaRoutes = require('./routes/mediaRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const friendRoutes = require('./routes/friendRoutes');
const makeFolders = require ('./helpers/makeFolders');
const modulePrefix = "[SERVER/Main]";

function preStartupTasks(){
  console.log(`${modulePrefix} Performing pre-startup tasks.`);
  makeFolders();
}

const app = express();
app.use(cors({
  origin: `*`,
  methods: ['GET', 'POST','DELETE'],
  allowedHeaders:['sessionId', 'Content-Type', 'Authorization'],
  exposedHeaders: ['sessionId'],
}));
app.options('*', cors({origin:'*'}));
app.use(express.json({ limit: '20mb' })); // Increase the JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '20mb' })); // Increase the URL-encoded payload limit

app.use('/user', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
//app.use('/api/media', mediaRoutes);
app.use('/api/images', imageRoutes);
app.use('/friends',friendRoutes);

const PORT = process.env.APP_PORT;


async function startServer() {
  try {
    await connectMongooseDb();

    app.listen(PORT, () => {
      console.log(`${modulePrefix} Started successfully on port: ${PORT}`);
    });
  } catch (error) {
    console.error(`${modulePrefix} Error starting:`, error);
  }
}

preStartupTasks();
startServer();