import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, TextInput } from 'react-native';
import { ChevronLeftIcon, EditIcon, SaveIcon } from '../components/Icons';
import { normalize, wp, hp } from '../utils/responsive';

const PrivacyPolicyScreen = ({ onBack }: { onBack: () => void }) => {
    const [isEditing, setIsEditing] = React.useState(false);

    // Primary content state (Simple plain text for mobile editing)
    const [content, setContent] = React.useState(`Privacy Policy & Terms and Conditions

Last Updated: 2/24/2026

Privacy Policy
At Markwave HR, we value your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, and safeguard your information when you use our HR Portal.

1. Information We Collect
To provide a comprehensive HR management experience, we collect various types of information:
- Personal Identity Information: Legal name, gender, date of birth, nationality, and government-issued identification numbers.
- Employment Details: Professional role, department, employee ID, work location, date of joining, reporting hierarchy, and work history.
- Contact Information: Professional and personal email addresses, registered mobile number for OTP verification, and emergency contact details.
- Payroll & Financial Data: Bank account details, tax identification numbers, and compensation structure.

2. How We Use Your Information
The information collected is utilized strictly for legitimate business and HR administration purposes:
- Operational Management: Facilitating attendance tracking, leave applications, performance reviews, and employee life-cycle events.
- Security & Authentication: Utilizing your contact info for secure Two-Factor Authentication (2FA) and detecting unauthorized portal access.
- Legal Compliance: Ensuring adherence to local labor laws, tax regulations, and statutory reporting requirements.

3. Data Sharing & Disclosure
We do not sell your personal data. Information is shared only with authorized personnel within the organization (HR, Finance, IT) and trusted third-party service providers (e.g., payroll processors, insurance providers) under strict confidentiality agreements.

4. Data Security & Storage
Your data is stored securely using advanced encryption standards both in transit and at rest. We conduct regular security audits and implement strict access control policies to prevent data breaches.

Terms and Conditions
By accessing and using the Markwave HR Portal, you agree to comply with and be bound by the following terms and conditions.

1. Acceptance of Terms
These terms constitute a legal agreement between you and Markwave regarding the use of the platform. If you do not agree, you must immediately cease using the portal.

2. Authorized Use & Account Responsibility
- Credential Confidentiality: You are solely responsible for maintaining the privacy of your login credentials and for all activities that occur under your account.
- Prohibited Sharing: Sharing account access or credentials with colleagues or third parties is strictly prohibited and may result in disciplinary action.

3. Conduct & Integrity
Users must provide accurate, current, and complete information for all HR processes. Misrepresentation of facts, fraudulent attendance marking, or unauthorized data manipulation is a violation of company policy and these terms.

4. Termination of Access
Markwave reserves the right to suspend or terminate your access to the portal at any time, without notice, for conduct that violates these terms or organizational policies.

5. Intellectual Property
All content, design, software, and logic within the HR Portal are the intellectual property of Markwave and may not be copied, modified, or redistributed without explicit written consent.

© 2026 Markwave HR. All rights reserved.`);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <ChevronLeftIcon color="#64748b" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Editor Mode' : 'Privacy Policy'}</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                >
                    {isEditing ? (
                        <SaveIcon color="#22c55e" size={24} />
                    ) : (
                        <EditIcon color="#4381ff" size={24} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {isEditing ? (
                    <TextInput
                        multiline
                        value={content}
                        onChangeText={setContent}
                        style={styles.editor}
                        autoFocus
                    />
                ) : (
                    <View>
                        <Text style={styles.mainTitle}>Privacy Policy & Terms and Conditions</Text>
                        <Text style={styles.lastUpdated}>Last Updated: 2/24/2026</Text>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Privacy Policy</Text>
                            <Text style={styles.paragraph}>
                                At Markwave HR, we value your privacy and are committed to protecting your personal data.
                                This Privacy Policy outlines how we collect, use, and safeguard your information when you use our HR Portal.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.subTitle}>1. Information We Collect</Text>
                            <Text style={styles.paragraph}>To provide a comprehensive HR management experience, we collect various types of information:</Text>

                            <View style={styles.listItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.listText}>
                                    <Text style={styles.bold}>Personal Identity Information:</Text> Legal name, gender, date of birth, nationality, and government-issued identification numbers.
                                </Text>
                            </View>

                            <View style={styles.listItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.listText}>
                                    <Text style={styles.bold}>Employment Details:</Text> Professional role, department, employee ID, work location, date of joining, reporting hierarchy, and work history.
                                </Text>
                            </View>

                            <View style={styles.listItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.listText}>
                                    <Text style={styles.bold}>Contact Information:</Text> Professional and personal email addresses, registered mobile number for OTP verification, and emergency contact details.
                                </Text>
                            </View>

                            <View style={styles.listItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.listText}>
                                    <Text style={styles.bold}>Payroll & Financial Data:</Text> Bank account details, tax identification numbers, and compensation structure required for salary processing.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.subTitle}>2. How We Use Your Information</Text>
                            <Text style={styles.paragraph}>The information collected is utilized strictly for legitimate business and HR administration purposes:</Text>

                            <View style={styles.listItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.listText}>
                                    <Text style={styles.bold}>Operational Management:</Text> Facilitating attendance tracking, leave applications, performance reviews, and employee life-cycle events.
                                </Text>
                            </View>

                            <View style={styles.listItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.listText}>
                                    <Text style={styles.bold}>Security & Authentication:</Text> Utilizing contact info for secure Two-Factor Authentication (2FA) and detecting unauthorized portal access.
                                </Text>
                            </View>

                            <View style={styles.listItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.listText}>
                                    <Text style={styles.bold}>Legal Compliance:</Text> Ensuring adherence to local labor laws, tax regulations, and statutory reporting requirements.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.subTitle}>3. Data Sharing & Disclosure</Text>
                            <Text style={styles.paragraph}>
                                We do not sell your personal data. Information is shared only with authorized personnel within the organization (HR, Finance, IT) and trusted third-party service providers (e.g., payroll processors, insurance providers) under strict confidentiality agreements.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.subTitle}>4. Data Security & Storage</Text>
                            <Text style={styles.paragraph}>
                                Your data is stored securely using advanced encryption standards both in transit and at rest. We conduct regular security audits and implement strict access control policies to prevent data breaches.
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Terms and Conditions</Text>
                            <Text style={styles.paragraph}>
                                By accessing and using the Markwave HR Portal, you agree to comply with and be bound by the following terms and conditions.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.subTitle}>1. Acceptance of Terms</Text>
                            <Text style={styles.paragraph}>
                                These terms constitute a legal agreement between you and Markwave regarding the use of the platform. If you do not agree, you must immediately cease using the portal.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.subTitle}>2. Authorized Use & Account Responsibility</Text>

                            <View style={styles.listItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.listText}>
                                    <Text style={styles.bold}>Credential Confidentiality:</Text> You are solely responsible for maintaining the privacy of your login credentials and for all activities that occur under your account.
                                </Text>
                            </View>

                            <View style={styles.listItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.listText}>
                                    <Text style={styles.bold}>Prohibited Sharing:</Text> Sharing account access or credentials with colleagues or third parties is strictly prohibited and may result in disciplinary action.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.subTitle}>3. Conduct & Integrity</Text>
                            <Text style={styles.paragraph}>
                                Users must provide accurate, current, and complete information for all HR processes. Misrepresentation of facts, fraudulent attendance marking, or unauthorized data manipulation is a violation of company policy and these terms.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.subTitle}>4. Termination of Access</Text>
                            <Text style={styles.paragraph}>
                                Markwave reserves the right to suspend or terminate your access to the portal at any time, without notice, for conduct that violates these terms or organizational policies.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.subTitle}>5. Intellectual Property</Text>
                            <Text style={styles.paragraph}>
                                All content, design, software, and logic within the HR Portal are the intellectual property of Markwave and may not be copied, modified, or redistributed without explicit written consent.
                            </Text>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>© 2026 Markwave HR. All rights reserved.</Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#1e293b',
    },
    editButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editor: {
        fontSize: normalize(16),
        color: '#475569',
        lineHeight: normalize(24),
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#f8fafc',
        minHeight: hp(60),
        textAlignVertical: 'top',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: wp(6),
    },
    mainTitle: {
        fontSize: normalize(24),
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: hp(1),
        lineHeight: normalize(32),
    },
    lastUpdated: {
        fontSize: normalize(14),
        color: '#64748b',
        fontWeight: '500',
        marginBottom: hp(4),
    },
    section: {
        marginBottom: hp(4),
    },
    sectionTitle: {
        fontSize: normalize(22),
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: hp(1.5),
    },
    subTitle: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: hp(1.5),
    },
    paragraph: {
        fontSize: normalize(16),
        color: '#475569',
        lineHeight: normalize(24),
        marginBottom: hp(2),
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: hp(1.5),
        paddingRight: wp(2),
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#38bdf8',
        marginTop: normalize(10),
        marginRight: wp(3),
    },
    listText: {
        fontSize: normalize(16),
        color: '#475569',
        lineHeight: normalize(24),
        flex: 1,
    },
    bold: {
        fontWeight: '700',
        color: '#1e293b',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: hp(4),
    },
    footer: {
        marginTop: hp(4),
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: hp(4),
    },
    footerText: {
        fontSize: normalize(12),
        color: '#94a3b8',
        fontWeight: '500',
    },
});

export default PrivacyPolicyScreen;
