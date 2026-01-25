import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { Smile, LogOut, Send } from 'lucide-react';
import logo from '../assets/logo.png';
import '../chat.css';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState('online');

  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastUpdateRef = useRef(null);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);

  const roomId = location.state?.roomId;
  const partnerUsername = location.state?.partnerUsername || 'Stranger';
  const myUsername = 'You';

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Clear any persisted messages from previous sessions
    const clearPreviousSession = () => {
      sessionStorage.removeItem('chat_messages');
      sessionStorage.removeItem('chat_room');
    };

    // Handle page refresh/close - clear messages and disconnect
    const handlePageUnload = async () => {
      try {
        await fetch(`${BACKEND_URL}/api/chat/leave`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) { }
      clearPreviousSession();
    };

    // Clear on mount to ensure fresh start
    clearPreviousSession();

    // Handle browser back/refresh
    window.addEventListener('beforeunload', handlePageUnload);

    return () => {
      window.removeEventListener('beforeunload', handlePageUnload);
    };
  }, [token, BACKEND_URL]);

  // Get user initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (!roomId) {
      navigate('/match');
      return;
    }

    lastUpdateRef.current = new Date(0).toISOString();

    const fetchUpdates = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/chat/updates?roomId=${roomId}&since=${lastUpdateRef.current}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const data = await response.json();

        if (data.status === 'partner_disconnected' || data.status === 'disconnected') {
          if (partnerStatus !== 'left') {
            setPartnerStatus('left');
            setMessages(prev => [...prev, { system: true, message: 'Partner disconnected.' }]);
          }
          return;
        }

        if (data.messages && data.messages.length > 0) {
          const valUser = localStorage.getItem('user');
          if (!valUser) return;

          const userObj = JSON.parse(valUser);
          const myUserId = userObj.id || userObj._id;

          const newPartnerMessages = data.messages.filter(msg => {
            const msgSender = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
            return msgSender.toString() !== myUserId.toString();
          });

          if (newPartnerMessages.length > 0) {
            const formattedMsgs = newPartnerMessages.map(msg => ({
              message: msg.content,
              sender: partnerUsername,
              timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isOwn: false,
              seen: true,
              _id: msg._id
            }));

            setMessages(prev => {
              const existingIds = new Set(prev.map(p => p._id));
              const uniqueNew = formattedMsgs.filter(m => !existingIds.has(m._id));
              return [...prev, ...uniqueNew];
            });
          }

          const lastMsg = data.messages[data.messages.length - 1];
          lastUpdateRef.current = lastMsg.createdAt;
        }

        setIsPartnerTyping(data.isPartnerTyping);

      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const intervalId = setInterval(fetchUpdates, 1000);

    // Cleanup: Clear messages and disconnect when component unmounts
    return () => {
      clearInterval(intervalId);

      // Clear messages and reset state on unmount
      setMessages([]);
      setPartnerStatus('online');
      setIsPartnerTyping(false);

      // Clear session storage
      sessionStorage.removeItem('chat_messages');
      sessionStorage.removeItem('chat_room');

      // Notify backend of disconnect
      fetch(`${BACKEND_URL}/api/chat/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => { });
    };
  }, [roomId, navigate, token, BACKEND_URL, partnerUsername, partnerStatus]);

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

  useEffect(() => {
    // Auto-scroll to latest message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages, isPartnerTyping]);

  const handleTyping = async (e) => {
    setInputValue(e.target.value);

    if (!typingTimeoutRef.current) {
      try {
        await fetch(`${BACKEND_URL}/api/chat/typing`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) { }

      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const messageContent = inputValue;
    const messageData = {
      sender: myUsername,
      message: messageContent,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      seen: false,
      isOwn: true,
      _id: 'temp-' + Date.now()
    };

    setMessages((prev) => [...prev, messageData]);
    setInputValue('');
    setShowEmojiPicker(false);

    try {
      await fetch(`${BACKEND_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId, message: messageContent })
      });

    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const onEmojiClick = (emojiData) => {
    setInputValue((prev) => prev + emojiData.emoji);
  };

  const handleNext = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/chat/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) { }

    // Clear all messages and state
    setMessages([]);
    setPartnerStatus('online');
    setIsPartnerTyping(false);
    setInputValue('');
    setShowEmojiPicker(false);

    // Clear session storage
    sessionStorage.removeItem('chat_messages');
    sessionStorage.removeItem('chat_room');

    navigate('/match');
  };

  return (
    <div className={`chat-container full-screen ${showEmojiPicker ? 'emoji-open' : ''}`}>
      {/* HEADER */}
      <div className="chat-header">
        <div className="header-left">
          <div className="partner-avatar">
            {getInitials(partnerUsername)}
          </div>
          <div className="stranger-details">
            <h4>{partnerUsername}</h4>
            <span className={`status ${isPartnerTyping ? 'typing' : partnerStatus === 'online' ? 'online' : 'offline'}`}>
              {isPartnerTyping ? 'typing...' : partnerStatus === 'online' ? 'Online' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="chat-logo-container">
          {logo ? (
            <img src={logo} alt="Luvstor" className="chat-logo" />
          ) : (
            <div className="chat-logo">LV</div>
          )}
        </div>

        <button className="next-btn" onClick={handleNext}>
          <LogOut size={16} />
          Next
        </button>
      </div>

      {/* MESSAGES */}
      <div className="chat-body" ref={chatBodyRef}>
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
      <div className={`chat-input ${showEmojiPicker ? 'emoji-open' : ''}`} style={{ pointerEvents: partnerStatus === 'left' ? 'none' : 'auto', opacity: partnerStatus === 'left' ? 0.5 : 1 }}>
        <button
          className="emoji-btn"
          onClick={toggleEmojiPicker}
          type="button"
        >
          <Smile size={24} color="#ffd369" />
        </button>

        <input
          type="text"
          placeholder={partnerStatus === 'left' ? "Partner disconnected" : "Chat on luvstor..."}
          value={inputValue}
          onChange={handleTyping}
          onFocus={(e) => {
            setShowEmojiPicker(false);
            // Prevent auto-scroll by temporarily disabling smooth scroll
            e.target.scrollIntoView({ behavior: 'auto', block: 'end' });
          }}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={partnerStatus === 'left'}
        />

        <button
          onClick={sendMessage}
          className="send-btn"
          disabled={partnerStatus === 'left'}
          type="button"
        >
          <Send size={20} />
        </button>
      </div>

      {showEmojiPicker && (
        <div className="emoji-popup" ref={emojiPickerRef}>
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme="light"
            width="100%"
            height="100%"
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