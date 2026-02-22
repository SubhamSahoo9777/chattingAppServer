const User = require('./models/User');

const socketEvents = (io) => {
    const userSocketMap = {}; // userId: socketId

    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId;
        
        if (userId && userId !== 'undefined') {
            userSocketMap[userId] = socket.id;
            
            // Broadcast user online status
            updateUserStatus(userId, 'online');
            io.emit('getOnlineUsers', Object.keys(userSocketMap));
        }

        // Send and receive messages
        socket.on('sendMessage', (message) => {
            const { conversationId, sender, text, participants } = message;
            
            participants.forEach(participantId => {
                if (participantId !== sender._id) {
                    const receiverSocketId = userSocketMap[participantId];
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('newMessage', message);
                    }
                }
            });
        });

        // Typing indicators
        socket.on('typing_start', ({ conversationId, senderId, recipientId }) => {
            const receiverSocketId = userSocketMap[recipientId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing_start', { conversationId, senderId });
            }
        });

        socket.on('typing_stop', ({ conversationId, senderId, recipientId }) => {
            const receiverSocketId = userSocketMap[recipientId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing_stop', { conversationId, senderId });
            }
        });

        socket.on('disconnect', () => {
            if (userId) {
                delete userSocketMap[userId];
                updateUserStatus(userId, 'offline');
                io.emit('getOnlineUsers', Object.keys(userSocketMap));
            }
        });
    });
};

const updateUserStatus = async (userId, status) => {
    try {
        await User.findByIdAndUpdate(userId, { 
            status, 
            lastSeen: new Date() 
        });
    } catch (error) {
        console.error('Error updating status:', error);
    }
};

module.exports = socketEvents;
