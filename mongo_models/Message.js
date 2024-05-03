const mongoose = require("mongoose");

var current = new Date();
const timeStamp = new Date(Date.UTC(current.getFullYear(), 
current.getMonth(),current.getDate(),current.getHours(), 
current.getMinutes(),current.getSeconds(), current.getMilliseconds()));

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  senderId: {type:Number, required:true},
  recipientId: {type:Number, required:true},
  content: {type: String},
  mediaId:{type: mongoose.ObjectId},
  messageTimestamp:{type:Date, default: timeStamp},
},{collection:"messages"});

const Message = mongoose.model("Message", MessageSchema);

module.exports = { Message };