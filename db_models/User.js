const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    nume: { type: String, required: true },
    prenume: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    confirmed: { type: Boolean, default: false },
    creationToken: { type: String, default: uuidv4 },
    picture : {type:mongoose.ObjectId},
    registerTimestamp: { type: Date, default: Date.now },
}, { collection: 'users' });

const User = mongoose.model('User', UserSchema);

module.exports = User;
