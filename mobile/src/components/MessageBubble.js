import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../styles/theme';

const MessageBubble = ({ message, isOwn, timestamp, seen, system }) => {
    // Ensure boolean props are actual booleans (Fabric renderer requirement)
    const isOwnBool = Boolean(isOwn);
    const seenBool = Boolean(seen);
    const systemBool = Boolean(system);

    if (systemBool) {
        return (
            <View style={styles.systemContainer}>
                <View style={styles.systemBubble}>
                    <Text style={styles.systemText}>{message}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, isOwnBool ? styles.ownContainer : styles.partnerContainer]}>
            <View style={[styles.bubble, isOwnBool ? styles.ownBubble : styles.partnerBubble]}>
                <Text style={[styles.messageText, isOwnBool ? styles.ownText : styles.partnerText]}>
                    {message}
                </Text>
                <View style={styles.footer}>
                    <Text style={[styles.timestamp, isOwnBool ? styles.ownTimestamp : styles.partnerTimestamp]}>
                        {timestamp}
                        {isOwnBool && seenBool && ' ✓✓'}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    ownContainer: {
        alignItems: 'flex-end',
    },
    partnerContainer: {
        alignItems: 'flex-start',
    },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    ownBubble: {
        backgroundColor: colors.ownMessageBg,
        borderBottomRightRadius: 4,
    },
    partnerBubble: {
        backgroundColor: colors.partnerMessageBg,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    ownText: {
        color: colors.ownMessageText,
    },
    partnerText: {
        color: colors.partnerMessageText,
    },
    footer: {
        marginTop: spacing.xs,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    timestamp: {
        fontSize: 11,
        opacity: 0.7,
    },
    ownTimestamp: {
        color: colors.ownMessageText,
    },
    partnerTimestamp: {
        color: colors.partnerMessageText,
    },
    systemContainer: {
        alignItems: 'center',
        marginVertical: spacing.sm,
    },
    systemBubble: {
        backgroundColor: colors.systemMessageBg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.lg,
    },
    systemText: {
        color: colors.systemMessageText,
        fontSize: 13,
    },
});

export default MessageBubble;
