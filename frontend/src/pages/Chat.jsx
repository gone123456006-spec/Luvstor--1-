import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import logo from '../assets/logo.png';
import '../chat.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const username = 'You';

  /* ---------------- Socket Setup ---------------- */
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('receive-message', (data) => {
      setMessages((prev) => [
        ...prev,
        { ...data, isOwn: false, seen: true }
      ]);

      // tell sender message is seen
      socketRef.current.emit('message-seen');
    });

    socketRef.current.on('message-seen', () => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isOwn ? { ...msg, seen: true } : msg
        )
      );
    });

    socketRef.current.on('user-typing', () => {
      setIsPartnerTyping(true);
    });

    socketRef.current.on('user-stopped-typing', () => {
      setIsPartnerTyping(false);
    });

    return () => socketRef.current.disconnect();
  }, []);

  /* ---------------- Emoji Toggle Logic ---------------- */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) && !event.target.closest('.emoji-btn')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  /* ---------------- Auto Scroll ---------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  /* ---------------- Typing Logic ---------------- */
  const handleTyping = (e) => {
    setInputValue(e.target.value);

    socketRef.current.emit('typing-start');

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing-stop');
    }, 1200);
  };

  /* ---------------- Send Message ---------------- */
  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const messageData = {
      sender: username,
      message: inputValue,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      seen: false,
    };

    socketRef.current.emit('send-message', messageData);
    setMessages((prev) => [...prev, { ...messageData, isOwn: true }]);
    setInputValue('');
    setShowEmojiPicker(false);
    socketRef.current.emit('typing-stop');
  };

  /* ---------------- Emoji ---------------- */
  const onEmojiClick = (emojiData) => {
    setInputValue((prev) => prev + emojiData.emoji);
  };

  /* ---------------- Next Stranger ---------------- */
  const handleNext = () => {
    socketRef.current.emit('disconnect-room');
    setMessages([]);
    window.location.href = '/match';
  };

  return (
    <div className={`chat-container ${showEmojiPicker ? 'emoji-open' : ''}`}>
      {/* HEADER */}
      <div className="chat-header">
        <div className="header-left">
          <img src={logo} alt="Luvstor" className="chat-logo" />
          <div className="stranger-details">
            <h4>Stranger</h4>
            <span className={`status ${isPartnerTyping ? 'typing' : 'online'}`}>
              {isPartnerTyping ? 'typing...' : 'online'}
            </span>
          </div>
        </div>

        <button className="next-btn" onClick={handleNext}>
          Next
        </button>
      </div>

      {/* MESSAGES */}
      <div className="chat-body">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`bubble ${msg.isOwn ? 'own' : 'other'}`}
          >
            <p>{msg.message}</p>
            <span>
              {msg.timestamp}
              {msg.isOwn && msg.seen && ' ✓✓'}
            </span>
          </div>
        ))}

        {isPartnerTyping && (
          <div className="typing-bubble">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="chat-input">
        <button
          className="emoji-btn"
          onClick={toggleEmojiPicker}
        >
          😊
        </button>

        <input
          type="text"
          placeholder="Type a message..."
          value={inputValue}
          onChange={handleTyping}
          onFocus={() => setShowEmojiPicker(false)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />

        <button onClick={sendMessage}>Send</button>
      </div>

      {showEmojiPicker && (
        <div className="emoji-popup" ref={emojiPickerRef}>
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme="dark"
            width={320}
            height={300}
            previewConfig={{ showPreview: false }}
            searchDisabled
            skinTonesDisabled
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
