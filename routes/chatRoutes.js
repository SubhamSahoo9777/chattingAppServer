const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, searchUsers } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/conversations', getConversations);
router.get('/messages/:conversationId', getMessages);
router.post('/messages', sendMessage);
router.get('/users', searchUsers);

module.exports = router;
