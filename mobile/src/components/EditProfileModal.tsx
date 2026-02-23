import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { CloseIcon, BriefcaseIcon, MailIcon, PhoneIcon, MapPinIcon, IdCardIcon, UserIcon } from './Icons';
import { authApi } from '../services/api';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    user: any;
    onUpdate: (updatedUser: any) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose, user, onUpdate }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        contact: '',
        aadhar: '',
        qualification: '',
        location: '',
        role: '' // Read-only mostly but good to have in state
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                contact: user.contact || user.phone || '',
                aadhar: user.aadhar ? user.aadhar.toString() : '',
                qualification: user.qualification || '',
                location: user.location || '',
                role: user.role || user.designation || ''
            });
        }
    }, [user, visible]);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const handleSave = async () => {
        // Validation
        if (!formData.first_name || !formData.email || !formData.contact) {
            Alert.alert('Error', 'Name, Email and Contact are required.');
            return;
        }
        if (!validateEmail(formData.email)) {
            Alert.alert('Error', 'Please enter a valid email address.');
            return;
        }
        if (formData.contact.length !== 10) {
            Alert.alert('Error', 'Contact number must be 10 digits.');
            return;
        }
        if (formData.aadhar && formData.aadhar.length !== 12) {
            Alert.alert('Error', 'Aadhar number must be 12 digits.');
            return;
        }

        setLoading(true);
        try {
            const idToUpdate = user.id; // Use ID for stability in URL if possible, or employee_id
            // In API we defined updateProfile to take ID. team_views member_detail takes pk (user.id).
            // Let's use user.id

            const payload = {
                acting_user_id: user.id, // Self-update
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                contact: formData.contact,
                aadhar: formData.aadhar,
                qualification: formData.qualification,
                location: formData.location,
                // role: formData.role // Role usually not self-editable
            };

            await authApi.updateProfile(user.id.toString(), payload);

            Alert.alert('Success', 'Profile updated successfully.');
            onUpdate({ ...user, ...payload }); // Optimistic update or just pass back
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const hasChanges = user && (
        formData.first_name !== (user.first_name || '') ||
        formData.last_name !== (user.last_name || '') ||
        formData.email !== (user.email || '') ||
        formData.contact !== (user.contact || user.phone || '') ||
        formData.aadhar !== (user.aadhar ? user.aadhar.toString() : '') ||
        formData.qualification !== (user.qualification || '') ||
        formData.location !== (user.location || '')
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                <View style={styles.overlay}>
                    <View style={styles.container}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Edit Profile</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <CloseIcon color="#64748b" size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>FIRST NAME</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}><UserIcon size={16} color="#94a3b8" /></View>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.first_name}
                                        onChangeText={(t) => handleChange('first_name', t)}
                                        placeholder="First Name"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>LAST NAME</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}><UserIcon size={16} color="#94a3b8" /></View>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.last_name}
                                        onChangeText={(t) => handleChange('last_name', t)}
                                        placeholder="Last Name"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>EMAIL ADDRESS</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}><MailIcon size={16} color="#94a3b8" /></View>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.email}
                                        onChangeText={(t) => handleChange('email', t)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        placeholder="Email"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>PHONE NUMBER</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}><PhoneIcon size={16} color="#94a3b8" /></View>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.contact}
                                        onChangeText={(t) => handleChange('contact', t.replace(/[^0-9]/g, ''))}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        placeholder="Phone"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>LOCATION</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}><MapPinIcon size={16} color="#94a3b8" /></View>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.location}
                                        onChangeText={(t) => handleChange('location', t)}
                                        placeholder="Location"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>QUALIFICATION</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}><BriefcaseIcon size={16} color="#94a3b8" /></View>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.qualification}
                                        onChangeText={(t) => handleChange('qualification', t)}
                                        placeholder="Qualification"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>AADHAR NUMBER</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}><IdCardIcon size={16} color="#94a3b8" /></View>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.aadhar}
                                        onChangeText={(t) => handleChange('aadhar', t.replace(/[^0-9]/g, ''))}
                                        keyboardType="numeric"
                                        maxLength={12}
                                        placeholder="Aadhar Number"
                                    />
                                </View>
                            </View>

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    (!hasChanges || loading) && styles.saveButtonDisabled
                                ]}
                                onPress={handleSave}
                                disabled={!hasChanges || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        height: '85%', // Occupy most of screen
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
    },
    closeButton: {
        padding: 4,
    },
    scrollContent: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        height: 50,
        paddingHorizontal: 12,
    },
    iconBox: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: 'white',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    saveButton: {
        backgroundColor: '#48327d',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#94a3b8',
        opacity: 0.6,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default EditProfileModal;
