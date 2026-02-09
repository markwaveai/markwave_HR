import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Image,
    Animated,
    Pressable
} from 'react-native';
import { authApi } from '../services/api';

interface LoginScreenProps {
    onLogin: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleSendOTP = async () => {
        if (loginMethod === 'phone' && !phone) {
            setError('Please enter mobile number');
            return;
        }
        if (loginMethod === 'email' && !email) {
            setError('Please enter email address');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            if (loginMethod === 'phone') {
                await authApi.sendOTP(phone);
            } else {
                await authApi.sendEmailOTP(email);
            }
            setStep('otp');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length < 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            let data;
            if (loginMethod === 'phone') {
                data = await authApi.verifyOTP(phone, otp);
            } else {
                data = await authApi.verifyEmailOTP(email, otp);
            }
            if (data.success) {
                onLogin(data.user);
            } else {
                setError(data.error || 'Invalid OTP');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />

            <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>
                        {step === 'phone' ? 'Welcome to Markwave HR' : 'Verify Identity'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'phone'
                            ? `Please enter your ${loginMethod === 'phone' ? 'mobile number' : 'email'} to receive an OTP`
                            : `Enter the 6-digit code sent to ${loginMethod === 'phone' ? phone : email}`
                        }
                    </Text>
                </View>

                {step === 'phone' && (
                    <View style={styles.toggleContainer}>
                        <Pressable
                            onPress={() => { setLoginMethod('phone'); setError(''); }}
                            style={[styles.toggleBtn, loginMethod === 'phone' && styles.toggleBtnActive]}
                        >
                            <Text style={[styles.toggleText, loginMethod === 'phone' && styles.toggleTextActive]}>Phone</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => { setLoginMethod('email'); setError(''); }}
                            style={[styles.toggleBtn, loginMethod === 'email' && styles.toggleBtnActive]}
                        >
                            <Text style={[styles.toggleText, loginMethod === 'email' && styles.toggleTextActive]}>Email</Text>
                        </Pressable>
                    </View>
                )}

                <View style={styles.formContainer}>
                    {step === 'phone' ? (
                        <View>
                            <Text style={styles.inputLabel}>
                                {loginMethod === 'phone' ? 'MOBILE NUMBER' : 'EMAIL ADDRESS'}
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder={loginMethod === 'phone' ? "e.g. 9876543210" : "name@company.com"}
                                placeholderTextColor="#b2bec3"
                                value={loginMethod === 'phone' ? phone : email}
                                onChangeText={loginMethod === 'phone' ? setPhone : setEmail}
                                keyboardType={loginMethod === 'phone' ? "number-pad" : "email-address"}
                                autoCapitalize="none"
                            />
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.inputLabel}>ENTER 6-DIGIT OTP</Text>
                            <TextInput
                                style={[styles.input, styles.otpInput]}
                                placeholder="••••••"
                                placeholderTextColor="#b2bec3"
                                value={otp}
                                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                            <TouchableOpacity onPress={() => setStep('phone')} style={styles.changeLink}>
                                <Text style={styles.changeLinkText}>
                                    Change {loginMethod === 'phone' ? 'mobile number' : 'email'}?
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
                        onPress={step === 'phone' ? handleSendOTP : handleVerifyOTP}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryBtnText}>
                                {step === 'phone' ? 'Get OTP' : 'Verify & Sign In'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Internal HR Access Only</Text>
                <Text style={styles.copyrightText}>© 2026 Markwave AI. All rights reserved.</Text>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#dfe6e9',
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 180,
        height: 60,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2d3436',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#636e72',
        textAlign: 'center',
        lineHeight: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleBtnActive: {
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
    toggleTextActive: {
        color: '#48327d',
    },
    formContainer: {
        gap: 20,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#636e72',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#fbfcff',
        borderWidth: 1,
        borderColor: '#dfe6e9',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#2d3436',
    },
    otpInput: {
        textAlign: 'center',
        letterSpacing: 8,
        fontSize: 24,
        fontWeight: 'bold',
    },
    changeLink: {
        marginTop: 12,
        alignSelf: 'flex-end',
    },
    changeLinkText: {
        color: '#48327d',
        fontWeight: '600',
        fontSize: 12,
    },
    errorContainer: {
        backgroundColor: '#fff0f0',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffcdd2',
    },
    errorText: {
        color: '#e05260',
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500',
    },
    primaryBtn: {
        backgroundColor: '#48327d',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#48327d',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 8,
    },
    primaryBtnDisabled: {
        backgroundColor: '#a6a0b5',
        shadowOpacity: 0,
        elevation: 0,
    },
    primaryBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
    },
    footerText: {
        color: '#636e72',
        fontSize: 12,
        fontWeight: '600',
    },
    copyrightText: {
        color: '#b2bec3',
        fontSize: 11,
        marginTop: 4,
    }
});

export default LoginScreen;
