const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { Media } = require('../db_models/media');

router.post('/uploadb64', async (req, res) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }

  try {
    const { image, fileName } = req.body;

    if (!image || !fileName) {
      return res.status(400).json({ error: 'Image and filename are required' });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(fileName);
    const standardFileName = `file-${uniqueSuffix}${ext}`;
    const filePath = path.join(__dirname,'../uploads', standardFileName);

    const buffer = Buffer.from(image, 'base64');

    await fs.promises.writeFile(filePath, buffer);

    const resizedFileName = `rescaled_${standardFileName}`;
    const resizedFilePath = path.join(__dirname,'../uploads', 'rescaled', resizedFileName);

    await sharp(filePath)
      .resize({ width: 1280 })
      .toFile(resizedFilePath);

    const newMedia = new Media({
      uploadedFileName: standardFileName
    });
    await newMedia.save();

    res.status(201).json({ uploadedFileId: newMedia._id });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const mediaToDelete = await Media.findByIdAndDelete(id);

    if (!mediaToDelete) {
      return res.status(404).json({ error: 'Image not found.' });
    }

    const filePath = path.join(__dirname, '../uploads', mediaToDelete.uploadedFileName);
    const resizedFilePath = path.join(__dirname, '../uploads', 'rescaled', `rescaled_${mediaToDelete.uploadedFileName}`);

    try {
      await fs.promises.unlink(filePath);
      await fs.promises.unlink(resizedFilePath);
      res.status(200).json({ message: 'Image deleted successfully' });
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
      res.status(500).json({ error: 'Error deleting image from the server' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

router.get('/view/full/:id', async (req, res) => {
  try {
    const mediaId = req.params.id;
    const media = await Media.findById(mediaId);

    if (!media) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const fileToSend = path.join(__dirname, "../uploads", media.uploadedFileName);
    res.sendFile(fileToSend);
  } catch (error) {
    console.error('Error retrieving image:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

router.get('/view/resized/:id', async (req, res) => {
  try {
    const mediaId = req.params.id;
    const media = await Media.findById(mediaId);

    if (!media) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const resizedFileName = `rescaled_${media.uploadedFileName}`;
    const resizedFilePath = path.join(__dirname, '../uploads', 'rescaled', resizedFileName);
    res.sendFile(resizedFilePath);
  } catch (error) {
    console.error('Error retrieving image:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

module.exports = router;