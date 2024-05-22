const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
  members: [{ type: mongoose.ObjectId }],
  creationDate: { type: Date, default: Date.now }
}, { collection: "conversations" });

const Conversation = mongoose.model("Conversation", ConversationSchema);

module.exports = { Conversation };