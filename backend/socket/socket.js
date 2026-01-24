const User = require("../models/User");

module.exports = (io) => {
  io.on("connection", (socket) => {

    socket.on("joinQueue", async ({ gender }) => {
      let user = await User.create({
        socketId: socket.id,
        gender
      });

      const match = await User.findOne({
        gender: gender === "male" ? "female" : "male",
        status: "searching"
      });

      if (match) {
        const roomId = socket.id + match.socketId;

        user.status = "chatting";
        user.roomId = roomId;
        await user.save();

        match.status = "chatting";
        match.roomId = roomId;
        await match.save();

        io.to(match.socketId).emit("matchFound", roomId);
        socket.emit("matchFound", roomId);
      }
    });

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
    });

    socket.on("sendMessage", ({ roomId, message }) => {
      io.to(roomId).emit("receiveMessage", message);
    });

    // New message handlers for updated chat
    socket.on("send-message", (data) => {
      // Get user's room
      User.findOne({ socketId: socket.id }).then((user) => {
        if (user && user.roomId) {
          socket.to(user.roomId).emit("receive-message", data);
        }
      });
    });

    socket.on("message-seen", () => {
      User.findOne({ socketId: socket.id }).then((user) => {
        if (user && user.roomId) {
          socket.to(user.roomId).emit("message-seen");
        }
      });
    });

    // Typing indicator handlers
    socket.on("typing-start", () => {
      User.findOne({ socketId: socket.id }).then((user) => {
        if (user && user.roomId) {
          socket.to(user.roomId).emit("user-typing");
        }
      });
    });

    socket.on("typing-stop", () => {
      User.findOne({ socketId: socket.id }).then((user) => {
        if (user && user.roomId) {
          socket.to(user.roomId).emit("user-stopped-typing");
        }
      });
    });

    socket.on("disconnect-room", async () => {
      const user = await User.findOne({ socketId: socket.id });
      if (user && user.roomId) {
        socket.leave(user.roomId);
        user.status = "searching";
        user.roomId = null;
        await user.save();
      }
    });

    socket.on("disconnect", async () => {
      await User.deleteOne({ socketId: socket.id });
    });
  });
};
