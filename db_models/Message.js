const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  senderId: { type: mongoose.ObjectId, required: true },
  recipientId: { type: mongoose.ObjectId, required: true },
  content: { type: String },
  mediaId: { type: mongoose.ObjectId },
  messageTimestamp: { type: Date, default: Date.now }
}, { collection: "messages" });

const Message = mongoose.model("Message", MessageSchema);

module.exports = { Message };