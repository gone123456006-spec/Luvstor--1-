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
    console.log(`User connected: ${socket.username} (${socket.id})`);

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

        console.log(`${user.username} is searching for ${preference || 'both'} gender match`);

        // Find a match based on preference
        let matchQuery = {
          _id: { $ne: user._id }, // Not the same user
          status: 'searching',
          socketId: { $ne: null }
        };

        // Apply gender matching logic
        if (user.preference === 'same') {
          matchQuery.gender = user.gender;
          matchQuery.$or = [
            { preference: 'same' },
            { preference: 'both' }
          ];
        } else if (user.preference === 'opposite') {
          matchQuery.gender = user.gender === 'male' ? 'female' : 'male';
          matchQuery.$or = [
            { preference: 'opposite' },
            { preference: 'both' }
          ];
        } else { // both
          matchQuery.$or = [
            {
              gender: user.gender,
              preference: { $in: ['same', 'both'] }
            },
            {
              gender: user.gender === 'male' ? 'female' : 'male',
              preference: { $in: ['opposite', 'both'] }
            }
          ];
        }

        const match = await User.findOne(matchQuery);

        if (match) {
          // Create unique room ID
          const roomId = [user._id.toString(), match._id.toString()].sort().join('-');

          // Update both users
          user.status = 'chatting';
          user.roomId = roomId;
          await user.save();

          match.status = 'chatting';
          match.roomId = roomId;
          await match.save();

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

          console.log(`Match found: ${user.username} <-> ${match.username} in room ${roomId}`);
        } else {
          socket.emit("waitingForMatch");
          console.log(`${user.username} is waiting for a match...`);
        }
      } catch (error) {
        console.error('Error in joinQueue:', error);
        socket.emit("error", { message: "Failed to join queue" });
      }
    });

    // Join room
    socket.on("joinRoom", async (roomId) => {
      try {
        socket.join(roomId);
        console.log(`${socket.username} joined room: ${roomId}`);

        // Notify partner that user joined
        socket.to(roomId).emit("partnerJoined");
      } catch (error) {
        console.error('Error in joinRoom:', error);
      }
    });

    // Send message
    socket.on("sendMessage", async ({ roomId, message }) => {
      try {
        const user = await User.findById(socket.userId);

        if (!user || user.roomId !== roomId) {
          return socket.emit("error", { message: "Not in this room" });
        }

        // Find the partner in the room
        const partnerIdStr = roomId.split('-').find(id => id !== user._id.toString());
        const partner = await User.findById(partnerIdStr);

        if (!partner) {
          return socket.emit("error", { message: "Partner not found" });
        }

        // Save message to database
        const newMessage = await Message.create({
          sender: user._id,
          receiver: partner._id,
          roomId,
          content: message
        });

        // Emit message to room
        const messageData = {
          id: newMessage._id,
          content: message,
          sender: user._id.toString(),
          senderUsername: user.username,
          timestamp: newMessage.createdAt
        };

        io.to(roomId).emit("receiveMessage", messageData);
        console.log(`Message in ${roomId}: ${user.username}: ${message}`);
      } catch (error) {
        console.error('Error in sendMessage:', error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicators
    socket.on("typing-start", async ({ roomId }) => {
      try {
        const user = await User.findById(socket.userId);
        if (user && user.roomId === roomId) {
          socket.to(roomId).emit("user-typing");
        }
      } catch (error) {
        console.error('Error in typing-start:', error);
      }
    });

    socket.on("typing-stop", async ({ roomId }) => {
      try {
        const user = await User.findById(socket.userId);
        if (user && user.roomId === roomId) {
          socket.to(roomId).emit("user-stopped-typing");
        }
      } catch (error) {
        console.error('Error in typing-stop:', error);
      }
    });

    // Leave chat
    socket.on("leaveChat", async () => {
      try {
        const user = await User.findById(socket.userId);

        if (user && user.roomId) {
          const roomId = user.roomId;

          // Notify partner
          socket.to(roomId).emit("partnerDisconnected");

          // Find partner and reset their status
          const partnerIdStr = roomId.split('-').find(id => id !== user._id.toString());
          if (partnerIdStr) {
            await User.findByIdAndUpdate(partnerIdStr, {
              status: 'online',
              roomId: null
            });
          }

          // Reset user status
          user.status = 'online';
          user.roomId = null;
          await user.save();

          socket.leave(roomId);
          console.log(`${user.username} left chat room ${roomId}`);
        }
      } catch (error) {
        console.error('Error in leaveChat:', error);
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
  });
};
