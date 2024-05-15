const mongoose = require('mongoose');

require('dotenv').config();

const MONGO_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}${process.env.MONGODB_STR}`;

async function connectMongooseDb(){
    try{
        await mongoose.connect(MONGO_URI, { dbName: process.env.MONGODB_DBNAME });
        console.log(`Connected to MongoDB Cloud.`);
    }
    catch(error){
        console.log("Error connecting to MongoDB Cloud with error: " ,error);
    }
  }

  module.exports = {connectMongooseDb};