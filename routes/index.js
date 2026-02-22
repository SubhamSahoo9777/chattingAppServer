const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Chat server is healthy' });
});

module.exports = router;
