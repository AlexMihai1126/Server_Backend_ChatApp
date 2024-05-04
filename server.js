const express = require("express");
const { sequelize, connectToDatabase } = require('./database');
const { connectMongooseDb } = require('./mongoose');
const User = require('./sequelize_models/user');

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
      console.log("MAMA CE IMI PLACE POLITIA");
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();

app.get('/test', async (req, res) => {
  try {
    const newUser = await User.create({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
      nume: 'John',
      prenume: 'Doe'
    });
    
    res.json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
