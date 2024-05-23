const express = require('express');
const router = express.Router();
const { Message } = require('../db_models/message');
const { Conversation } = require('../db_models/conversation');

router.post('/new', async (req, res) => {
    const { creator, members } = req.body;
  
    try {
      const newConversation = await Conversation.create({ creator, members });
  
      res.status(201).json({ convId: newConversation._id });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ error: 'An internal server error occurred' });
    }
  });

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const conversationToDelete = await Conversation.findByIdAndDelete(id);

        if (conversationToDelete == null) {
            res.status(404).json({ error: 'Conversation not found.' });
        } else {
            res.status(200).json({ message: 'Conversation deleted successfully' });
        }

    } catch (error) {
        console.error('Error deleting Conversation:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

router.get('/mdata/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const conversation = await Conversation.findById(id).populate('creator').populate('members');
  
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
  
      res.status(200).json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ error: 'An internal server error occurred' });
    }
  });

  router.get('/messages/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const messages = await Message.find({recipientId:id});
  
      if (!messages) {
        return res.status(404).json({ error: 'Could not find messages.' });
      }
  
      res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'An internal server error occurred' });
    }
  });

module.exports = router;