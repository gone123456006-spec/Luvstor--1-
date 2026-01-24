const { Server } = require('socket.io');
const socketHandler = require('./socket');

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Pass the io instance to the socket handler
    socketHandler(io);

    return io;
};
