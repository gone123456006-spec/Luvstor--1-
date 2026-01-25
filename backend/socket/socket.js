const User = require("../models/User");
const Message = require("../models/Message");
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id;
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on("connection", async (socket) => {
    try {
      console.log(`User connected: ${socket.username || 'Unknown'} (${socket.id})`);

      // If socket has no authenticated user, disconnect gracefully
      if (!socket.userId) {
        console.warn(`Unauthenticated socket connected, disconnecting: ${socket.id}`);
        socket.emit('unauthorized', { message: 'Authentication required' });
        socket.disconnect(true);
        return;
      }

      // Update user status to online
      await User.findByIdAndUpdate(socket.userId, {
        socketId: socket.id,
        isActive: true,
        status: 'online'
      });

      // Join queue and find match
      socket.on("joinQueue", async ({ preference }) => {
        try {
          // Update user status to searching
          const user = await User.findByIdAndUpdate(
            socket.userId,
            {
              status: 'searching',
              preference: preference || 'both'
            },
            { new: true }
          );

          console.log(`[QUEUE] ${user.username} (${user.gender}) is searching...`);

          // Simple match query - find ANY other user who is searching
          let match = await User.findOne({
            _id: { $ne: user._id },
            status: 'searching',
            socketId: { $ne: null }
          });

          // Sanity check: verify the potential match's socket is actually active
          if (match && !io.sockets.sockets.get(match.socketId)) {
            console.log(`[QUEUE] Found stale user ${match.username}, resetting...`);
            await User.findByIdAndUpdate(match._id, { status: 'offline', socketId: null });
            // Try to find another one
            match = await User.findOne({
              _id: { $ne: user._id },
              status: 'searching',
              socketId: { $ne: null }
            });
          }

          if (match) {
            console.log(`[MATCH] Found! ${user.username} <-> ${match.username}`);

            // Create unique room ID
            const roomId = [user._id.toString(), match._id.toString()].sort().join('-');

            // Update both users to chatting status
            await User.findByIdAndUpdate(user._id, {
              status: 'chatting',
              roomId: roomId
            });

            await User.findByIdAndUpdate(match._id, {
              status: 'chatting',
              roomId: roomId
            });

            // Notify both users
            io.to(match.socketId).emit("matchFound", {
              roomId,
              partnerId: user._id,
              partnerUsername: user.username
            });

            socket.emit("matchFound", {
              roomId,
              partnerId: match._id,
              partnerUsername: match.username
            });

            console.log(`[MATCH] Success! Room: ${roomId}`);
          } else {
            socket.emit("waitingForMatch");
            console.log(`[QUEUE] ${user.username} waiting for a partner...`);
          }
        } catch (error) {
          console.error('[QUEUE] Error:', error);
          socket.emit("error", { message: "Failed to join queue" });
        }
      });

      // Join room
      socket.on("joinRoom", async (roomId) => {
        try {
          if (!socket.userId) return;
          socket.join(roomId);
          console.log(`${socket.username} joined room: ${roomId}`);

          // Notify partner that user joined
          socket.to(roomId).emit("partnerJoined");
        } catch (error) {
          console.error('Error in joinRoom:', error);
        }
      });

      // Send message (New WhatsApp-style handler)
      socket.on("send-message", async (data) => {
        try {
          if (!socket.userId) return;
          const user = await User.findById(socket.userId);
          if (user && user.roomId) {
            // Save message to database (Optional, but good for persistence)
            const partnerIdStr = user.roomId.split('-').find(id => id !== user._id.toString());
            if (partnerIdStr) {
              await Message.create({
                sender: user._id,
                receiver: partnerIdStr,
                roomId: user.roomId,
                content: data.message
              });
            }

            socket.to(user.roomId).emit("receive-message", data);
          }
        } catch (error) {
          console.error('Error in send-message:', error);
        }
      });

      socket.on("message-seen", async () => {
        try {
          if (!socket.userId) return;
          const user = await User.findById(socket.userId);
          if (user && user.roomId) {
            socket.to(user.roomId).emit("message-seen");
          }
        } catch (error) {
          console.error('Error in message-seen:', error);
        }
      });

      // Typing indicator handlers
      socket.on("typing-start", async () => {
        try {
          if (!socket.userId) return;
          const user = await User.findById(socket.userId);
          if (user && user.roomId) {
            socket.to(user.roomId).emit("user-typing");
          }
        } catch (error) {
          console.error('Error in typing-start:', error);
        }
      });

      socket.on("typing-stop", async () => {
        try {
          if (!socket.userId) return;
          const user = await User.findById(socket.userId);
          if (user && user.roomId) {
            socket.to(user.roomId).emit("user-stopped-typing");
          }
        } catch (error) {
          console.error('Error in typing-stop:', error);
        }
      });

      socket.on("disconnect-room", async () => {
        try {
          if (!socket.userId) return;
          const user = await User.findById(socket.userId);
          if (user && user.roomId) {
            const roomId = user.roomId;

            // Notify partner
            socket.to(roomId).emit("partnerDisconnected");

            // Reset partner status
            const partnerIdStr = roomId.split('-').find(id => id !== user._id.toString());
            if (partnerIdStr) {
              await User.findByIdAndUpdate(partnerIdStr, {
                status: 'online',
                roomId: null
              });
            }

            socket.leave(roomId);
            user.status = 'online';
            user.roomId = null;
            await user.save();
            console.log(`${user.username} left chat room ${roomId}`);
          }
        } catch (error) {
          console.error('Error in disconnect-room:', error);
        }
      });

      // Disconnect
      socket.on("disconnect", async () => {
        try {
          const user = await User.findById(socket.userId);

          if (user) {
            // If user was in a chat, notify partner
            if (user.roomId) {
              socket.to(user.roomId).emit("partnerDisconnected");

              // Reset partner status
              const partnerIdStr = user.roomId.split('-').find(id => id !== user._id.toString());
              if (partnerIdStr) {
                await User.findByIdAndUpdate(partnerIdStr, {
                  status: 'online',
                  roomId: null
                });
              }
            }

            // Update user status to offline
            await User.findByIdAndUpdate(socket.userId, {
              socketId: null,
              isActive: false,
              status: 'offline',
              roomId: null
            });

            console.log(`User disconnected: ${socket.username}`);
          }
        } catch (error) {
          console.error('Error in disconnect:', error);
        }
      });
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  });
};
