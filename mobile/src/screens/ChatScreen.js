import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import { chatService } from '../services/chat';
import { storage } from '../services/storage';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

const ChatScreen = ({ route, navigation }) => {
    const { roomId, partnerUsername } = route.params;
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [partnerStatus, setPartnerStatus] = useState('online');
    const [isSkipping, setIsSkipping] = useState(false);

    const flatListRef = useRef(null);
    const lastUpdateRef = useRef(new Date(0).toISOString());
    const pollingIntervalRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isManualLeave = useRef(false);

    useEffect(() => {
        startPolling();

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            if (!isManualLeave.current) {
                chatService.leaveChat();
            }
        };
    }, []);

    const startPolling = () => {
        const poll = async () => {
            if (isSkipping || isManualLeave.current) return;

            const result = await chatService.pollUpdates(roomId, lastUpdateRef.current);

            if (!result.success) return;

            const { data } = result;

            // Check if partner disconnected
            if (data.status === 'partner_disconnected' || data.status === 'disconnected') {
                if (partnerStatus !== 'left') {
                    setPartnerStatus('left');
                    setMessages((prev) => [
                        ...prev,
                        { system: true, message: 'Partner left', _id: Date.now() },
                    ]);
                }
                return;
            }

            // Process new messages
            if (data.messages && data.messages.length > 0) {
                const user = await storage.getUser();
                const myUserId = user?.id || user?._id;

                const newPartnerMessages = data.messages.filter((msg) => {
                    const msgSender =
                        typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                    return msgSender.toString() !== myUserId?.toString();
                });

                if (newPartnerMessages.length > 0) {
                    const formattedMsgs = newPartnerMessages.map((msg) => ({
                        message: msg.content,
                        sender: partnerUsername,
                        timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        isOwn: false,
                        seen: true,
                        _id: msg._id,
                    }));

                    setMessages((prev) => {
                        const existingIds = new Set(prev.map((p) => p._id));
                        const uniqueNew = formattedMsgs.filter(
                            (m) => !existingIds.has(m._id)
                        );
                        return [...prev, ...uniqueNew];
                    });
                }

                const lastMsg = data.messages[data.messages.length - 1];
                lastUpdateRef.current = lastMsg.createdAt;
            }

            setIsPartnerTyping(data.isPartnerTyping || false);
        };

        pollingIntervalRef.current = setInterval(poll, 1000);
        poll(); // Initial poll
    };

    const handleTyping = async (text) => {
        setInputValue(text);

        if (!typingTimeoutRef.current) {
            await chatService.setTyping();
            typingTimeoutRef.current = setTimeout(() => {
                typingTimeoutRef.current = null;
            }, 2000);
        }
    };

    const sendMessage = async () => {
        if (!inputValue.trim() || partnerStatus === 'left') return;

        const messageContent = inputValue;
        const messageData = {
            sender: 'You',
            message: messageContent,
            timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            }),
            seen: false,
            isOwn: true,
            _id: 'temp-' + Date.now(),
        };

        setMessages((prev) => [...prev, messageData]);
        setInputValue('');

        const result = await chatService.sendMessage(roomId, messageContent);

        if (!result.success) {
            Alert.alert('Error', 'Failed to send message. Please try again.');
        }
    };

    const handleNext = async () => {
        if (isSkipping) return;

        isManualLeave.current = true;
        setIsSkipping(true);

        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        await chatService.leaveChat();

        setTimeout(() => {
            navigation.replace('Match');
        }, 1500);
    };

    const renderMessage = ({ item }) => (
        <MessageBubble
            message={item.message}
            isOwn={item.isOwn}
            timestamp={item.timestamp}
            seen={item.seen}
            system={item.system}
        />
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Skip Overlay */}
            {isSkipping && (
                <View style={styles.skipOverlay}>
                    <View style={styles.skipModal}>
                        <Text style={styles.skipTitle}>Partner Left</Text>
                        <Text style={styles.skipText}>
                            The other user has left the chat.{'\n'}
                            You'll be matched with someone new.
                        </Text>
                        <Text style={styles.skipMatching}>Matching...</Text>
                    </View>
                </View>
            )}

            {/* Header */}
            <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.header}
            >
                <View style={styles.headerLeft}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {partnerUsername.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.partnerName}>{partnerUsername}</Text>
                        <View style={styles.statusContainer}>
                            <View
                                style={[
                                    styles.statusDot,
                                    {
                                        backgroundColor: isPartnerTyping
                                            ? colors.typing
                                            : partnerStatus === 'online'
                                                ? colors.online
                                                : colors.offline,
                                    },
                                ]}
                            />
                            <Text style={styles.statusText}>
                                {isPartnerTyping ? 'typing...' : partnerStatus === 'online' ? 'online' : 'offline'}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
                    <MaterialCommunityIcons
                        name="skip-forward"
                        size={24}
                        color={colors.textPrimary}
                    />
                </TouchableOpacity>
            </LinearGradient>

            {/* Messages */}
            <View style={styles.messagesContainer}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item._id.toString()}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() =>
                        flatListRef.current?.scrollToEnd({ animated: true })
                    }
                    ListFooterComponent={
                        isPartnerTyping ? <TypingIndicator /> : null
                    }
                />
            </View>

            {/* Input */}
            <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.inputContainer}
            >
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder={
                            partnerStatus === 'left'
                                ? 'Press send to find new match...'
                                : 'Chat on Luvstor...'
                        }
                        placeholderTextColor={colors.textTertiary}
                        value={inputValue}
                        onChangeText={handleTyping}
                        multiline={true}
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={partnerStatus === 'left' ? handleNext : sendMessage}
                    >
                        <LinearGradient
                            colors={colors.buttonGradient}
                            style={styles.sendButtonGradient}
                        >
                            <Ionicons
                                name={partnerStatus === 'left' ? 'chevron-forward' : 'send'}
                                size={20}
                                color="#000"
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    skipOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    skipModal: {
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        maxWidth: 300,
    },
    skipTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    skipText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    skipMatching: {
        color: colors.accentYellow,
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        paddingTop: spacing.xxl,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.accentYellow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    partnerName: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    skipButton: {
        padding: spacing.sm,
    },
    messagesContainer: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    messagesList: {
        paddingVertical: spacing.md,
    },
    inputContainer: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
    },
    input: {
        flex: 1,
        backgroundColor: colors.glassBg,
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.textPrimary,
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    sendButtonGradient: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ChatScreen;
