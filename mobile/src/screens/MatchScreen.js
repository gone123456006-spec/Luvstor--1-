import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Animated,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedBackground from '../components/AnimatedBackground';
import GradientButton from '../components/GradientButton';
import { chatService } from '../services/chat';
import { storage } from '../services/storage';
import { colors, spacing, typography, borderRadius } from '../styles/theme';

const MatchScreen = ({ navigation }) => {
    const [status, setStatus] = useState('Connecting...');
    const progressAnim = useRef(new Animated.Value(0)).current;
    const pollingInterval = useRef(null);

    useEffect(() => {
        joinQueueAndPoll();

        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
        };
    }, []);

    useEffect(() => {
        // Animate progress bar
        Animated.loop(
            Animated.sequence([
                Animated.timing(progressAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: false,
                }),
                Animated.timing(progressAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    const joinQueueAndPoll = async () => {
        setStatus('Joining queue...');
        const result = await chatService.joinQueue('both');

        if (!result.success) {
            // Provide more specific error messages
            let errorMessage = result.message || 'Error joining queue';

            // Check for common issues
            if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
                errorMessage = 'Session expired. Please log in again.';
                // Navigate to login after a delay
                setTimeout(() => {
                    navigation.replace('Login');
                }, 2000);
            } else if (errorMessage.includes('500') || errorMessage.includes('Server error')) {
                errorMessage = 'Server error. Please try again in a moment.';
            } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection.';
            }

            setStatus(errorMessage);
            return;
        }

        setStatus('Looking for a match...');

        // Start polling for match
        pollingInterval.current = setInterval(async () => {
            const statusResult = await chatService.checkMatchStatus();

            if (statusResult.success && statusResult.data.status === 'matched') {
                clearInterval(pollingInterval.current);
                navigation.replace('Chat', {
                    roomId: statusResult.data.roomId,
                    partnerUsername: statusResult.data.partnerUsername || 'Stranger',
                });
            }
        }, 2000);
    };

    const handleCancel = async () => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
        }
        await chatService.leaveChat();
        navigation.navigate('Home');
    };

    const translateX = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-260, 260],
    });

    return (
        <AnimatedBackground>
            <View style={styles.container}>
                <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <LottieView
                    source={require('../../assets/animations/searching.json')}
                    autoPlay
                    loop
                    style={styles.animation}
                />

                <Text style={styles.heading}>Finding the best match for you</Text>
                <Text style={styles.subtext}>{status}</Text>

                {/* Progress Bar */}
                <View style={styles.progressBar}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                transform: [{ translateX }],
                            },
                        ]}
                    />
                </View>

                <GradientButton
                    title="Cancel Search"
                    onPress={handleCancel}
                    style={styles.cancelButton}
                    textStyle={styles.cancelButtonText}
                />
            </View>
        </AnimatedBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    logo: {
        width: 90,
        height: 45,
        marginBottom: spacing.lg,
    },
    animation: {
        width: 260,
        height: 260,
        marginBottom: spacing.lg,
    },
    heading: {
        ...typography.h2,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtext: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    progressBar: {
        width: 260,
        height: 6,
        backgroundColor: colors.glassBg,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        marginBottom: spacing.xl,
    },
    progressFill: {
        width: 130,
        height: '100%',
        backgroundColor: colors.accentYellow,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    cancelButtonText: {
        fontSize: 16,
    },
});

export default MatchScreen;
