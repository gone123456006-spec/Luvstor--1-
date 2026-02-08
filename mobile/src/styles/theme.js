export const colors = {
    // Gradients
    primaryGradient: ['#360167', '#561496', '#AF1281'],
    radialGradient: ['#561496', '#360167', '#210141'],
    buttonGradient: ['#ffd369', '#ff9f00'],

    // Accent colors
    accentYellow: '#ffd369',
    accentYellowHover: '#ffbf00',

    // Glass effects
    glassBg: 'rgba(255, 255, 255, 0.1)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',

    // Text
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    textTertiary: 'rgba(255, 255, 255, 0.6)',

    // Message bubbles
    ownMessageBg: '#ffd369',
    ownMessageText: '#000000',
    partnerMessageBg: 'rgba(255, 255, 255, 0.15)',
    partnerMessageText: '#ffffff',
    systemMessageBg: 'rgba(255, 255, 255, 0.05)',
    systemMessageText: 'rgba(255, 255, 255, 0.7)',

    // Status
    online: '#4ade80',
    offline: '#ef4444',
    typing: '#ffd369',

    // Error
    error: '#ff6b6b',
    errorBg: 'rgba(255, 107, 107, 0.1)',

    // Background
    background: '#1a1a1a',
    cardBg: '#2b2b2b',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 30,
    full: 9999,
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
};

export const typography = {
    h1: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
    },
    h2: {
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
    },
    body: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
    },
    caption: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
    },
    small: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
    },
};
