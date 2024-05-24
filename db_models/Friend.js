const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const FriendSchema = new Schema({
    person1: { type: mongoose.ObjectId, ref: 'User', required: true },
    person2: { type: mongoose.ObjectId, ref: 'User', required: true },
}, { collection: 'friends' });

const Friend = mongoose.model('Friend', FriendSchema);

module.exports = Friend;