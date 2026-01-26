import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { Smile, LogOut, Send, X, AlertCircle, RefreshCw } from 'lucide-react';
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
  const chatContainerRef = useRef(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const failedMessageRef = useRef(null);
  const consecutiveFailuresRef = useRef(0);

  const roomId = location.state?.roomId;
  const partnerUsername = location.state?.partnerUsername || 'Stranger';
  const myUsername = 'You';

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
  const token = localStorage.getItem('token');

  // Helper function to show error notifications
  const showError = (title, message, type = 'error', retryAction = null) => {
    setError({ title, message, type, retryAction });
    // Auto-hide after 5 seconds for non-critical errors
    if (type !== 'error') {
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  // Helper function to check if error is network-related
  const isNetworkError = (error) => {
    return (
      error instanceof TypeError ||
      error.message?.includes('fetch') ||
      error.message?.includes('network') ||
      error.message?.includes('Failed to fetch')
    );
  };

  // Helper function to get user-friendly error message
  const getErrorMessage = (error, defaultMessage) => {
    if (isNetworkError(error)) {
      return 'Unable to connect to server. Please check your internet connection.';
    }
    if (error?.message) {
      return error.message;
    }
    return defaultMessage || 'An unexpected error occurred. Please try again.';
  };

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
      } catch (e) {
        // Silently fail on page unload - user is leaving anyway
        console.warn('Failed to notify server on page unload:', e);
      }
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

        if (!response.ok) {
          if (response.status === 401) {
            // Unauthorized - token expired
            showError('Session Expired', 'Please log in again to continue chatting.', 'error', () => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/');
            });
            return;
          }
          if (response.status >= 500) {
            // Server error
            consecutiveFailuresRef.current += 1;
            if (consecutiveFailuresRef.current === 1) {
              showError('Connection Issue', 'Server is temporarily unavailable. Retrying...', 'warning');
            }
            return;
          }
          return;
        }

        // Reset failure counter on success
        consecutiveFailuresRef.current = 0;
        if (error && error.title === 'Connection Issue') {
          setError(null);
        }

        const data = await response.json();

        if (data.status === 'partner_disconnected' || data.status === 'disconnected') {
          if (partnerStatus !== 'left') {
            setPartnerStatus('left');
            setMessages(prev => [
              ...prev, 
              { system: true, message: 'Partner disconnected.' },
              { system: true, message: 'Press Enter to find a new match...' }
            ]);
            // Auto-focus input to allow Enter key to start new match
            setTimeout(() => {
              inputRef.current?.focus();
            }, 300);
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
        consecutiveFailuresRef.current += 1;
        
        // Only show error after multiple consecutive failures to avoid spam
        if (consecutiveFailuresRef.current === 3) {
          showError(
            'Connection Lost',
            getErrorMessage(error, 'Unable to receive messages. Please check your connection.'),
            'error',
            () => {
              consecutiveFailuresRef.current = 0;
              fetchUpdates();
            }
          );
        } else if (consecutiveFailuresRef.current > 10) {
          // After many failures, suggest reconnecting
          showError(
            'Connection Failed',
            'Unable to connect to server. Please refresh the page or try again later.',
            'error'
          );
        }
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
      }).catch((e) => {
        // Silently fail on cleanup - component is unmounting
        console.warn('Failed to notify server on unmount:', e);
      });
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

  // Handle mobile keyboard visibility
  useEffect(() => {
    const handleKeyboardToggle = () => {
      // Use Visual Viewport API if available (modern browsers)
      if (window.visualViewport) {
        const viewport = window.visualViewport;
        const windowHeight = window.innerHeight;
        const viewportHeight = viewport.height;
        
        // Keyboard is likely open if viewport is significantly smaller than window
        const keyboardThreshold = 150; // pixels
        const isOpen = (windowHeight - viewportHeight) > keyboardThreshold;
        
        setIsKeyboardOpen(isOpen);
        
        if (chatContainerRef.current) {
          if (isOpen) {
            chatContainerRef.current.classList.add('keyboard-open');
          } else {
            chatContainerRef.current.classList.remove('keyboard-open');
          }
        }

        // Scroll input into view when keyboard opens
        if (isOpen && inputRef.current) {
          setTimeout(() => {
            inputRef.current?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }, 100);
        }
      } else {
        // Fallback for older browsers
        const handleResize = () => {
          const windowHeight = window.innerHeight;
          const screenHeight = window.screen.height;
          const isOpen = windowHeight < screenHeight * 0.75;
          
          setIsKeyboardOpen(isOpen);
          
          if (chatContainerRef.current) {
            if (isOpen) {
              chatContainerRef.current.classList.add('keyboard-open');
            } else {
              chatContainerRef.current.classList.remove('keyboard-open');
            }
          }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }
    };

    // Listen to visual viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleKeyboardToggle);
      window.visualViewport.addEventListener('scroll', handleKeyboardToggle);
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleKeyboardToggle);
        window.visualViewport?.removeEventListener('scroll', handleKeyboardToggle);
      };
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleKeyboardToggle);
      return () => window.removeEventListener('resize', handleKeyboardToggle);
    }
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
      } catch (e) {
        // Silently fail typing indicator - not critical for user experience
        console.warn('Failed to send typing indicator:', e);
      }

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

    // Store message for potential retry
    failedMessageRef.current = { roomId, message: messageContent, messageData };

    setMessages((prev) => [...prev, messageData]);
    setInputValue('');
    setShowEmojiPicker(false);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId, message: messageContent })
      });

      if (!response.ok) {
        if (response.status === 401) {
          showError('Session Expired', 'Please log in again to send messages.', 'error', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/');
          });
          // Remove failed message from UI
          setMessages((prev) => prev.filter(msg => msg._id !== messageData._id));
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      // Success - clear failed message reference
      failedMessageRef.current = null;

    } catch (error) {
      console.error('Send message error:', error);
      
      // Show error and allow retry
      showError(
        'Failed to Send',
        getErrorMessage(error, 'Your message could not be sent. Please try again.'),
        'error',
        async () => {
          if (failedMessageRef.current) {
            setIsRetrying(true);
            try {
              const response = await fetch(`${BACKEND_URL}/api/chat/messages`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  roomId: failedMessageRef.current.roomId,
                  message: failedMessageRef.current.message
                })
              });

              if (!response.ok) {
                throw new Error('Retry failed');
              }

              // Success - remove error and failed message reference
              setError(null);
              failedMessageRef.current = null;
            } catch (retryError) {
              showError(
                'Retry Failed',
                getErrorMessage(retryError, 'Unable to send message. Please check your connection.'),
                'error'
              );
            } finally {
              setIsRetrying(false);
            }
          }
        }
      );
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
    } catch (e) {
      // Log but don't block navigation - user wants to leave anyway
      console.warn('Failed to notify server on leave:', e);
    }

    // Clear all messages and state
    setMessages([]);
    setPartnerStatus('online');
    setIsPartnerTyping(false);
    setInputValue('');
    setShowEmojiPicker(false);
    setError(null);
    consecutiveFailuresRef.current = 0;
    failedMessageRef.current = null;

    // Clear session storage
    sessionStorage.removeItem('chat_messages');
    sessionStorage.removeItem('chat_room');

    navigate('/match');
  };

  return (
    <div 
      ref={chatContainerRef}
      className={`chat-container full-screen ${showEmojiPicker ? 'emoji-open' : ''} ${isKeyboardOpen ? 'keyboard-open' : ''}`}
    >
      {/* HEADER */}
      <div className="chat-header">
        <div className="header-left">
          <div className="stranger-details">
            <h4>{partnerUsername}</h4>
            <span className={`status-top ${isPartnerTyping ? 'typing' : partnerStatus === 'online' ? 'online' : 'offline'}`}>
              {isPartnerTyping ? 'typing...' : partnerStatus === 'online' ? 'Online' : 'Offline'}
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

        <div className="header-right">
          <button className="next-btn" onClick={handleNext}>
            <LogOut size={16} />
            Next
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className={`chat-body ${isKeyboardOpen ? 'keyboard-open' : ''}`} ref={chatBodyRef}>
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
      <div className={`chat-input ${showEmojiPicker ? 'emoji-open' : ''}`} style={{ opacity: partnerStatus === 'left' ? 0.8 : 1 }}>
        <button
          className="emoji-btn"
          onClick={toggleEmojiPicker}
          type="button"
          disabled={partnerStatus === 'left'}
        >
          <Smile size={24} color="#ffd369" />
        </button>

        <input
          type="text"
          placeholder={partnerStatus === 'left' ? "Press Enter to find a new match..." : "Chat on luvstor..."}
          value={inputValue}
          onChange={handleTyping}
          ref={inputRef}
          onFocus={(e) => {
            setShowEmojiPicker(false);
            // Scroll input into view when focused (keyboard will open)
            setTimeout(() => {
              e.target.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
              });
            }, 300);
          }}
          onBlur={() => {
            // Small delay to check if keyboard actually closed
            setTimeout(() => {
              if (window.visualViewport) {
                const viewport = window.visualViewport;
                const windowHeight = window.innerHeight;
                const viewportHeight = viewport.height;
                const keyboardThreshold = 150;
                const isOpen = (windowHeight - viewportHeight) > keyboardThreshold;
                
                if (!isOpen && chatContainerRef.current) {
                  chatContainerRef.current.classList.remove('keyboard-open');
                  setIsKeyboardOpen(false);
                }
              }
            }, 100);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (partnerStatus === 'left') {
                // When partner disconnected, Enter triggers new match
                e.preventDefault();
                handleNext();
              } else {
                // Normal behavior: send message
                sendMessage();
              }
            }
          }}
        />

        <button
          onClick={partnerStatus === 'left' ? handleNext : sendMessage}
          className="send-btn"
          type="button"
          title={partnerStatus === 'left' ? 'Find new match' : 'Send message'}
        >
          {partnerStatus === 'left' ? (
            <LogOut size={20} />
          ) : (
            <Send size={20} />
          )}
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

      {/* Error Notification */}
      {error && (
        <div className={`error-notification ${error.type}`}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div className="error-notification-content">
            <div className="error-notification-title">{error.title}</div>
            <div className="error-notification-message">{error.message}</div>
            {error.retryAction && (
              <button
                className="error-notification-retry"
                onClick={() => {
                  if (!isRetrying) {
                    error.retryAction();
                  }
                }}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw size={12} style={{ marginRight: 4, animation: 'spin 1s linear infinite' }} />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw size={12} style={{ marginRight: 4 }} />
                    Retry
                  </>
                )}
              </button>
            )}
          </div>
          <button
            className="error-notification-close"
            onClick={() => setError(null)}
            aria-label="Close error"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Chat;