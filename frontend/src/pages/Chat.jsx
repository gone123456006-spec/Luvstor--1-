import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { Smile, SkipForward, Send, X, AlertCircle, RefreshCw, ChevronRight, Image as ImageIcon, Mic, Square } from 'lucide-react';
import { io } from 'socket.io-client';
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
  const [contextMenuMsgId, setContextMenuMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastUpdateRef = useRef(new Date(0).toISOString());
  const pollingIntervalRef = useRef(null);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);
  const chatContainerRef = useRef(null);
  const socketRef = useRef(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const failedMessageRef = useRef(null);
  const consecutiveFailuresRef = useRef(0);
  const isSendingRef = useRef(false);
  const isManualLeave = useRef(false);

  // Camera Refs and State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const roomId = location.state?.roomId || 'test-room';
  const partnerUsername = location.state?.partnerUsername || 'Tester';
  const myUsername = 'You';

  // Robust Backend URL handling for deployment
  const getBackendUrl = () => {
    if (import.meta.env.VITE_BACKEND_URL) {
      return import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');
    }
    // If no VITE_BACKEND_URL and currently on localhost, default to localhost:5000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // In production without explicit vars, assume relative path /api (or same origin)
    // Adjust this based on your specific deployment (e.g., render/vercel often need explicit vars)
    console.warn('VITE_BACKEND_URL not set. Defaulting to relative path /api');
    return '/api';
  };

  const BACKEND_URL = getBackendUrl();
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
    // Tracking for remounts (Strict Mode / Fast Refresh)
    window.__chat_mount_id = (window.__chat_mount_id || 0) + 1;
    const currentMountId = window.__chat_mount_id;

    // Handle session end
    const handleSessionEnd = () => {
      if (isManualLeave.current) return;

      const tokenAtCleanup = localStorage.getItem('token');
      if (tokenAtCleanup) {
        fetch(`${BACKEND_URL}/api/chat/leave`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${tokenAtCleanup}` }
        }).catch(() => { });

        sessionStorage.removeItem('chat_messages');
        sessionStorage.removeItem('chat_room');
      }
    };

    window.addEventListener('beforeunload', handleSessionEnd);
    window.addEventListener('popstate', handleSessionEnd);

    return () => {
      window.removeEventListener('beforeunload', handleSessionEnd);
      window.removeEventListener('popstate', handleSessionEnd);

      // Root-cause fix: Only terminate if we didn't remount within 150ms
      setTimeout(() => {
        if (window.__chat_mount_id === currentMountId && !isManualLeave.current) {
          handleSessionEnd();

          setMessages([]);
          setPartnerStatus('online');
          setIsPartnerTyping(false);
        }
      }, 150);
    };
  }, [BACKEND_URL]); // Mount-once logic for session lifecycle

  useEffect(() => {
    // Basic setup on mount
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }

    const handleClickOutside = () => setContextMenuMsgId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Socket initialization
  useEffect(() => {
    if (!roomId) return;

    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    socketRef.current.emit('join_room', roomId);

    socketRef.current.on('typing', () => {
      setIsPartnerTyping(true);
    });

    socketRef.current.on('stop_typing', () => {
      setIsPartnerTyping(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, BACKEND_URL]);

  useEffect(() => {
    const fetchUpdates = async () => {
      // Don't poll if we're already transitioning or if we have no room
      if (isSkipping || isManualLeave.current || !roomId) return;

      const currentToken = localStorage.getItem('token');
      if (!currentToken) return;

      try {
        const response = await fetch(`${BACKEND_URL}/api/chat/updates?roomId=${roomId}&since=${lastUpdateRef.current}`, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
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
              { system: true, message: 'Partner left' }
            ]);

            // Show notification that partner left
            showError(
              'Partner Left',
              'Finding new match',
              'info'
            );

            // Automatically navigate to match page after 2 seconds
            setTimeout(() => {
              if (isSkipping || isManualLeave.current) return;

              isManualLeave.current = true;

              // Clear all state
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

              // Notify backend we're leaving
              fetch(`${BACKEND_URL}/api/chat/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              }).catch(() => { });

              // Navigate to match page
              navigate('/match', { replace: true });
            }, 2000);
          }
          return;
        }

        if (data.messages && data.messages.length > 0) {
          console.log('[Frontend Poll] Received', data.messages.length, 'messages');

          const valUser = localStorage.getItem('user');
          if (!valUser) return;
          const userObj = JSON.parse(valUser);
          const myUserId = userObj.id || userObj._id;
          console.log('[Frontend Poll] My user ID:', myUserId);

          const newPartnerMessages = data.messages.filter(msg => {
            const msgSender = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
            const isFromPartner = msgSender.toString() !== myUserId.toString();
            console.log('[Frontend Poll] Message sender:', msgSender, 'isFromPartner:', isFromPartner);
            return isFromPartner;
          });

          console.log('[Frontend Poll] Partner messages:', newPartnerMessages.length);

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
              console.log('[Frontend Poll] Adding', uniqueNew.length, 'new messages to UI');
              return [...prev, ...uniqueNew];
            });
          }

          const lastMsg = data.messages[data.messages.length - 1];
          lastUpdateRef.current = lastMsg.updatedAt || lastMsg.createdAt;
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
            'No server connection',
            'error'
          );
        }
      }
    };

    const intervalId = setInterval(fetchUpdates, 1000);
    pollingIntervalRef.current = intervalId;

    // Run once immediately
    fetchUpdates();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      // NO /leave CALL HERE - Lifecycle hook handles it
    };
  }, [roomId, navigate, BACKEND_URL, token, isSkipping, partnerStatus, error, myUsername, partnerUsername]); // Fixed: Added missing dependencies

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
      }
    };

    // Listen to visual viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleKeyboardToggle);
      window.visualViewport.addEventListener('scroll', handleKeyboardToggle);

      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleKeyboardToggle);
          window.visualViewport.removeEventListener('scroll', handleKeyboardToggle);
        }
      };
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
  }, []);

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  useEffect(() => {
    // Auto-scroll to latest message
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages, isPartnerTyping]);

  const handleTyping = (e) => {
    setInputValue(e.target.value);

    // Emit typing event
    if (socketRef.current) {
      socketRef.current.emit('typing', roomId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 2.5 second delay before emitting stop_typing ("fake typing effect")
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('stop_typing', roomId);
      }
      typingTimeoutRef.current = null;
    }, 2500);
  };

  const sendMessage = async (overrideContent = null, overrideType = 'text', overrideFileUrl = null) => {
    if (isSendingRef.current && !overrideContent && !overrideFileUrl) return;

    // Check if called as event handler (first arg would be an event object)
    const contentParam = (typeof overrideContent === 'string') ? overrideContent : null;
    const contentToSend = (contentParam !== null ? contentParam : inputValue).trim();
    if (!contentToSend && !overrideFileUrl) return;

    if (overrideType === 'text') {
      setInputValue('');
      if (socketRef.current) {
        socketRef.current.emit('stop_typing', roomId);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
    isSendingRef.current = true;

    const messageData = {
      sender: myUsername,
      message: overrideType === 'text' ? contentToSend : '',
      messageType: overrideType,
      fileUrl: overrideFileUrl,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      seen: false,
      isOwn: true,
      _id: 'temp-' + Date.now()
    };

    // Store message for potential retry
    failedMessageRef.current = { roomId, message: contentToSend, messageType: overrideType, fileUrl: overrideFileUrl, messageData };

    setMessages((prev) => [...prev, messageData]);
    setShowEmojiPicker(false);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId,
          message: contentToSend,
          messageType: overrideType,
          fileUrl: overrideFileUrl
        })
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
                  message: failedMessageRef.current.message,
                  messageType: failedMessageRef.current.messageType,
                  fileUrl: failedMessageRef.current.fileUrl
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
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      sendMessage('', type, data.fileUrl);
    } catch (error) {
      console.error('Upload error:', error);
      showError('Upload Failed', 'Could not upload media. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file, 'image');
  };

  // --- CAMERA LOGIC ---
  const openCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      showError("Camera Error", "Could not access your camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || isUploading) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and send
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFileUpload(file, 'image');
        closeCamera();
      }
    }, 'image/jpeg', 0.8);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
        handleFileUpload(file, 'audio');
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording error:', err);
      showError('Microphone Error', 'Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onEmojiClick = (emojiData) => {
    setInputValue((prev) => prev + emojiData.emoji);
  };

  const handleDeleteMessage = async (messageId) => {
    if (messageId.startsWith('temp-')) return; // Can't delete unsynced messages yet

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Delete failed');

      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, isDeleted: true, message: 'Message unsent', fileUrl: null } : msg
      ));
      setContextMenuMsgId(null);
    } catch (error) {
      console.error('Delete error:', error);
      showError('Delete Failed', 'Could not unsend message.');
    }
  };

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

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
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
              {isPartnerTyping ? 'typing' : 'online'}
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
            key={msg._id || idx}
            className={`bubble ${msg.isOwn ? 'own' : msg.system ? 'system' : 'other'} ${msg.messageType !== 'text' ? 'media-bubble' : ''} ${msg.isDeleted ? 'deleted' : ''}`}
            onClick={(e) => {
              if (msg.isOwn && !msg.isDeleted && !msg.system) {
                e.stopPropagation();
                setContextMenuMsgId(contextMenuMsgId === msg._id ? null : msg._id);
              }
            }}
          >
            {msg.system ? (
              <p>{msg.message}</p>
            ) : (
              <div className="bubble-content">
                {msg.isOwn && contextMenuMsgId === msg._id && (
                  <button
                    className="unsend-btn"
                    onClick={() => handleDeleteMessage(msg._id)}
                  >
                    Unsend
                  </button>
                )}
                {msg.messageType === 'image' && !msg.isDeleted && (
                  <div className="media-container image-msg">
                    <img
                      src={msg.fileUrl.startsWith('http') ? msg.fileUrl : `${BACKEND_URL}${msg.fileUrl}`}
                      alt="Shared photo"
                      loading="lazy"
                      onClick={() => window.open(msg.fileUrl.startsWith('http') ? msg.fileUrl : `${BACKEND_URL}${msg.fileUrl}`, '_blank')}
                    />
                  </div>
                )}
                {msg.messageType === 'audio' && !msg.isDeleted && (
                  <div className="media-container audio-msg">
                    <div className="audio-player-wrapper">
                      <audio controls src={msg.fileUrl.startsWith('http') ? msg.fileUrl : `${BACKEND_URL}${msg.fileUrl}`} />
                    </div>
                  </div>
                )}
                {(msg.messageType === 'text' || msg.isDeleted) && (
                  <p className={msg.isDeleted ? 'deleted-text' : ''}>{msg.message}</p>
                )}
                {!msg.system && (
                  <span className="message-time">
                    {msg.timestamp}
                    {msg.isOwn && msg.seen && !msg.isDeleted && ' ✓✓'}
                  </span>
                )}
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
        className={`chat-input-container ${showEmojiPicker ? 'emoji-open' : ''} ${isRecording ? 'is-recording' : ''}`}
        style={{
          opacity: (partnerStatus === 'left' || isSkipping) ? 0.6 : 1,
          pointerEvents: isSkipping ? 'none' : 'auto'
        }}
      >
        <div className="instagram-input-pill">
          <button
            className="camera-btn-circle"
            onClick={openCamera}
            type="button"
            disabled={partnerStatus === 'left' || isUploading || isRecording}
            title="Take Photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ffffff" className="bi bi-camera" viewBox="0 0 16 16">
              <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z" />
              <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0" />
            </svg>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={onFileChange}
          />

          <div className="input-field-wrapper">
            {isRecording ? (
              <div className="recording-wave-container">
                <span className="recording-dot"></span>
                <span className="recording-timer">{formatTime(recordingTime)}</span>
                <span className="recording-text">Recording...</span>
              </div>
            ) : (
              <input
                type="text"
                placeholder={partnerStatus === 'left' ? "Press Enter to find match..." : "Message..."}
                value={inputValue}
                onChange={handleTyping}
                ref={inputRef}
                disabled={isUploading}
                onFocus={(e) => {
                  setShowEmojiPicker(false);
                  setTimeout(() => {
                    e.target.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                      inline: 'nearest'
                    });
                  }, 300);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (partnerStatus === 'left') {
                      e.preventDefault();
                      handleNext();
                    } else {
                      sendMessage();
                    }
                  }
                }}
              />
            )}
            {isUploading && <div className="upload-loader"></div>}
          </div>

          <div className="pill-actions-right">
            {(!inputValue.trim() && partnerStatus !== 'left') && (
              <>
                <button
                  className={`action-icon-btn mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                  type="button"
                  disabled={isUploading}
                  title={isRecording ? 'Stop Recording' : 'Record Audio'}
                >
                  {isRecording ? <Square size={22} fill="#ff4444" color="#ff4444" /> : <Mic size={22} />}
                </button>

                <button
                  className="action-icon-btn gallery-btn"
                  onClick={handlePhotoClick}
                  type="button"
                  disabled={partnerStatus === 'left' || isUploading || isRecording}
                  title="Send Image"
                >
                  <ImageIcon size={22} />
                </button>
              </>
            )}

            <button
              className="action-icon-btn emoji-btn"
              onClick={toggleEmojiPicker}
              type="button"
              disabled={partnerStatus === 'left' || isRecording}
              title="Emoji"
            >
              <Smile size={22} />
            </button>
          </div>
        </div>

        {(inputValue.trim() || partnerStatus === 'left') && (
          <button
            onClick={() => partnerStatus === 'left' ? handleNext() : sendMessage()}
            className="instagram-send-btn"
            type="button"
            disabled={isUploading}
            title={partnerStatus === 'left' ? 'Find new match' : 'Send'}
          >
            {partnerStatus === 'left' ? <ChevronRight /> : "Send"}
          </button>
        )}
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

      {/* Camera Overlay */}
      {isCameraOpen && (
        <div className="camera-overlay">
          <div className="camera-header">
            <button className="camera-close-btn" onClick={closeCamera}>
              <X size={28} />
            </button>
          </div>
          <div className="camera-preview-container">
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          <div className="camera-footer">
            <div className="capture-outer-ring" onClick={capturePhoto}>
              <div className="capture-inner-dot"></div>
            </div>
          </div>
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