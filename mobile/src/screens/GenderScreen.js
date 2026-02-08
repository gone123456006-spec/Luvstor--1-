import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AnimatedBackground from '../components/AnimatedBackground';
import GradientButton from '../components/GradientButton';
import { authService } from '../services/auth';
import { countries } from '../utils/countries';
import { colors, spacing, typography, borderRadius } from '../styles/theme';

const GenderScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        username: '',
        country: '',
        gender: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const authenticated = await authService.isAuthenticated();
        if (authenticated) {
            const user = await authService.getStoredUser();
            if (user) {
                setIsLoggedIn(true);
                setFormData({
                    username: user.username || '',
                    country: user.country || '',
                    gender: user.gender || '',
                });
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.username || !formData.country || !formData.gender) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        if (isLoggedIn) {
            // Already logged in, just navigate
            navigation.navigate('Match');
            setLoading(false);
            return;
        }

        // Anonymous login
        const result = await authService.anonymousLogin(
            formData.username,
            formData.country,
            formData.gender
        );

        if (result.success) {
            navigation.navigate('Match');
        } else {
            setError(result.message || 'Login failed');
        }

        setLoading(false);
    };

    return (
        <AnimatedBackground>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {!isLoggedIn && (
                    <TouchableOpacity
                        style={styles.authButton}
                        onPress={() => navigation.navigate('Auth')}
                    >
                        <Text style={styles.authButtonText}>Login / Signup</Text>
                    </TouchableOpacity>
                )}

                <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.welcome}>
                    {isLoggedIn ? 'Welcome Back!' : 'Chat Anonymously'}
                </Text>
                <Text style={styles.intro}>
                    {isLoggedIn
                        ? 'Confirm your details to start chatting.'
                        : 'Start your anonymous chat journey. Fill in your details below.'}
                </Text>

                {/* Input Fields */}
                <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons
                            name="account"
                            size={20}
                            color={colors.textTertiary}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your username"
                            placeholderTextColor={colors.textTertiary}
                            value={formData.username}
                            onChangeText={(text) =>
                                setFormData({ ...formData, username: text })
                            }
                            editable={Boolean(!isLoggedIn)}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="globe-outline"
                            size={20}
                            color={colors.textTertiary}
                            style={styles.inputIcon}
                        />
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={formData.country}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, country: value })
                                }
                                style={styles.picker}
                                dropdownIconColor={colors.textPrimary}
                                enabled={true}
                            >
                                <Picker.Item label="Select your country" value="" />
                                {countries.map((country) => (
                                    <Picker.Item key={country} label={country} value={country} />
                                ))}
                            </Picker>
                        </View>
                    </View>
                </View>

                {/* Gender Selection */}
                <Text style={styles.genderLabel}>Choose Your Gender</Text>
                <View style={styles.genderOptions}>
                    <TouchableOpacity
                        style={[
                            styles.genderCard,
                            formData.gender === 'male' && styles.genderCardActive,
                        ]}
                        onPress={() => setFormData({ ...formData, gender: 'male' })}
                    >
                        <Ionicons
                            name="male"
                            size={50}
                            color={
                                formData.gender === 'male'
                                    ? colors.accentYellow
                                    : colors.textPrimary
                            }
                        />
                        <Text
                            style={[
                                styles.genderText,
                                formData.gender === 'male' && styles.genderTextActive,
                            ]}
                        >
                            Male
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.genderCard,
                            formData.gender === 'female' && styles.genderCardActive,
                        ]}
                        onPress={() => setFormData({ ...formData, gender: 'female' })}
                    >
                        <Ionicons
                            name="female"
                            size={50}
                            color={
                                formData.gender === 'female'
                                    ? colors.accentYellow
                                    : colors.textPrimary
                            }
                        />
                        <Text
                            style={[
                                styles.genderText,
                                formData.gender === 'female' && styles.genderTextActive,
                            ]}
                        >
                            Female
                        </Text>
                    </TouchableOpacity>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <GradientButton
                    title={
                        loading
                            ? 'Connecting...'
                            : isLoggedIn
                                ? 'Start Chatting'
                                : 'Chat Anonymously'
                    }
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={
                        loading || !formData.username || !formData.country || !formData.gender
                    }
                    style={styles.submitButton}
                />
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
    authButton: {
        position: 'absolute',
        top: spacing.lg,
        right: spacing.lg,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    authButtonText: {
        color: colors.textPrimary,
        fontSize: 14,
    },
    logo: {
        width: 200,
        height: 100,
        marginBottom: spacing.md,
    },
    welcome: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    intro: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        maxWidth: 320,
    },
    inputGroup: {
        width: '100%',
        maxWidth: 320,
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.glassBg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
    },
    inputIcon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        color: colors.textPrimary,
        fontSize: 16,
    },
    pickerContainer: {
        flex: 1,
    },
    picker: {
        color: colors.textPrimary,
        height: 50,
    },
    genderLabel: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    genderOptions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    genderCard: {
        width: 120,
        height: 140,
        backgroundColor: colors.glassBg,
        borderWidth: 2,
        borderColor: 'transparent',
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
    },
    genderCardActive: {
        borderColor: colors.accentYellow,
        backgroundColor: 'rgba(255, 211, 105, 0.15)',
    },
    genderText: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '500',
        marginTop: spacing.sm,
    },
    genderTextActive: {
        color: colors.accentYellow,
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        marginBottom: spacing.md,
    },
    submitButton: {
        marginTop: spacing.lg,
        width: '100%',
        maxWidth: 250,
    },
});

export default GenderScreen;
