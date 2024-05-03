const mongoose = require("mongoose");
var current = new Date();
const timeStamp = new Date(Date.UTC(current.getFullYear(), 
current.getMonth(),current.getDate(),current.getHours(), 
current.getMinutes(),current.getSeconds(), current.getMilliseconds()));

const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
  members: [{type:Number}],
    creationDate:{type:Date, default: timeStamp},
},{collection:"conversations"});

const Conversation = mongoose.model("Conversation", ConversationSchema);

module.exports={ Conversation };