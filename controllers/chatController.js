const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
        .populate('participants', 'username profilePic status lastSeen')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message.find({ conversationId })
            .populate('sender', 'username profilePic')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, text, recipientId } = req.body;
        
        let activeConvId = conversationId;

        // If it's a new conversation
        if (!activeConvId) {
            const existing = await Conversation.findOne({
                participants: { $all: [req.user._id, recipientId] }
            });

            if (existing) {
                activeConvId = existing._id;
            } else {
                const newConv = await Conversation.create({
                    participants: [req.user._id, recipientId]
                });
                activeConvId = newConv._id;
            }
        }

        const message = await Message.create({
            conversationId: activeConvId,
            sender: req.user._id,
            text
        });

        await Conversation.findByIdAndUpdate(activeConvId, {
            lastMessage: message._id
        });

        const populatedMessage = await message.populate('sender', 'username profilePic');
        
        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const keyword = req.query.search ? {
            $or: [
                { username: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ]
        } : {};

        const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
