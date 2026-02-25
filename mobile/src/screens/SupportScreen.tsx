import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking, TextInput } from 'react-native';
import { ChevronLeftIcon, HelpCircleIcon, MailIcon, PhoneIcon, ClockIcon, MessageSquareIcon, ChevronDownIcon, SendIcon } from '../components/Icons';
import { normalize, wp, hp } from '../utils/responsive';

const SupportScreen = ({ onBack, onNavigateTo }: { onBack: () => void, onNavigateTo?: (screen: string) => void }) => {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
    });

    const faqs = [
        {
            question: "How do I update my profile information?",
            answer: "You can update your profile information by navigating to the 'Me' section and clicking on the 'Edit Profile' button. From there, you can change your contact details, emergency contacts, and professional bio."
        },
        {
            question: "Where can I view my monthly payslips?",
            answer: "Your payslips are available in the 'Finance' or 'Payroll' section. You can view and download them for any month. If you notice any discrepancies, please contact the HR-Payroll team."
        },
        {
            question: "I'm having trouble with Two-Factor Authentication.",
            answer: "If you are not receiving OTPs on your mobile, please ensure your registered number is correct. You can also try using the 'Email OTP' option on the login page for an alternative verification method."
        },
        {
            question: "What should I do if my attendance is marked incorrectly?",
            answer: "If there's a discrepancy in your attendance, you can submit an 'Attendance Regularization' request through the Leave & Attendance portal. Your manager will then review and approve the correction."
        },
        {
            question: "How do I claim reimbursement for business expenses?",
            answer: "Reimbursements can be claimed under the 'Expenses' module. Please upload clear scans of your bills and categorize the expense appropriately (e.g., Travel, Food, Internet) for faster processing."
        },
        {
            question: "Can I refer a candidate for an open position?",
            answer: "Yes! Markwave encourages employee referrals. Visit the 'Careers' or 'Internal Job Postings' section to see open roles and submit your referral's details and resume."
        },
        {
            question: "How do I reset my portal password?",
            answer: "Since we use OTP-based login for enhanced security, you don't need a traditional password. Simply log in using your registered mobile number or email and enter the 6-digit code sent to you."
        },
        {
            question: "How do I delete my account?",
            answer: "Account deletion is a permanent action. If you wish to proceed, please fill out the contact form with the subject 'Account Deletion' or contact your HR administrator directly. We will process your request within 48 hours."
        }
    ];

    const toggleFaq = (index: number) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <ChevronLeftIcon color="#64748b" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Support Center</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.heroSection}>
                    <Text style={styles.mainTitle}>Contact Support</Text>
                    <Text style={styles.subtext}>
                        We are here to help. Check our FAQs below or fill out the form to get in touch with our team.
                    </Text>
                </View>

                <View style={styles.faqSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.accentBar} />
                        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    </View>
                    {faqs.map((faq, index) => (
                        <View key={index} style={styles.faqItem}>
                            <TouchableOpacity
                                style={styles.faqHeader}
                                onPress={() => toggleFaq(index)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.faqQuestion, expandedFaq === index && styles.activeFaqQuestion]}>
                                    {faq.question}
                                </Text>
                                <View style={{ transform: [{ rotate: expandedFaq === index ? '180deg' : '0deg' }] }}>
                                    <ChevronDownIcon color={expandedFaq === index ? '#0da487' : '#64748b'} size={20} />
                                </View>
                            </TouchableOpacity>
                            {expandedFaq === index && (
                                <View style={styles.faqAnswerContainer}>
                                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.formTitle}>Send us a message</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>First Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="John"
                            value={formData.firstName}
                            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Last Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Doe"
                            value={formData.lastName}
                            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="john@example.com"
                            keyboardType="email-address"
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+1 (555) 000-0000"
                            keyboardType="phone-pad"
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Message</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="How can we help you?"
                            multiline
                            numberOfLines={4}
                            value={formData.message}
                            onChangeText={(text) => setFormData({ ...formData, message: text })}
                        />
                    </View>

                    <TouchableOpacity style={styles.submitBtn}>
                        <SendIcon color="#ffffff" size={20} />
                        <Text style={styles.submitBtnText}>Send Message</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 Markwave HR. Professional Support Services.</Text>
                </View>
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
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: wp(6),
    },
    heroSection: {
        alignItems: 'center',
        marginTop: hp(1),
        marginBottom: hp(4),
    },
    mainTitle: {
        fontSize: normalize(28),
        fontWeight: '800',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: hp(1),
    },
    subtext: {
        fontSize: normalize(15),
        color: '#64748b',
        textAlign: 'center',
        lineHeight: normalize(22),
        paddingHorizontal: wp(4),
    },
    faqSection: {
        marginTop: hp(2),
        marginBottom: hp(4),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: hp(3),
    },
    accentBar: {
        width: 4,
        height: 24,
        backgroundColor: '#0da487',
        borderRadius: 2,
    },
    sectionTitle: {
        fontSize: normalize(20),
        fontWeight: '700',
        color: '#1e293b',
    },
    faqItem: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: hp(1.5),
        overflow: 'hidden',
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: wp(4),
    },
    faqQuestion: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
        marginRight: 10,
    },
    activeFaqQuestion: {
        color: '#0da487',
    },
    faqAnswerContainer: {
        paddingHorizontal: wp(4),
        paddingBottom: wp(4),
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: wp(3),
    },
    faqAnswer: {
        fontSize: normalize(14),
        color: '#64748b',
        lineHeight: normalize(22),
    },
    formSection: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: wp(6),
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginTop: hp(2),
    },
    formTitle: {
        fontSize: normalize(20),
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: hp(4),
    },
    inputGroup: {
        marginBottom: hp(2.5),
    },
    inputLabel: {
        fontSize: normalize(13),
        fontWeight: '600',
        color: '#64748b',
        marginBottom: hp(1),
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 12,
        padding: wp(3.5),
        fontSize: normalize(15),
        color: '#1e293b',
    },
    textArea: {
        height: hp(12),
        textAlignVertical: 'top',
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0da487',
        paddingVertical: hp(2),
        borderRadius: 12,
        gap: 10,
        marginTop: hp(2),
    },
    submitBtnText: {
        color: '#ffffff',
        fontSize: normalize(16),
        fontWeight: '700',
    },
    footer: {
        marginTop: hp(6),
        alignItems: 'center',
        paddingBottom: hp(4),
    },
    footerText: {
        fontSize: normalize(12),
        color: '#94a3b8',
        fontWeight: '500',
    },
});

export default SupportScreen;
