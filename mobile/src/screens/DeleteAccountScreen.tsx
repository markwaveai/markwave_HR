import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar } from 'react-native';
import { normalize, wp, hp } from '../utils/responsive';

const DeleteAccountScreen = ({ onBack }: { onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState<'activate' | 'deactivate'>('deactivate');
    const [mobile, setMobile] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendOTP = () => {
        if (!mobile || !firstName || !lastName) return;
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            Alert.alert('Success', 'OTP Sent successfully to your mobile number!');
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.card}>
                        {/* Custom Tab Switcher */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tabButton, activeTab === 'activate' ? styles.activeTabButton : styles.inactiveTabButton]}
                                onPress={() => setActiveTab('activate')}
                            >
                                <Text style={[styles.tabText, activeTab === 'activate' ? styles.activeTabText : styles.inactiveTabText]}>
                                    Activate User
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabButton, activeTab === 'deactivate' ? styles.activeTabButton : styles.inactiveTabButton]}
                                onPress={() => setActiveTab('deactivate')}
                            >
                                <Text style={[styles.tabText, activeTab === 'deactivate' ? styles.activeTabText : styles.inactiveTabText]}>
                                    Deactivate User
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.mainTitle}>
                                {activeTab === 'deactivate' ? 'Deactivate Account' : 'Activate Account'}
                            </Text>
                            <Text style={styles.subTitle}>
                                {activeTab === 'deactivate' ? "We're sorry to see you go." : "Welcome back to Markwave."}
                            </Text>
                        </View>

                        <View style={styles.formContainer}>
                            {/* Mobile Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.prefixContainer}>
                                    <Text style={styles.prefixText}>+91</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, { paddingLeft: wp(12) }]}
                                    placeholder="Enter your registered mobile *"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="phone-pad"
                                    value={mobile}
                                    onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, ''))}
                                    maxLength={10}
                                />
                            </View>

                            {/* Name Inputs Grid */}
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, styles.halfInput]}
                                    placeholder="First Name *"
                                    placeholderTextColor="#94a3b8"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                                <TextInput
                                    style={[styles.input, styles.halfInput]}
                                    placeholder="Last Name *"
                                    placeholderTextColor="#94a3b8"
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                            </View>

                            {/* Email Input */}
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address (Optional)"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (!mobile || !firstName || !lastName || isSending) && styles.disabledButton
                                ]}
                                onPress={handleSendOTP}
                                disabled={!mobile || !firstName || !lastName || isSending}
                            >
                                {isSending ? (
                                    <View style={styles.loadingRow}>
                                        <ActivityIndicator color="#ffffff" size="small" />
                                        <Text style={styles.submitButtonText}>SENDING...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.submitButtonText}>SEND OTP</Text>
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
        </SafeAreaView>
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 6,
        marginBottom: hp(4),
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    tabButton: {
        flex: 1,
        paddingVertical: hp(1.5),
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTabButton: {
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    inactiveTabButton: {
        backgroundColor: 'transparent',
    },
    tabText: {
        fontSize: normalize(14),
        fontWeight: '700',
    },
    activeTabText: {
        color: '#ffffff',
    },
    inactiveTabText: {
        color: '#64748b',
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
