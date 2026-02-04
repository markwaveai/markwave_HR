import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
    ScrollView,
    Platform
} from 'react-native';
import { showAlert } from '../utils/platform';
import { teamApi } from '../services/api';



const EmployeeListScreen = () => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dropdown State
    const [isRolePickerVisible, setIsRolePickerVisible] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        contact: '',
        aadhar: '',
        location: ''
    });

    const COL_WIDTHS = {
        id: 90,
        name: 130,
        role: 180,
        contact: 130,
        email: 220,
        aadhar: 140,
        loc: 140
    };

    const [designations, setDesignations] = useState([
        'Software Engineer', 'Senior Software Engineer', 'Product Manager', 'UI/UX Designer', 'HR Manager', 'Sales Executive'
    ]);

    useEffect(() => {
        fetchEmployees();
    }, []);



    const fetchEmployees = async () => {
        try {
            const data = await teamApi.getAttendanceRegistry();
            setEmployees(data);
        } catch (error) {
            console.log('Error fetching employees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!formData.firstName || !formData.email || !formData.role) {
            showAlert('Validation', 'Please fill required fields (Name, Email, Role)');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                role: formData.role,
                contact: formData.contact,
                aadhar: formData.aadhar,
                location: formData.location
            };

            await teamApi.addEmployee(payload);
            showAlert('Success', 'Employee added successfully!');
            setIsModalVisible(false);
            setFormData({ firstName: '', lastName: '', email: '', role: '', contact: '', aadhar: '', location: '' });
            fetchEmployees();
        } catch (error) {
            console.log('Add employee error:', error);
            showAlert('Error', 'Failed to add employee');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.id }]}>EMP ID</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.name }]}>FIRST NAME</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.name }]}>LAST NAME</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.role }]}>DESIGNATION</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.contact }]}>CONTACT</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.email }]}>EMAIL</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.aadhar }]}>AADHAR</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.loc }]}>LOCATION</Text>
        </View>
    );

    const renderRow = (item, index) => (
        <View style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]} key={item.id.toString()}>
            <Text style={[styles.cell, { width: COL_WIDTHS.id, color: '#48327d', fontWeight: 'bold' }]}>
                #{item.id || '----'}
            </Text>
            <Text style={[styles.cell, { width: COL_WIDTHS.name, fontWeight: 'bold' }]}>{item.first_name || '-'}</Text>
            <Text style={[styles.cell, { width: COL_WIDTHS.name, fontWeight: 'bold' }]}>{item.last_name || '-'}</Text>
            <Text style={[styles.cell, { width: COL_WIDTHS.role, color: '#636e72' }]}>{item.role}</Text>
            <Text style={[styles.cell, { width: COL_WIDTHS.contact, color: '#636e72' }]}>{item.contact || '-'}</Text>
            <Text style={[styles.cell, { width: COL_WIDTHS.email, color: '#636e72' }]}>{item.email}</Text>
            <Text style={[styles.cell, { width: COL_WIDTHS.aadhar, color: '#636e72' }]}>{item.aadhar || '-'}</Text>
            <Text style={[styles.cell, { width: COL_WIDTHS.loc, color: '#636e72' }]}>{item.location || '-'}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Employees</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setIsModalVisible(true)}
                >
                    <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#48327d" style={{ marginTop: 20 }} />
            ) : (
                <ScrollView
                    style={styles.verticalScroll}
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
                >
                    {/* Card Container for Table */}
                    <View style={styles.tableCard}>
                        <ScrollView
                            horizontal={true}
                            style={styles.horizontalScroll}
                            contentContainerStyle={{ flexGrow: 1 }}
                            persistentScrollbar={true}
                        >
                            <View>
                                {renderHeader()}
                                {employees.length === 0 ? (
                                    <Text style={styles.emptyText}>No records found.</Text>
                                ) : (
                                    employees.map((item, index) => renderRow(item, index))
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </ScrollView>
            )}

            {/* Registration Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.registerModalOverlay}>
                    <View style={styles.registerModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Employee</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.formContainer}>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>FIRST NAME *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Name"
                                        value={formData.firstName}
                                        onChangeText={(t) => setFormData({ ...formData, firstName: t })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>LAST NAME</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Name"
                                        value={formData.lastName}
                                        onChangeText={(t) => setFormData({ ...formData, lastName: t })}
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1, zIndex: 1000 }}>
                                    <Text style={styles.inputLabel}>DESIGNATION *</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setIsRolePickerVisible(!isRolePickerVisible)}
                                    >
                                        <Text style={[styles.dropdownText, !formData.role && { color: '#b2bec3' }]}>
                                            {formData.role || "Select Role"}
                                        </Text>
                                        <Text style={{ color: '#636e72', fontSize: 12 }}>▼</Text>
                                    </TouchableOpacity>

                                    {/* Inline Dropdown */}
                                    {isRolePickerVisible && (
                                        <View style={{
                                            position: 'absolute',
                                            top: 75,
                                            left: 0,
                                            right: 0,
                                            backgroundColor: 'white',
                                            borderRadius: 8,
                                            elevation: 10,
                                            zIndex: 2000,
                                            maxHeight: 250,
                                            borderColor: '#dfe6e9',
                                            borderWidth: 1,
                                            shadowColor: '#000',
                                            shadowOpacity: 0.1,
                                            shadowRadius: 4,
                                            shadowOffset: { width: 0, height: 2 }
                                        }}>
                                            <View style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                padding: 10,
                                                backgroundColor: '#636e72',
                                                borderTopLeftRadius: 8,
                                                borderTopRightRadius: 8,
                                                alignItems: 'center'
                                            }}>
                                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>SELECT ROLE</Text>
                                                <TouchableOpacity onPress={() => setIsRolePickerVisible(false)}>
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>✕</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <ScrollView nestedScrollEnabled={true}>
                                                {designations.map((role) => (
                                                    <TouchableOpacity
                                                        key={role}
                                                        style={{
                                                            padding: 12,
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#f1f2f6',
                                                            backgroundColor: formData.role === role ? '#f0edfa' : 'white'
                                                        }}
                                                        onPress={() => {
                                                            setFormData({ ...formData, role: role });
                                                            setIsRolePickerVisible(false);
                                                        }}
                                                    >
                                                        <Text style={{ color: '#2d3436', fontSize: 13, fontWeight: formData.role === role ? 'bold' : 'normal' }}>
                                                            {role}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>CONTACT</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="phone-pad"
                                        placeholder="Phone number"
                                        value={formData.contact}
                                        onChangeText={(t) => setFormData({ ...formData, contact: t })}
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>EMAIL *</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="email@example.com"
                                value={formData.email}
                                onChangeText={(t) => setFormData({ ...formData, email: t })}
                            />

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>AADHAR NUMBER</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Aadhar"
                                        value={formData.aadhar}
                                        onChangeText={(t) => setFormData({ ...formData, aadhar: t })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>ADDRESS / LOCATION</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="City / Address"
                                        value={formData.location}
                                        onChangeText={(t) => setFormData({ ...formData, location: t })}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (!(formData.firstName && formData.email && formData.role) || isSubmitting) && styles.submitButtonDisabled
                                ]}
                                onPress={handleRegister}
                                disabled={!(formData.firstName && formData.email && formData.role) || isSubmitting}
                            >
                                <Text style={styles.submitButtonText}>
                                    {isSubmitting ? 'Saving...' : 'Register Employee'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Role Picker Modal */}
            <Modal
                visible={isRolePickerVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsRolePickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.pickerOverlay}
                    activeOpacity={1}
                    onPress={() => setIsRolePickerVisible(false)}
                >
                    <View style={styles.pickerContent}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Select Designation</Text>
                            <TouchableOpacity onPress={() => setIsRolePickerVisible(false)}>
                                <Text style={[styles.closeText, { color: 'white' }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                            {designations.map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    style={styles.pickerItem}
                                    onPress={() => {
                                        setFormData({ ...formData, role: role });
                                        setIsRolePickerVisible(false);
                                    }}
                                >
                                    <Text style={[styles.pickerItemText, formData.role === role && { color: '#48327d', fontWeight: 'bold' }]}>
                                        {role}
                                    </Text>
                                    {formData.role === role && <Text style={{ color: '#48327d', fontWeight: 'bold' }}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        backgroundColor: 'white',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d3436',
    },
    addButton: {
        backgroundColor: '#48327d',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },

    verticalScroll: { flex: 1 },
    horizontalScroll: { flex: 1 },

    // Card Container
    tableCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: '#eaecf0',
        overflow: 'hidden',
        elevation: 2, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    // Centered Table Styles
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eaecf0',
        paddingVertical: 14,
        paddingHorizontal: 10,
    },
    headerCell: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#636e72',
        textTransform: 'uppercase',
        paddingHorizontal: 8,
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6',
        paddingVertical: 14,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        alignItems: 'center',
    },
    tableRowAlt: {
        backgroundColor: '#fbfbfb',
    },
    cell: {
        fontSize: 13,
        color: '#2d3436',
        paddingHorizontal: 8,
        textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#636e72',
        padding: 20,
        width: 1000,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end', // Changed for Bottom Sheet
        padding: 0, // No padding for full width
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        maxHeight: '90%',
        width: '100%',
        elevation: 10,
        // Added margin for main modal only? No, this class is used by both. Separation needed?
        // Wait, modalContent is used by the Register form too. I need to be careful.
        // Let's create a separate style for pickerContent.
    },
    // Fix: Separate modalContent and pickerContent usage.
    // Existing code uses modalContent for Register Modal.
    // Register modal uses `justifyContent: 'center'` in `modalOverlay`? No, overlay is shared.
    // I need to split the Overlay styles if I want different behaviors (one center, one bottom).

    // ... Actually, the Register Modal uses `modalOverlay` which is now `flex-end`. That will break the Register Form presentation.
    // I MUST separate the overlay styles.

    registerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    registerModalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        maxHeight: '90%',
        width: '100%',
        elevation: 10,
    },

    // ...
    // pickerContent w separate.

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#48327d',
    },
    closeText: {
        fontSize: 20,
        color: '#636e72',
        padding: 5,
    },
    formContainer: {
        padding: 20,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#636e72',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#dfe6e9',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        color: '#2d3436',
        backgroundColor: '#fdfdfd',
    },
    submitButton: {
        backgroundColor: '#48327d',
        paddingVertical: 14,
        borderRadius: 10,
        marginTop: 24,
        alignItems: 'center',
        shadowColor: '#48327d',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    dropdownButton: {
        borderWidth: 1,
        borderColor: '#dfe6e9',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fdfdfd',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dropdownText: {
        fontSize: 14,
        color: '#2d3436',
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    pickerContent: {
        backgroundColor: 'white',
        borderRadius: 8,
        maxHeight: '60%',
        width: '85%',
        elevation: 10,
        overflow: 'hidden',
        paddingBottom: 0
    },
    pickerHeader: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#636e72',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#636e72'
    },
    pickerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white'
    },
    pickerItem: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'white'
    },
    pickerItemText: {
        fontSize: 14,
        color: '#2d3436',
    },
});

export default EmployeeListScreen;



