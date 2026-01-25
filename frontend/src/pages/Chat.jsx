import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { Smile, Send, LogOut } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import logo from '../assets/logo.png';
import '../chat.css';

const Chat = () => {
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const roomId = location.state?.roomId;
  const partnerUsername = location.state?.partnerUsername || 'Stranger';
  const myUsername = 'You';

  useEffect(() => {
    if (!socket || !roomId) {
      navigate('/match');
      return;
    }

    // Join the room
    socket.emit('joinRoom', roomId);

    const handleReceiveMessage = (data) => {
      setMessages((prev) => [
        ...prev,
        { ...data, isOwn: false, seen: true }
      ]);
      // socket.emit('message-seen', { roomId }); // Backend doesn't support room arg in message-seen yet?
    };

    const handleUserTyping = () => setIsPartnerTyping(true);
    const handleUserStoppedTyping = () => setIsPartnerTyping(false);

    const handlePartnerDisconnected = () => {
      setMessages(prev => [...prev, { system: true, message: 'Partner disconnected.' }]);
    };

    socket.on('receive-message', handleReceiveMessage); // Check event name compatibility
    socket.on('receiveMessage', handleReceiveMessage); // Try both just in case
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stopped-typing', handleUserStoppedTyping);
    socket.on('partnerDisconnected', handlePartnerDisconnected);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stopped-typing', handleUserStoppedTyping);
      socket.off('partnerDisconnected', handlePartnerDisconnected);
      // Don't disconnect socket here, just leave room logic if needed? 
      // SocketContext handles disconnect on app unmount or explicit disconnect
    };
  }, [socket, roomId, navigate]);

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

    socket?.emit('typing-start', { roomId });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('typing-stop', { roomId });
    }, 1200);
  };

  /* ---------------- Send Message ---------------- */
  const sendMessage = () => {
    if (!inputValue.trim() || !socket) return;

    const messageData = {
      sender: myUsername,
      message: inputValue,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      seen: false,
    };

    // Emit to backend
    socket.emit('send-message', { roomId, message: inputValue });
    // Note: Backend 'sendMessage' handler expects { roomId, message }
    // Frontend local update
    setMessages((prev) => [...prev, { ...messageData, isOwn: true }]);

    setInputValue('');
    setShowEmojiPicker(false);
    socket.emit('typing-stop', { roomId });
  };

  /* ---------------- Emoji ---------------- */
  const onEmojiClick = (emojiData) => {
    setInputValue((prev) => prev + emojiData.emoji);
  };

  /* ---------------- Next Stranger ---------------- */
  const handleNext = () => {
    socket?.emit('disconnect-room');
    navigate('/match');
  };

  return (
    <div className={`chat-container full-screen ${showEmojiPicker ? 'emoji-open' : ''}`}>
      {/* HEADER */}
      <div className="chat-header">
        <div className="header-left">
          <img src={logo} alt="Luvstor" className="chat-logo" />
          <div className="stranger-details">
            <h4>{partnerUsername}</h4>
            <span className={`status ${isPartnerTyping ? 'typing' : 'online'}`}>
              {isPartnerTyping ? 'typing...' : 'Online'}
            </span>
          </div>
        </div>

        <button className="next-btn" onClick={handleNext}>
          <LogOut size={16} style={{ marginRight: '6px' }} />
          Next
        </button>
      </div>

      {/* MESSAGES */}
      <div className="chat-body">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`bubble ${msg.isOwn ? 'own' : msg.system ? 'system' : 'other'}`}
          >
            <p>{msg.message}</p>
            {!msg.system && (
              <span>
                {msg.timestamp}
                {msg.isOwn && msg.seen && ' ✓✓'}
              </span>
            )}
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
          <Smile size={24} color="#ffd369" />
        </button>

        <input
          type="text"
          placeholder="Chat on luvstor..."
          value={inputValue}
          onChange={handleTyping}
          onFocus={() => setShowEmojiPicker(false)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />

        <button onClick={sendMessage} className="send-btn">
          <Send size={20} />
        </button>
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

      <style>{`
        .chat-container.full-screen {
            max-width: 100% !important;
            width: 100vw;
            height: 100vh;
            margin: 0 !important;
            border-radius: 0 !important;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
        }
        .bubble.system {
            align-self: center;
            background: rgba(0,0,0,0.3);
            font-size: 0.8rem;
            max-width: 100%;
        }
      `}</style>
    </div>
  );
};

export default Chat;
