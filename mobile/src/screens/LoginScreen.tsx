import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    StatusBar
} from 'react-native';
import { authApi } from '../services/api';

interface LoginScreenProps {
    onLogin: (user: any) => void;
}

const { width } = Dimensions.get('window');

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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
            console.log("OTP Send Error:", err);
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
            console.log("OTP Verify Error:", err);
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

            {/* Background decoration circles */}
            <View style={[styles.circle, styles.circleTop]} />
            <View style={[styles.circle, styles.circleBottom]} />

            <View style={styles.contentContainer}>
                <View style={styles.card}>
                    <View style={styles.headerContainer}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.lockIcon}>{step === 'phone' ? '📱' : '🔒'}</Text>
                        </View>
                        <Text style={styles.title}>{step === 'phone' ? 'Welcome to Markwave HR' : 'Verify Identity'}</Text>
                        <Text style={styles.subtitle}>
                            {step === 'phone'
                                ? `Sign in with your ${loginMethod === 'phone' ? 'mobile number' : 'email'}`
                                : `Enter code sent to ${loginMethod === 'phone' ? phone : email}`}
                        </Text>
                    </View>

                    {step === 'phone' && (
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, loginMethod === 'phone' && styles.activeTab]}
                                onPress={() => { setLoginMethod('phone'); setError(''); }}
                            >
                                <Text style={[styles.tabText, loginMethod === 'phone' && styles.activeTabText]}>Phone</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, loginMethod === 'email' && styles.activeTab]}
                                onPress={() => { setLoginMethod('email'); setError(''); }}
                            >
                                <Text style={[styles.tabText, loginMethod === 'email' && styles.activeTabText]}>Email</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.formContainer}>
                        {step === 'phone' ? (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{loginMethod === 'phone' ? 'MOBILE NUMBER' : 'EMAIL ADDRESS'}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={loginMethod === 'phone' ? "Enter your mobile number" : "Enter your email address"}
                                    placeholderTextColor="#b2bec3"
                                    value={loginMethod === 'phone' ? phone : email}
                                    onChangeText={loginMethod === 'phone' ? setPhone : setEmail}
                                    keyboardType={loginMethod === 'phone' ? "phone-pad" : "email-address"}
                                    autoCapitalize="none"
                                />
                            </View>
                        ) : (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>ONE-TIME PASSWORD</Text>
                                <TextInput
                                    style={[styles.input, styles.otpInput]}
                                    placeholder="000000"
                                    placeholderTextColor="#b2bec3"
                                    value={otp}
                                    onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                                <TouchableOpacity onPress={() => setStep('phone')}>
                                    <Text style={styles.changeNumberText}>Change number?</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>⚠️ {error}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={step === 'phone' ? handleSendOTP : handleVerifyOTP}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {step === 'phone' ? 'Get OTP →' : 'Verify & Sign In →'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Don't have an account? <Text style={styles.linkText}>Contact Admin</Text>
                    </Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    circle: {
        position: 'absolute',
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: (width * 0.8) / 2,
        backgroundColor: 'rgba(72, 50, 125, 0.05)',
    },
    circleTop: {
        top: -width * 0.2,
        left: -width * 0.2,
    },
    circleBottom: {
        bottom: -width * 0.2,
        right: -width * 0.2,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        zIndex: 1,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#dfe6e9',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 64,
        height: 64,
        backgroundColor: '#48327d',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#48327d',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    lockIcon: {
        fontSize: 28,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d3436',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#636e72',
    },
    formContainer: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#636e72',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#fbfcff',
        borderWidth: 1,
        borderColor: '#dfe6e9',
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: '#2d3436',
    },
    otpInput: {
        letterSpacing: 10,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    changeNumberText: {
        color: '#48327d',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'right',
    },
    errorContainer: {
        backgroundColor: '#fff0f0',
        padding: 12,
        borderRadius: 8,
    },
    errorText: {
        color: '#d63031',
        fontSize: 12,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#48327d',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#48327d',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#636e72',
    },
    linkText: {
        color: '#48327d',
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f7fa',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#636e72',
    },
    activeTabText: {
        color: '#48327d',
        fontWeight: 'bold',
    },
});

export default LoginScreen;
