const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MediaSchema = new Schema({
  filePath: {type:String, required:true}
},{collection:"media"});

const Media = mongoose.model("Media", MediaSchema);

module.exports = { Media };