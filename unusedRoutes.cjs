app.get('/api/media/view/full/:id', async (req, res) => {
    try {
      const mediaId = req.params.id;
      const media = await Media.findById(mediaId);
  
      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }
      const fileToSend = path.join(__dirname, "uploads", media.uploadedFileName);
      res.sendFile(fileToSend);
    } catch (error) {
      console.error('Error retrieving media:', error);
      res.status(500).json({ error: 'An internal server error occurred' });
    }
  });
  
  app.post('/api/media/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const filePath = req.file.path;
      const fileName = req.file.filename;
  
      const newMedia = new Media({
        uploadedFileName: fileName
      });
      await newMedia.save();
  
      res.status(201).json({ uploadedFileId: newMedia._id });
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ error: 'An internal server error occurred' });
    }
  });