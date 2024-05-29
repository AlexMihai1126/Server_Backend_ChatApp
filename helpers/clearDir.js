const fs = require('fs');
const path = require('path');
const modulePrefix = "[SERVER/FolderDelete]"

function clearDirectorySync(directoryPath) {
  try {
    const files = fs.readdirSync(directoryPath);

    if (files.length === 0) {
      console.log(`${modulePrefix} The directory ${directoryPath} is already empty.`);
      return;
    }
    
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      fs.unlinkSync(filePath);
      //console.log(`Deleted file: ${filePath}`);
    }
    
    console.log(`${modulePrefix} All files of folder ${directoryPath} deleted successfully.`);
  } catch (error) {
    console.error(`${modulePrefix} Error clearing directory ${directoryPath} :`, error);
  }
}

module.exports = clearDirectorySync;