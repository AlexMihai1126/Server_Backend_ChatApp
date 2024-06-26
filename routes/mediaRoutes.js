const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Media = require('../db_models/Media');
const fs = require('fs');
const checkAuth = require('../middleware/checkAuth');
const modulePrefix = "[MediaRoutes]";
const generateName = require('../helpers/generateUniqueFilename');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage });

router.post('/upload', checkAuth, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const generatedName = generateName("file", req.file.filename);

        const newMedia = new Media({
            uploadedFileName: generatedName,
            originalFileName: req.file.filename,
            fileExtension: path.extname(req.file.filename),
            owner: req.user.id
        });
        await newMedia.save();

        res.status(201).json({ uploadedFileId: newMedia._id });
    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

router.get('/get/:id', async (req, res) => {
    const mediaId = req.params.id;
    if (!mediaId) {
        return res.status(400).json({ error: "Missing ID" })
    }
    try {

        const media = await Media.findById(mediaId);

        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }
        const fileToSend = path.join(__dirname, "../uploads", media.uploadedFileName);
        res.sendFile(fileToSend);
    } catch (error) {
        console.error('Error retrieving media:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

router.delete('/delete/:id', checkAuth, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: "Missing ID" })
    }
    try {
        const mediaToDelete = await Media.findByIdAndDelete(id);

        if (!mediaToDelete) {
            return res.status(404).json({ error: 'Media not found.' });
        }

        if (mediaToDelete.owner != req.user.id) {
            return res.status(403).json({ error: "Not your file!" });
        }

        const filePathInit = path.join(__dirname, '../uploads', mediaToDelete.uploadedFileName);
        const filePathMoved = path.join(__dirname, '../uploads', 'deleted', mediaToDelete.uploadedFileName);

        try {
            await fs.promises.rename(filePathInit, filePathMoved);
            res.status(200).json({ message: 'Media deleted successfully' });
        } catch (fileError) {
            console.error('Error deleting files:', fileError);
            res.status(500).json({ error: 'Error deleting media from the server' });
        }
    } catch (error) {
        console.error('Error deleting media:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

module.exports = router;