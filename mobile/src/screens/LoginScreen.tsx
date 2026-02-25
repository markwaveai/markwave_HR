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
    Pressable,
    ScrollView
} from 'react-native';
import { HelpCircleIcon, ShieldIcon } from '../components/Icons';
import { authApi } from '../services/api';
import { normalize, wp, hp } from '../utils/responsive';

interface LoginScreenProps {
    onLogin: (user: any) => void;
    onOpenSupport: () => void;
    onOpenPrivacy: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onOpenSupport, onOpenPrivacy }) => {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        let interval: any;
        if (step === 'otp' && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, resendTimer]);

    const handleSendOTP = async () => {
        const trimmedPhone = phone.trim();

        // Validate phone number (must be exactly 10 digits)
        if (loginMethod === 'phone') {
            if (!trimmedPhone) {
                setError('Please enter mobile number');
                return;
            }
            // Remove any non-digit characters for validation
            const digitsOnly = trimmedPhone.replace(/\D/g, '');
            if (digitsOnly.length !== 10) {
                setError('Mobile number must be exactly 10 digits');
                return;
            }
        }

        // Validate email (must contain @)
        if (loginMethod === 'email') {
            const trimmedEmail = email.trim();
            if (!trimmedEmail) {
                setError('Please enter email address');
                return;
            }
            if (!trimmedEmail.includes('@')) {
                setError('Please enter a valid email address');
                return;
            }
        }

        setError('');
        setIsLoading(true);

        try {
            if (loginMethod === 'phone') {
                await authApi.sendOTP(trimmedPhone);
            } else {
                await authApi.sendEmailOTP(email.trim());
            }
            setStep('otp');
            setError('');
            setSuccessMessage('');
            setResendTimer(30); // Start 30s timer
        } catch (err) {
            console.error('Send OTP Error:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendTimer > 0 || isLoading) return;

        setError('');
        setSuccessMessage('');
        setIsLoading(true);
        try {
            if (loginMethod === 'phone') {
                await authApi.sendOTP(phone.trim());
            } else {
                await authApi.sendEmailOTP(email.trim());
            }
            setResendTimer(30);
            setOtp(''); // Clear OTP on resend
            setSuccessMessage('OTP resent successfully');

            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err) {
            console.error('Resend OTP Error:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage || 'Failed to resend OTP');
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
                    {/* ... Existing form inputs/logic remains same ... */}
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
                                onChangeText={(text) => {
                                    if (loginMethod === 'phone') {
                                        const digitsOnly = text.replace(/\D/g, '');
                                        setPhone(digitsOnly.slice(0, 10));
                                    } else {
                                        setEmail(text);
                                    }
                                }}
                                keyboardType={loginMethod === 'phone' ? "number-pad" : "email-address"}
                                autoCapitalize="none"
                                maxLength={loginMethod === 'phone' ? 10 : undefined}
                            />
                            {loginMethod === 'phone' && phone.length > 0 && phone.length < 10 && (
                                <Text style={styles.validationText}>Please enter a valid 10-digit mobile number</Text>
                            )}
                            {loginMethod === 'email' && email.length > 0 && !email.includes('@') && (
                                <Text style={styles.validationText}>Please enter a valid email address</Text>
                            )}
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
                            <View style={styles.otpFooter}>
                                <TouchableOpacity onPress={() => setStep('phone')} style={styles.changeLink}>
                                    <Text style={styles.changeLinkText}>
                                        Change {loginMethod === 'phone' ? 'mobile number' : 'email'}?
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleResendOTP}
                                    disabled={resendTimer > 0 || isLoading}
                                    style={styles.resendLink}
                                >
                                    <Text style={[styles.resendLinkText, resendTimer > 0 && styles.resendLinkDisabled]}>
                                        {isLoading ? 'Sending...' : (resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {successMessage ? (
                        <View style={styles.successContainer}>
                            <Text style={styles.successText}>{successMessage}</Text>
                        </View>
                    ) : null}

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {(() => {
                        const isButtonDisabled = isLoading || (
                            step === 'phone'
                                ? (loginMethod === 'phone' ? phone.length < 10 : !email || !email.includes('@'))
                                : otp.length < 6
                        );

                        return (
                            <TouchableOpacity
                                style={[styles.primaryBtn, isButtonDisabled && styles.primaryBtnDisabled]}
                                onPress={step === 'phone' ? handleSendOTP : handleVerifyOTP}
                                disabled={isButtonDisabled}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>
                                        {step === 'phone' ? 'Get OTP' : 'Verify & Sign In'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    })()}
                </View>

                {/* Footer Links inside card */}
                <View style={styles.cardFooter}>
                    <TouchableOpacity style={styles.footerLink} onPress={onOpenPrivacy}>
                        <ShieldIcon size={14} color="#636e72" />
                        <Text style={styles.footerLinkText}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <View style={styles.linkSeparator} />
                    <TouchableOpacity style={styles.footerLink} onPress={onOpenSupport}>
                        <HelpCircleIcon size={14} color="#636e72" />
                        <Text style={styles.footerLinkText}>Support</Text>
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
        padding: wp(5),
    },
    card: {
        backgroundColor: 'white',
        borderRadius: normalize(16),
        padding: wp(6),
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
        maxWidth: wp(95),
        alignSelf: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: hp(3),
    },
    logo: {
        width: wp(45),
        height: hp(8),
        marginBottom: hp(2),
    },
    title: {
        fontSize: normalize(22),
        fontWeight: 'bold',
        color: '#2d3436',
        textAlign: 'center',
        marginBottom: hp(1),
    },
    subtitle: {
        fontSize: normalize(14),
        color: '#636e72',
        textAlign: 'center',
        lineHeight: normalize(20),
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: normalize(12),
        padding: wp(1),
        marginBottom: hp(3),
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: hp(1.2),
        alignItems: 'center',
        borderRadius: normalize(8),
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
        fontSize: normalize(14),
        fontWeight: '600',
    },
    toggleTextActive: {
        color: '#48327d',
    },
    formContainer: {
        gap: hp(2.5),
    },
    inputLabel: {
        fontSize: normalize(11),
        fontWeight: '700',
        color: '#636e72',
        marginBottom: hp(1),
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#fbfcff',
        borderWidth: 1,
        borderColor: '#dfe6e9',
        borderRadius: normalize(12),
        padding: wp(3.5),
        fontSize: normalize(16),
        color: '#2d3436',
    },
    otpInput: {
        textAlign: 'center',
        letterSpacing: 8,
        fontSize: normalize(24),
        fontWeight: 'bold',
    },
    changeLink: {
        marginTop: hp(1.5),
        alignSelf: 'flex-end',
    },
    changeLinkText: {
        color: '#48327d',
        fontWeight: '600',
        fontSize: normalize(12),
    },
    otpFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hp(1.5),
    },
    resendLink: {
        padding: wp(1),
    },
    resendLinkText: {
        color: '#48327d',
        fontWeight: '700',
        fontSize: normalize(12),
    },
    resendLinkDisabled: {
        color: '#b2bec3',
        fontWeight: '500',
    },
    errorContainer: {
        backgroundColor: '#fff0f0',
        padding: wp(3),
        borderRadius: normalize(8),
        borderWidth: 1,
        borderColor: '#ffcdd2',
    },
    errorText: {
        color: '#e05260',
        fontSize: normalize(13),
        textAlign: 'center',
        fontWeight: '500',
    },
    primaryBtn: {
        backgroundColor: '#48327d',
        paddingVertical: hp(2),
        borderRadius: normalize(12),
        alignItems: 'center',
        shadowColor: '#48327d',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginTop: hp(1),
    },
    primaryBtnDisabled: {
        backgroundColor: '#a6a0b5',
        shadowOpacity: 0,
        elevation: 0,
    },
    primaryBtnText: {
        color: 'white',
        fontSize: normalize(16),
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        marginTop: hp(5),
    },
    footerText: {
        color: '#636e72',
        fontSize: normalize(12),
        fontWeight: '600',
    },
    copyrightText: {
        color: '#b2bec3',
        fontSize: normalize(11),
        marginTop: hp(0.5),
    },
    validationText: {
        color: '#e05260',
        fontSize: normalize(11),
        marginTop: hp(0.5),
        fontWeight: '500',
        marginLeft: wp(1),
    },
    successContainer: {
        backgroundColor: '#f0fdf4',
        padding: wp(3),
        borderRadius: normalize(8),
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    successText: {
        color: '#16a34a',
        fontSize: normalize(13),
        textAlign: 'center',
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(4),
        paddingTop: hp(2),
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    footerLink: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        gap: 6,
    },
    footerLinkText: {
        fontSize: normalize(12),
        color: '#636e72',
        fontWeight: '600',
    },
    linkSeparator: {
        width: 1,
        height: 12,
        backgroundColor: '#e2e8f0',
    }
});

export default LoginScreen;
