import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/theme';

const AnimatedBackground = ({ children }) => {
    // Create animated values for floating bubbles
    const bubbles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        animatedValue: new Animated.Value(0),
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 5000,
        duration: 15000 + Math.random() * 10000,
        size: 20 + Math.random() * 40,
        opacity: 0.1 + Math.random() * 0.15,
    }));

    React.useEffect(() => {
        // Start animations for all bubbles
        bubbles.forEach((bubble) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(bubble.delay),
                    Animated.timing(bubble.animatedValue, {
                        toValue: 1,
                        duration: bubble.duration,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={colors.radialGradient}
                style={styles.gradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                {/* Floating bubbles */}
                <View style={styles.bubblesContainer}>
                    {bubbles.map((bubble) => {
                        const translateY = bubble.animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1000, -100],
                        });

                        const translateX = bubble.animatedValue.interpolate({
                            inputRange: [0, 0.25, 0.5, 0.75, 1],
                            outputRange: [0, -20, 20, -15, 0],
                        });

                        const rotate = bubble.animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                        });

                        const scale = bubble.animatedValue.interpolate({
                            inputRange: [0, 0.1, 0.5, 0.9, 1],
                            outputRange: [0.5, 0.8, 1.1, 0.9, 0.6],
                        });

                        return (
                            <Animated.View
                                key={bubble.id}
                                style={[
                                    styles.bubble,
                                    {
                                        left: bubble.left,
                                        opacity: bubble.opacity,
                                        transform: [
                                            { translateY },
                                            { translateX },
                                            { rotate },
                                            { scale },
                                        ],
                                    },
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name="message-text"
                                    size={bubble.size}
                                    color="rgba(74, 144, 226, 0.3)"
                                />
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Content */}
                {children}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    bubblesContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    bubble: {
        position: 'absolute',
        bottom: 0,
    },
});

export default AnimatedBackground;
