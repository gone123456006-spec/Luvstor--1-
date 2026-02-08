import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AnimatedBackground from '../components/AnimatedBackground';
import GradientButton from '../components/GradientButton';
import { authService } from '../services/auth';
import { countries } from '../utils/countries';
import { colors, spacing, typography, borderRadius } from '../styles/theme';

const AuthScreen = ({ navigation }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        country: '',
        gender: '',
    });

    const handleSubmit = async () => {
        setError('');
        setLoading(true);

        let result;
        if (isLogin) {
            result = await authService.login(
                formData.email || formData.username,
                formData.password
            );
        } else {
            if (!formData.username || !formData.email || !formData.password || !formData.country || !formData.gender) {
                setError('Please fill in all fields');
                setLoading(false);
                return;
            }
            result = await authService.signup(formData);
        }

        if (result.success) {
            navigation.replace('Match');
        } else {
            setError(result.message || 'Authentication failed');
        }

        setLoading(false);
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({
            username: '',
            email: '',
            password: '',
            country: '',
            gender: '',
        });
    };

    return (
        <AnimatedBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />

                        <Text style={styles.heading}>
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isLogin ? 'Login to continue chatting' : 'Join Luvstor today'}
                        </Text>

                        {/* Username (Signup only) */}
                        {!isLogin && (
                            <View style={styles.inputWrapper}>
                                <MaterialCommunityIcons
                                    name="account"
                                    size={18}
                                    color={colors.textTertiary}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Username"
                                    placeholderTextColor={colors.textTertiary}
                                    value={formData.username}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, username: text })
                                    }
                                    autoCapitalize="none"
                                />
                            </View>
                        )}

                        {/* Email */}
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons
                                name="email-outline"
                                size={18}
                                color={colors.textTertiary}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={isLogin ? 'Username or Email' : 'Email Address'}
                                placeholderTextColor={colors.textTertiary}
                                value={isLogin ? formData.email : formData.email}
                                onChangeText={(text) =>
                                    setFormData({ ...formData, email: text })
                                }
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons
                                name="lock-outline"
                                size={18}
                                color={colors.textTertiary}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={colors.textTertiary}
                                value={formData.password}
                                onChangeText={(text) =>
                                    setFormData({ ...formData, password: text })
                                }
                                secureTextEntry={true}
                            />
                        </View>

                        {/* Country (Signup only) */}
                        {!isLogin && (
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="globe-outline"
                                    size={18}
                                    color={colors.textTertiary}
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
                                        <Picker.Item label="Select Country" value="" />
                                        {countries.map((country) => (
                                            <Picker.Item
                                                key={country}
                                                label={country}
                                                value={country}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        )}

                        {/* Gender (Signup only) */}
                        {!isLogin && (
                            <View style={styles.genderSelection}>
                                <TouchableOpacity
                                    style={[
                                        styles.genderButton,
                                        formData.gender === 'male' && styles.genderButtonActive,
                                    ]}
                                    onPress={() => setFormData({ ...formData, gender: 'male' })}
                                >
                                    <Ionicons
                                        name="male"
                                        size={16}
                                        color={
                                            formData.gender === 'male'
                                                ? colors.accentYellow
                                                : colors.textPrimary
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.genderButtonText,
                                            formData.gender === 'male' &&
                                            styles.genderButtonTextActive,
                                        ]}
                                    >
                                        Male
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.genderButton,
                                        formData.gender === 'female' && styles.genderButtonActive,
                                    ]}
                                    onPress={() =>
                                        setFormData({ ...formData, gender: 'female' })
                                    }
                                >
                                    <Ionicons
                                        name="female"
                                        size={16}
                                        color={
                                            formData.gender === 'female'
                                                ? colors.accentYellow
                                                : colors.textPrimary
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.genderButtonText,
                                            formData.gender === 'female' &&
                                            styles.genderButtonTextActive,
                                        ]}
                                    >
                                        Female
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <GradientButton
                            title={
                                loading
                                    ? 'Please wait...'
                                    : isLogin
                                        ? 'Login'
                                        : 'Sign Up'
                            }
                            onPress={handleSubmit}
                            loading={loading}
                            style={styles.submitButton}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                {isLogin
                                    ? "Don't have an account? "
                                    : 'Already have an account? '}
                            </Text>
                            <TouchableOpacity onPress={toggleMode}>
                                <Text style={styles.linkText}>
                                    {isLogin ? 'Sign Up' : 'Login'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </AnimatedBackground>
    );
};

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xxl,
    },
    card: {
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 60,
        marginBottom: spacing.lg,
    },
    heading: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
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
        marginBottom: spacing.md,
        width: '100%',
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingLeft: spacing.md,
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
    genderSelection: {
        flexDirection: 'row',
        gap: spacing.sm,
        width: '100%',
        marginBottom: spacing.md,
    },
    genderButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassBg,
    },
    genderButtonActive: {
        borderColor: colors.accentYellow,
        backgroundColor: 'rgba(255, 211, 105, 0.15)',
    },
    genderButtonText: {
        color: colors.textPrimary,
        fontSize: 14,
    },
    genderButtonTextActive: {
        color: colors.accentYellow,
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        backgroundColor: colors.errorBg,
        padding: spacing.sm,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.md,
        width: '100%',
        textAlign: 'center',
    },
    submitButton: {
        width: '100%',
        marginTop: spacing.sm,
    },
    footer: {
        flexDirection: 'row',
        marginTop: spacing.lg,
    },
    footerText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    linkText: {
        color: colors.accentYellow,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});

export default AuthScreen;
