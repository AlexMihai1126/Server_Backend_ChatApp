const express = require('express');
const router = express.Router();
const { Message } = require('../db_models/Message');
const checkAuth = require ('../middleware/checkAuth');

router.post('/new', async (req, res) => {
    const { senderId, recipientId, content, mediaId } = req.body;
    if(!recipientId){
        return res.status(400).json({error:"No recipient."});
    }

    try {
        const newMessage = await Message.create({ senderId, recipientId, content, mediaId });

        res.status(201).json({ message: newMessage });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    if(!id){
        return res.status(400).json({error:"Missing ID"});
    }

    try {
        const messageToDelete = await Message.findByIdAndDelete(id);

        if (!messageToDelete) {
            res.status(404).json({ error: 'Message not found.' });
        } else {
            res.status(200).json({ message: 'Message deleted successfully' });
        }

    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

module.exports = router;