const { Sequelize } = require('sequelize');

require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DBNAME,
  schema: process.env.POSTGRES_SCHEMA_NAME
});

async function connectToDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Postgres DB.');
  } catch (error) {
    console.error('Unable to connect to Postgres DB: ', error);
  }
}

module.exports = { sequelize, connectToDatabase };
