const fs = require('fs');
const path = require('path')
const clearDirectorySync = require('../helpers/clearDir');
const modulePrefix = "[SERVER/FolderCreation]";
function makeFolders(){
    if (!fs.existsSync("./uploads")) {
      console.log(`${modulePrefix} Creating uploads folder`);
      fs.mkdirSync("uploads");
    }
    
    if (!fs.existsSync("./uploads/rescaled")) {
      console.log(`${modulePrefix} Creating uploads/rescaled folder`);
      fs.mkdirSync("uploads/rescaled");
    }
    
    if (!fs.existsSync("./uploads/profilepics")) {
      console.log(`${modulePrefix} Creating uploads/profilepics folder`);
      fs.mkdirSync("uploads/profilepics");
    }
    if (!fs.existsSync("./uploads/deleted")) {
      console.log(`${modulePrefix} Creating uploads/deleted folder`);
      fs.mkdirSync("uploads/deleted");
    } else {
      const deletedPath = path.join(__dirname,"../uploads","deleted");
      clearDirectorySync(deletedPath)
    }
  }

module.exports = makeFolders;