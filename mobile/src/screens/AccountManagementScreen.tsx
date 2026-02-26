import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { normalize, wp, hp } from '../utils/responsive';
import { authApi } from '../services/api';

const AccountManagementScreen = ({ user, state, onBack }: { user: any, state?: any, onBack: () => void }) => {
    const [mobile, setMobile] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [action, setAction] = useState<'activate' | 'deactivate'>('deactivate');
    const [isSending, setIsSending] = useState(false);

    const [showOtpField, setShowOtpField] = useState(false);
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Permission check
    const isAdmin = user?.is_admin === true;

    useEffect(() => {
        if (state?.mobile) {
            setMobile(state.mobile);
        }
        if (state?.action) {
            setAction(state.action);
        }
    }, [state]);


    const handleSendOTP = async () => {
        if (!mobile) return; // Note: firstName/lastName not strictly required for OTP send if they are optional for actual update?
        // Actually, web version only requires mobile for OTP.

        if (!isAdmin) {
            Alert.alert('Unauthorized', 'Only administrators can perform this action.');
            return;
        }

        setIsSending(true);
        try {
            await authApi.sendOTP(mobile, action);
            setShowOtpField(true);
            Alert.alert('Success', `OTP Sent successfully to ${mobile}!`);
        } catch (error: any) {
            console.error('Failed to send OTP:', error);
            const errorMsg = error.map ? error.map((e: any) => e.message).join('\n') : (error.message || 'Failed to send OTP. Please try again.');

            // Replicate the exact web message if the backend rejects it for non-admin privileges
            if (error?.response?.status === 403 || errorMsg.includes('admin') || errorMsg.includes('Unauthorized')) {
                Alert.alert('Unauthorized', 'Only administrators can perform this action.');
            } else {
                Alert.alert('Error', errorMsg);
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) return;
        setIsVerifying(true);
        try {
            await authApi.updateAccountStatus(mobile, otp, 'deactivate'); // Force 'deactivate' here as a safeguard
            Alert.alert('Success', `Account ${isAdmin ? 'disabled' : 'deactivated'} successfully!`);
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
                                {isAdmin ? 'Delete User' : 'Deactivate'}
                            </Text>
                            <Text style={styles.subTitle}>
                                {isAdmin ? 'Admin Portal: Manage User Account Status' : 'Deactivate your account temporarily'}
                            </Text>
                        </View>

                        <View style={styles.formContainer}>
                            {/* Only show if admin. If not admin, the action defaults to 'deactivate' */}
                            {isAdmin && !showOtpField && (
                                <View style={styles.toggleContainer}>
                                    <TouchableOpacity
                                        style={[styles.toggleButton, action === 'deactivate' && styles.activeToggleDeactivate]}
                                        onPress={() => setAction('deactivate')}
                                    >
                                        <Text style={[styles.toggleButtonText, { color: action === 'deactivate' ? '#ef4444' : '#64748b' }]}>
                                            Deactivate
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toggleButton, action === 'activate' && styles.activeToggleActivate]}
                                        onPress={() => setAction('activate')}
                                    >
                                        <Text style={[styles.toggleButtonText, { color: action === 'activate' ? '#22c55e' : '#64748b' }]}>
                                            Activate
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Mobile Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.prefixContainer}>
                                    <Text style={styles.prefixText}>+91</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, { paddingLeft: wp(12) }, showOtpField && styles.disabledInput]}
                                    placeholder={isAdmin ? "Target user mobile number *" : "Your mobile number *"}
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="phone-pad"
                                    value={mobile}
                                    onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, ''))}
                                    maxLength={10}
                                    editable={!showOtpField}
                                />
                            </View>

                            {showOtpField && (
                                <View>
                                    <Text style={styles.otpLabel}>Enter OTP sent to the user's mobile</Text>
                                    <TextInput
                                        style={[styles.input, { textAlign: 'center', letterSpacing: 8 }]}
                                        placeholder="Enter 6-digit OTP *"
                                        placeholderTextColor="#94a3b8"
                                        keyboardType="number-pad"
                                        value={otp}
                                        onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                                        maxLength={6}
                                    />
                                </View>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    action === 'activate' && { backgroundColor: '#22c55e', shadowColor: '#22c55e' },
                                    (isSending || isVerifying || (!showOtpField && !mobile) || (showOtpField && otp.length !== 6)) && styles.disabledButton
                                ]}
                                onPress={showOtpField ? handleVerifyOTP : handleSendOTP}
                                disabled={isSending || isVerifying || (!showOtpField && !mobile) || (showOtpField && otp.length !== 6)}
                            >
                                {isSending || isVerifying ? (
                                    <View style={styles.loadingRow}>
                                        <ActivityIndicator color="#ffffff" size="small" />
                                        <Text style={styles.submitButtonText}>{isSending ? 'SENDING...' : 'VERIFYING...'}</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.submitButtonText}>
                                        {showOtpField ? `VERIFY & ${isAdmin ? 'DISABLE' : 'DEACTIVATE'}` : `SEND OTP TO ${isAdmin ? 'DISABLE' : 'DEACTIVATE'}`}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Cancel Button */}
                            <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
                                <Text style={styles.cancelButtonText}>Cancel and return</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footerContainer}>
                            <TouchableOpacity onPress={() => {/* Handle policy navigation */ }}>
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
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 4,
        borderRadius: 16,
        marginBottom: hp(3),
    },
    toggleButton: {
        flex: 1,
        paddingVertical: hp(1),
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeToggleDeactivate: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    activeToggleActivate: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleButtonText: {
        fontSize: normalize(14),
        fontWeight: 'bold',
    },
    otpLabel: {
        textAlign: 'center',
        fontSize: normalize(13),
        color: '#64748b',
        marginBottom: hp(1),
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

export default AccountManagementScreen;
