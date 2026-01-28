import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { Smile, SkipForward, Send, X, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [showReactionPicker, setShowReactionPicker] = useState(null); // Track which message to show reactions for

  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastUpdateRef = useRef(null);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);
  const chatContainerRef = useRef(null);
  const reactionPickerRef = useRef(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const failedMessageRef = useRef(null);
  const consecutiveFailuresRef = useRef(0);
  const pollingIntervalRef = useRef(null);

  const roomId = location.state?.roomId || 'test-room';
  const partnerUsername = location.state?.partnerUsername || 'Tester';
  const myUsername = 'You';

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
  const token = localStorage.getItem('token');

  // Quick reaction emojis
  const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

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

    return () => {
      window.removeEventListener('beforeunload', handlePageUnload);
    };
  }, [token, BACKEND_URL]);

  useEffect(() => {
    // Basic setup on mount
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, []);

  const isManualLeave = useRef(false);

  useEffect(() => {
    if (isSkipping) return;

    const fetchUpdates = async () => {
      // Don't poll if we're already transitioning
      if (isSkipping || isManualLeave.current) return;

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
          if (!isSkipping && !isManualLeave.current) {
            // Unify with handleNext flow
            isManualLeave.current = true;
            setIsSkipping(true);

            // Stop polling immediately
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            setPartnerStatus('left');
            // Show notification that partner left
            showError(
              'Partner Left',
              'Finding new match',
              'info'
            );

            // Clear session storage immediately
            sessionStorage.removeItem('chat_messages');
            sessionStorage.removeItem('chat_room');

            // Notify backend we're leaving
            fetch(`${BACKEND_URL}/api/chat/leave`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => { });

            // Automatically navigate to match page after 1.5 seconds (consistent with handleNext)
            setTimeout(() => {
              navigate('/match', { replace: true, state: { reason: 'partner_left' } });
            }, 1500);
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
              seen: msg.seen || false,
              reaction: msg.reaction || null,
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

        // Update read receipts for own messages
        if (data.readReceipts) {
          setMessages(prev => prev.map(msg => {
            if (msg.isOwn && data.readReceipts.includes(msg._id)) {
              return { ...msg, seen: true };
            }
            return msg;
          }));
        }

        // Update reactions
        if (data.reactions) {
          setMessages(prev => prev.map(msg => {
            const reaction = data.reactions.find(r => r.messageId === msg._id);
            if (reaction) {
              return { ...msg, reaction: reaction.emoji };
            }
            return msg;
          }));
        }

        setIsPartnerTyping(data.isPartnerTyping);

      } catch (error) {
        console.error('Polling error:', error);
        consecutiveFailuresRef.current += 1;

        if (consecutiveFailuresRef.current === 3) {
          showError(
            'Connection Lost',
            'Unable to receive messages. Please check your connection.',
            'error',
            () => {
              consecutiveFailuresRef.current = 0;
              fetchUpdates();
            }
          );
        } else if (consecutiveFailuresRef.current > 10) {
          showError(
            'Connection Failed',
            'No server connection',
            'error'
          );
        }
      }
    };

    const intervalId = setInterval(fetchUpdates, 1000);
    pollingIntervalRef.current = intervalId;

    fetchUpdates();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      if (!isManualLeave.current) {
        fetch(`${BACKEND_URL}/api/chat/leave`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => { });

        setMessages([]);
        setPartnerStatus('online');
        setIsPartnerTyping(false);
        sessionStorage.removeItem('chat_messages');
        sessionStorage.removeItem('chat_room');
      }
    };
  }, [roomId, navigate, BACKEND_URL]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) && !event.target.closest('.emoji-btn')) {
        setShowEmojiPicker(false);
      }
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target) && !event.target.closest('.bubble')) {
        setShowReactionPicker(null);
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
      } else {
        // Fallback for older browsers
        const handleResize = () => {
          const windowHeight = window.innerHeight;
          const screenHeight = window.screen.height;
          const isOpen = windowHeight < screenHeight * 0.75;

          setIsKeyboardOpen(isOpen);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
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
      reaction: null,
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

      const result = await response.json();

      // Update message with real ID from server
      setMessages((prev) => prev.map(msg =>
        msg._id === messageData._id ? { ...msg, _id: result.message._id } : msg
      ));

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

  // Handle long press to show reaction picker
  const handleLongPress = (messageId) => {
    setShowReactionPicker(messageId);
  };

  // Handle reaction click
  const handleReaction = async (messageId, emoji) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId, messageId, emoji })
      });

      if (response.ok) {
        // Update local state
        setMessages(prev => prev.map(msg =>
          msg._id === messageId ? { ...msg, reaction: emoji } : msg
        ));
        setShowReactionPicker(null);
      }
    } catch (error) {
      console.error('Failed to send reaction:', error);
    }
  };

  // Mark messages as read when they come into view
  useEffect(() => {
    const markAsRead = async () => {
      const unreadMessages = messages.filter(msg => !msg.isOwn && !msg.seen);
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg._id);

        try {
          await fetch(`${BACKEND_URL}/api/chat/read`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ roomId, messageIds })
          });

          // Update local state
          setMessages(prev => prev.map(msg =>
            messageIds.includes(msg._id) ? { ...msg, seen: true } : msg
          ));
        } catch (error) {
          console.warn('Failed to mark messages as read:', error);
        }
      }
    };

    // Mark as read after a short delay
    const timer = setTimeout(markAsRead, 500);
    return () => clearTimeout(timer);
  }, [messages, roomId, token, BACKEND_URL]);

  const handleNext = async () => {
    if (isSkipping) return;

    isManualLeave.current = true; // Block the unmount cleanup leave call
    setIsSkipping(true);
    setPartnerStatus('left');
    setIsPartnerTyping(false);

    // Kill the updates interval immediately to stop all polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Notify backend and clear locale immediately
    try {
      fetch(`${BACKEND_URL}/api/chat/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => { });
    } catch (e) { }

    sessionStorage.removeItem('chat_messages');
    sessionStorage.removeItem('chat_room');

    // Smooth delay for modal visibility
    setTimeout(() => {
      navigate('/match', { replace: true });
    }, 1500);
  };

  return (
    <div
      ref={chatContainerRef}
      className={`chat-container ${showEmojiPicker ? 'emoji-open' : ''} ${isKeyboardOpen ? 'keyboard-open' : ''} ${isSkipping ? 'skipping' : ''}`}
    >
      {isSkipping && (
        <div className="skip-overlay">
          <div className="skip-modal">
            <div className="skip-modal-content">
              <h3>Partner Left</h3>
              <p>The other user has left the chat. <br />You'll be matched with someone new.</p>
              <div className="skip-loader">
                <div className="skip-loader-circle"></div>
                <span>Matching...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="chat-header">
        <div className="header-left">
          <div className="partner-avatar">
            {partnerUsername.charAt(0).toUpperCase()}
          </div>
          <div className="stranger-details">
            <h4>{partnerUsername}</h4>
            <span className={`status-top ${isPartnerTyping ? 'typing' : partnerStatus === 'online' ? 'online' : 'offline'}`}>
              <span className="logo-dot"></span>
              {isPartnerTyping ? 'typing...' : 'online'}
            </span>
          </div>
        </div>

        <div className="header-right">
          <button className="skip-btn" onClick={handleNext} title="Skip">
            <SkipForward size={24} />
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className={`chat-body ${isKeyboardOpen ? 'keyboard-open' : ''}`} ref={chatBodyRef}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`bubble-container ${msg.isOwn ? 'own' : msg.system ? 'system' : 'other'}`}
          >
            <div
              className={`bubble ${msg.isOwn ? 'own' : msg.system ? 'system' : 'other'}`}
              onContextMenu={(e) => {
                if (!msg.system) {
                  e.preventDefault();
                  handleLongPress(msg._id);
                }
              }}
              onTouchStart={(e) => {
                if (!msg.system) {
                  const touchTimer = setTimeout(() => {
                    handleLongPress(msg._id);
                  }, 500);
                  e.currentTarget.touchTimer = touchTimer;
                }
              }}
              onTouchEnd={(e) => {
                if (e.currentTarget.touchTimer) {
                  clearTimeout(e.currentTarget.touchTimer);
                }
              }}
            >
              <p>{msg.message}</p>
              {!msg.system && (
                <span className="message-meta">
                  {msg.timestamp}
                  {msg.isOwn && (
                    <span className="read-receipt">
                      {msg.seen ? ' ✓✓' : ' ✓'}
                    </span>
                  )}
                </span>
              )}

              {/* Reaction Display */}
              {msg.reaction && (
                <div className="message-reaction">
                  {msg.reaction}
                </div>
              )}
            </div>

            {/* Reaction Picker */}
            {showReactionPicker === msg._id && (
              <div
                className={`reaction-picker ${msg.isOwn ? 'own' : 'other'}`}
                ref={reactionPickerRef}
                onClick={(e) => e.stopPropagation()}
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    className="reaction-emoji"
                    onClick={() => handleReaction(msg._id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
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
      <div
        className={`chat-input ${showEmojiPicker ? 'emoji-open' : ''}`}
        style={{
          opacity: (partnerStatus === 'left' || isSkipping) ? 0.6 : 1,
          pointerEvents: isSkipping ? 'none' : 'auto'
        }}
      >
        <button
          className="emoji-btn"
          onClick={toggleEmojiPicker}
          type="button"
          disabled={partnerStatus === 'left'}
        >
          <Smile color="#666" />
        </button>

        <input
          type="text"
          placeholder={partnerStatus === 'left' ? "Press Enter to find match..." : "Type a message..."}
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
            <SkipForward size={18} />
          ) : (
            <Send />
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