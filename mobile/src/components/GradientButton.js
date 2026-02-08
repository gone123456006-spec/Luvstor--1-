import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, shadows } from '../styles/theme';

const GradientButton = ({
    title,
    onPress,
    loading = false,
    disabled = false,
    style,
    textStyle,
    gradient = colors.buttonGradient,
}) => {
    // Ensure boolean props are actual booleans (Fabric renderer requirement)
    const loadingBool = Boolean(loading);
    const disabledBool = Boolean(disabled);

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabledBool || loadingBool}
            activeOpacity={0.8}
            style={[styles.container, style]}
        >
            <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                    styles.gradient,
                    (disabledBool || loadingBool) && styles.disabled,
                ]}
            >
                {loadingBool ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <Text style={[styles.text, textStyle]}>{title}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.xxl,
        overflow: 'hidden',
        ...shadows.md,
    },
    gradient: {
        paddingVertical: 14,
        paddingHorizontal: 36,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default GradientButton;
