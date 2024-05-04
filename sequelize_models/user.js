const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nume: {
    type: DataTypes.STRING,
    allowNull: false
  },
  prenume: {
    type: DataTypes.STRING,
    allowNull: false
  },
  username : {
    type: DataTypes.STRING,
    allowNull: false,
    unique:true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  confirmed:{
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {});

module.exports = User;
