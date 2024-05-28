const path = require('path');

function generateFilename(prefix,initialFilename){
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(initialFilename);
    return `${prefix}-${uniqueSuffix}${ext}`;
}

module.exports = generateFilename;