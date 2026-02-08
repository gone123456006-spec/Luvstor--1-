import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AnimatedBackground from '../components/AnimatedBackground';
import GradientButton from '../components/GradientButton';
import { colors, spacing, typography, borderRadius } from '../styles/theme';

const HomeScreen = ({ navigation }) => {
    const handleStartChat = () => {
        navigation.navigate('Gender');
    };

    const openSocialLink = (url) => {
        Linking.openURL(url);
    };

    return (
        <AnimatedBackground>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Logo */}
                <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* Heading */}
                <View style={styles.headingContainer}>
                    <Text style={styles.heading}>Meet New People</Text>
                    <Text style={[styles.heading, styles.headingAccent]}>Anonymously</Text>
                </View>

                {/* Description */}
                <Text style={styles.description}>
                    Start anonymous conversations with{'\n'}
                    real people from around the world.{'\n'}
                    <Text style={styles.descriptionBold}>No sign-up. Just chat.</Text>
                </Text>

                {/* Start Button */}
                <GradientButton
                    title="Start Chat"
                    onPress={handleStartChat}
                    style={styles.startButton}
                />

                {/* Features */}
                <View style={styles.features}>
                    <View style={styles.featureCard}>
                        <MaterialCommunityIcons
                            name="account-circle"
                            size={24}
                            color={colors.accentYellow}
                        />
                        <Text style={styles.featureText}>Anonymous</Text>
                    </View>
                    <View style={styles.featureCard}>
                        <Ionicons name="flash" size={24} color={colors.accentYellow} />
                        <Text style={styles.featureText}>Instant Match</Text>
                    </View>
                    <View style={styles.featureCard}>
                        <MaterialCommunityIcons
                            name="shield-check"
                            size={24}
                            color={colors.accentYellow}
                        />
                        <Text style={styles.featureText}>Secure Chat</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.socialLinks}>
                        <TouchableOpacity
                            style={[styles.socialButton, styles.instagram]}
                            onPress={() =>
                                openSocialLink(
                                    'https://www.instagram.com/luvstor.app?igsh=MW4wNHF2cDV3ZG03aw=='
                                )
                            }
                        >
                            <FontAwesome5 name="instagram" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.socialButton, styles.telegram]}
                            onPress={() => openSocialLink('https://t.me/Luvstorapp')}
                        >
                            <FontAwesome5 name="telegram-plane" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.brandText}>By Brandoverts</Text>
                </View>
            </ScrollView>
        </AnimatedBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xxl,
    },
    logo: {
        width: 300,
        height: 150,
        marginBottom: spacing.md,
    },
    headingContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    heading: {
        ...typography.h1,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    headingAccent: {
        color: colors.accentYellow,
        marginTop: spacing.xs,
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 24,
    },
    descriptionBold: {
        fontWeight: '600',
    },
    startButton: {
        marginBottom: spacing.xl,
    },
    features: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.md,
        marginBottom: spacing.xxl,
    },
    featureCard: {
        backgroundColor: colors.glassBg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    featureText: {
        color: colors.textPrimary,
        fontSize: 15,
    },
    footer: {
        alignItems: 'center',
        marginTop: 'auto',
    },
    socialLinks: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    socialButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    instagram: {
        backgroundColor: '#E1306C',
    },
    telegram: {
        backgroundColor: '#0088cc',
    },
    brandText: {
        color: colors.textTertiary,
        fontSize: 14,
        letterSpacing: 1,
    },
});

export default HomeScreen;
