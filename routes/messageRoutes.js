const express = require('express');
const router = express.Router();
const { Message } = require('../db_models/message');
const { Conversation } = require('../db_models/conversation');

router.post('/save', async (req, res) => {
    //will check that the user that is logged in is the one sending the message
    const { senderId, recipientId, content, mediaId } = req.body;

    try {
        const newMessage = await Message.create({ senderId, recipientId, content, mediaId });

        res.status(201).json({ message: newMessage });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    //will check that the user that is logged in is the owner of the message
    const { id } = req.params;

    try {
        const messageToDelete = await Message.findByIdAndDelete(id);

        if (messageToDelete == null) {
            res.status(404).json({ error: 'Message not found.' });
        } else {
            res.status(200).json({ message: 'Message deleted successfully' });
        }

    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

router.get('/get/conversation/:id', async (req, res) => {
    //gets all messages from a conversation with a given id
    //will check that the user that's logged in is part of the conversation before sending any data
    try {
        const chatId = req.params.id;
        const chat = await Conversation.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        return res.status(200).json(chat);
    } catch (error) {
        console.error('Error retrieving chat:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

module.exports = router;