import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { normalize, wp, hp } from '../utils/responsive';
import { authApi } from '../services/api';

const DeleteAccountScreen = ({ onBack }: { onBack: () => void }) => {
    const [mobile, setMobile] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    const [showOtpField, setShowOtpField] = useState(false);
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleSendOTP = async () => {
        if (!mobile || !firstName || !lastName) return;
        setIsSending(true);
        try {
            await authApi.sendOTP(mobile, 'deactivate');
            setShowOtpField(true);
            Alert.alert('Success', 'OTP Sent successfully to your mobile number!');
        } catch (error: any) {
            console.error('Failed to send OTP:', error);
            Alert.alert('Error', error.map ? error.map((e: any) => e.message).join('\n') : (error.message || 'Failed to send OTP. Please try again.'));
        } finally {
            setIsSending(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) return;
        setIsVerifying(true);
        try {
            await authApi.updateAccountStatus(mobile, otp, 'deactivate');
            Alert.alert('Success', 'Account deactivated successfully!');
            onBack();
        } catch (error: any) {
            console.error('Failed to verify OTP:', error);
            Alert.alert('Error', error.message || 'Failed to verify OTP. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.card}>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.mainTitle}>
                                Delete Account
                            </Text>
                            <Text style={styles.subTitle}>
                                We're sorry to see you go.
                            </Text>
                        </View>

                        <View style={styles.formContainer}>
                            {/* Mobile Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.prefixContainer}>
                                    <Text style={styles.prefixText}>+91</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, { paddingLeft: wp(12) }, showOtpField && styles.disabledInput]}
                                    placeholder="Enter your registered mobile *"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="phone-pad"
                                    value={mobile}
                                    onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, ''))}
                                    maxLength={10}
                                    editable={!showOtpField}
                                />
                            </View>

                            {/* Name Inputs Grid */}
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, styles.halfInput, showOtpField && styles.disabledInput]}
                                    placeholder="First Name *"
                                    placeholderTextColor="#94a3b8"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    editable={!showOtpField}
                                />
                                <TextInput
                                    style={[styles.input, styles.halfInput, showOtpField && styles.disabledInput]}
                                    placeholder="Last Name *"
                                    placeholderTextColor="#94a3b8"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    editable={!showOtpField}
                                />
                            </View>

                            {/* Email Input */}
                            <TextInput
                                style={[styles.input, showOtpField && styles.disabledInput]}
                                placeholder="Email Address (Optional)"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                                editable={!showOtpField}
                            />

                            {showOtpField && (
                                <TextInput
                                    style={[styles.input, { textAlign: 'center', letterSpacing: 8 }]}
                                    placeholder="Enter 6-digit OTP *"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="number-pad"
                                    value={otp}
                                    onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                                    maxLength={6}
                                />
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (isSending || isVerifying || (!showOtpField && (!mobile || !firstName || !lastName)) || (showOtpField && otp.length !== 6)) && styles.disabledButton
                                ]}
                                onPress={showOtpField ? handleVerifyOTP : handleSendOTP}
                                disabled={isSending || isVerifying || (!showOtpField && (!mobile || !firstName || !lastName)) || (showOtpField && otp.length !== 6)}
                            >
                                {isSending || isVerifying ? (
                                    <View style={styles.loadingRow}>
                                        <ActivityIndicator color="#ffffff" size="small" />
                                        <Text style={styles.submitButtonText}>{isSending ? 'SENDING...' : 'VERIFYING...'}</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.submitButtonText}>{showOtpField ? 'VERIFY & DEACTIVATE' : 'SEND OTP'}</Text>
                                )}
                            </TouchableOpacity>

                            {/* Cancel Button */}
                            <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
                                <Text style={styles.cancelButtonText}>Cancel and return</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footerContainer}>
                            <TouchableOpacity onPress={() => {/* Handle policy navigation if needed */ }}>
                                <Text style={styles.footerText}>Terms and Policy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: hp(4),
        paddingHorizontal: wp(4),
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 32,
        padding: wp(6),
        shadowColor: '#cbd5e1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    headerTextContainer: {
        alignItems: 'center',
        marginBottom: hp(4),
    },
    mainTitle: {
        fontSize: normalize(24),
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    subTitle: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: '#0f172a',
    },
    formContainer: {
        gap: hp(2),
    },
    inputWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    prefixContainer: {
        position: 'absolute',
        left: wp(4.5),
        zIndex: 1,
        height: '100%',
        justifyContent: 'center',
    },
    prefixText: {
        color: '#64748b',
        fontSize: normalize(14),
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: wp(3),
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 24,
        paddingVertical: hp(1.8),
        paddingHorizontal: wp(5),
        fontSize: normalize(14),
        color: '#334155',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    disabledInput: {
        backgroundColor: '#f8fafc',
        color: '#94a3b8',
    },
    halfInput: {
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#ef4444',
        paddingVertical: hp(2),
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: hp(1),
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    disabledButton: {
        backgroundColor: '#e2e8f0',
        shadowOpacity: 0,
        elevation: 0,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: normalize(14),
        fontWeight: 'bold',
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: hp(1),
    },
    cancelButtonText: {
        color: '#94a3b8',
        fontSize: normalize(13),
        textDecorationLine: 'underline',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    footerContainer: {
        marginTop: hp(4),
        alignItems: 'center',
    },
    footerText: {
        color: '#1e293b',
        fontSize: normalize(12),
        textDecorationLine: 'underline',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
});

export default DeleteAccountScreen;
