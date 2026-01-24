import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    const connectSocket = () => {
        const token = localStorage.getItem('token');

        if (socket?.connected) return socket;

        const newSocket = io(SOCKET_URL, {
            auth: { token },
            autoConnect: true
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log('Socket connected');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Socket disconnected');
        });

        setSocket(newSocket);
        return newSocket;
    };

    const disconnectSocket = () => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, connectSocket, disconnectSocket }}>
            {children}
        </SocketContext.Provider>
    );
};
