require('dotenv').config();
const express = require("express");
const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');

const MONGO_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.mdjrlpo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

mongoose
  .connect(MONGO_URI, {dbName:`${process.env.MONGODB_DBNAME}`})
  .then(() => {
    console.log(`Connected to MongoDB Cloud.`);
  })
  .catch(err => {
    console.log("Error connecting to MongoDB Cloud with error: " ,err.message);
  });


const sequelize = new Sequelize(`postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:5432/${process.env.POSTGRES_DBNAME}`)

try {
  sequelize.authenticate();
  console.log('Connected to Postgres DB.');
} catch (error) {
  console.error('Unable to connect to Postgres DB: ', error);
}

app= express();
const PORT = process.env.APP_PORT;

app.get(["/api/get"], function(req, res){
    
    res.json({"message":"RSD"})
        
});

app.listen(PORT, ()=>{
    console.log(`Serverul a pornit, port: ${PORT}`);
});
