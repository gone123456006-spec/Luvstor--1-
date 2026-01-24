import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('User');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Listen for incoming messages
    newSocket.on('receive-message', (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    });

    // Listen for typing indicators
    newSocket.on('user-typing', () => {
      setIsPartnerTyping(true);
    });

    newSocket.on('user-stopped-typing', () => {
      setIsPartnerTyping(false);
    });

    // Get room ID from session storage (if available)
    const storedRoomId = sessionStorage.getItem('roomId');
    if (storedRoomId) {
      setRoomId(storedRoomId);
    }

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    if (!socket || !roomId) return;

    // Emit typing start event
    socket.emit('typing-start', { roomId });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit typing stop after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', { roomId });
    }, 2000);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() && socket) {
      const messageData = {
        sender: username,
        message: inputValue,
        timestamp: new Date().toLocaleTimeString(),
        isOwn: true,
      };
      socket.emit('send-message', messageData);
      setMessages((prev) => [...prev, messageData]);
      setInputValue('');

      // Clear typing timeout and emit stop typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit('typing-stop', { roomId });
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        Chatting on Luvstor
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isOwn ? 'own' : ''}`}>
            <strong>{msg.sender}</strong>
            <div className="message-text">{msg.message}</div>
            <span className="timestamp">{msg.timestamp}</span>
          </div>
        ))}
        {isPartnerTyping && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Chat on Luvstor..."
          autoComplete="off"
        />
        <button onClick={handleSendMessage} aria-label="Send message">Send</button>
      </div>
    </div>
  );
};

export default Chat;
