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

    // Typing indicator handlers
    socket.on("typing-start", ({ roomId }) => {
      if (roomId) {
        socket.to(roomId).emit("user-typing");
      }
    });

    socket.on("typing-stop", ({ roomId }) => {
      if (roomId) {
        socket.to(roomId).emit("user-stopped-typing");
      }
    });

    socket.on("disconnect", async () => {
      await User.deleteOne({ socketId: socket.id });
    });
  });
};
