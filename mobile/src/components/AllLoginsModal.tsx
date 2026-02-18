import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    Platform
} from 'react-native';
import { CloseIcon, SearchIcon, ChevronDownIcon, ClockIcon, MapPinIcon } from './Icons';
import { normalize, wp, hp } from '../utils/responsive';

interface AllLoginsModalProps {
    visible: boolean;
    onClose: () => void;
    employees: any[];
}

const AllLoginsModal: React.FC<AllLoginsModalProps> = ({ visible, onClose, employees = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [isStatusDropdownVisible, setIsStatusDropdownVisible] = useState(false);

    const filteredEmployees = employees.filter((emp: any) => {
        const matchesSearch =
            (emp.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (emp.role?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (emp.employee_id?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All Status'
            ? true
            : (emp.status || 'Absent') === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return { bg: '#dcfce7', text: '#15803d' };
            case 'On Leave': return { bg: '#fef3c7', text: '#b45309' };
            case 'Absent': return { bg: '#ffe4e6', text: '#be123c' };
            default: return { bg: '#f1f5f9', text: '#64748b' };
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>All Employees</Text>
                            <Text style={styles.subtitle}>TOTAL STRENGTH: {employees.length}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <CloseIcon color="#94a3b8" size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Search & Filter */}
                    <View style={styles.searchFilterContainer}>
                        <View style={styles.searchContainer}>
                            <SearchIcon color="#94a3b8" size={18} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search Name, ID, Role..."
                                placeholderTextColor="#94a3b8"
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                            />
                        </View>
                        <View style={{ position: 'relative' }}>
                            <TouchableOpacity
                                style={styles.filterBtn}
                                onPress={() => setIsStatusDropdownVisible(!isStatusDropdownVisible)}
                            >
                                <Text style={styles.filterBtnText}>
                                    {statusFilter === 'All Status' ? 'Status' : statusFilter}
                                </Text>
                                <ChevronDownIcon color="#64748b" size={16} />
                            </TouchableOpacity>

                            {isStatusDropdownVisible && (
                                <View style={styles.dropdownMenu}>
                                    {['All Status', 'Present', 'Absent', 'On Leave'].map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[styles.dropdownItem, statusFilter === status && styles.dropdownItemActive]}
                                            onPress={() => {
                                                setStatusFilter(status);
                                                setIsStatusDropdownVisible(false);
                                            }}
                                        >
                                            <Text style={[styles.dropdownItemText, statusFilter === status && styles.dropdownItemTextActive]}>
                                                {status}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Employee List */}
                    <FlatList
                        data={filteredEmployees}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        renderItem={({ item }) => {
                            const statusStyle = getStatusColor(item.status);
                            return (
                                <View style={styles.employeeCard}>
                                    <View style={styles.avatarContainer}>
                                        <Text style={styles.avatarText}>{item.name?.[0] || '?'}</Text>
                                    </View>

                                    <View style={styles.infoContainer}>
                                        <Text style={styles.empName}>{item.name}</Text>
                                        <View style={styles.row}>
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>{item.employee_id}</Text>
                                            </View>
                                            <Text style={styles.roleText} numberOfLines={1}>{item.role}</Text>
                                        </View>

                                        <View style={[styles.row, { marginTop: 6 }]}>
                                            {item.location && (
                                                <View style={styles.metaItem}>
                                                    <MapPinIcon size={12} color="#94a3b8" />
                                                    <Text style={styles.metaText}>{item.location}</Text>
                                                </View>
                                            )}
                                            {item.check_in && (
                                                <View style={styles.metaItem}>
                                                    <ClockIcon size={12} color="#22c55e" />
                                                    <Text style={[styles.metaText, { color: '#22c55e', fontWeight: 'bold' }]}>
                                                        In: {item.check_in}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                                    </View>
                                </View>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <SearchIcon color="#cbd5e1" size={48} />
                                <Text style={styles.emptyText}>No employees found matching criteria.</Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(30, 41, 59, 0.75)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: normalize(24),
        borderTopRightRadius: normalize(24),
        padding: wp(5),
        height: '85%',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10 },
            android: { elevation: 20 },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: hp(2.5),
    },
    modalTitle: {
        fontSize: normalize(20),
        fontWeight: '900',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: normalize(10),
        color: '#64748b',
        fontWeight: '700',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    closeBtn: {
        padding: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 20,
    },
    searchFilterContainer: {
        flexDirection: 'row',
        gap: wp(3),
        marginBottom: hp(2),
        zIndex: 10,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: normalize(12),
        paddingHorizontal: wp(3),
        height: hp(6),
    },
    searchInput: {
        flex: 1,
        marginLeft: wp(2),
        fontSize: normalize(14),
        color: '#1e293b',
        fontWeight: '600',
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: normalize(12),
        paddingHorizontal: wp(3),
        height: hp(6),
        justifyContent: 'center',
    },
    filterBtnText: {
        fontSize: normalize(12),
        fontWeight: '700',
        color: '#475569',
    },
    dropdownMenu: {
        position: 'absolute',
        top: hp(6.5),
        right: 0,
        width: wp(35),
        backgroundColor: 'white',
        borderRadius: normalize(12),
        elevation: 5,
        paddingVertical: 4,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    dropdownItem: {
        paddingVertical: hp(1.2),
        paddingHorizontal: wp(4),
    },
    dropdownItemActive: {
        backgroundColor: '#f1f5f9',
    },
    dropdownItemText: {
        fontSize: normalize(13),
        color: '#475569',
        fontWeight: '500',
    },
    dropdownItemTextActive: {
        color: '#48327d',
        fontWeight: '700',
    },
    employeeCard: {
        backgroundColor: 'white',
        borderRadius: normalize(16),
        padding: wp(3.5),
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1.2),
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    avatarContainer: {
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(20),
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    avatarText: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: '#64748b',
    },
    infoContainer: {
        flex: 1,
        marginLeft: wp(3),
    },
    empName: {
        fontSize: normalize(15),
        fontWeight: '800',
        color: '#1e293b',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    badge: {
        backgroundColor: '#f8fafc',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    badgeText: {
        fontSize: normalize(10),
        fontWeight: '700',
        color: '#64748b',
    },
    roleText: {
        fontSize: normalize(11),
        color: '#94a3b8',
        fontWeight: '600',
        flex: 1,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginRight: 8,
    },
    metaText: {
        fontSize: normalize(10),
        color: '#94a3b8',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: normalize(10),
        fontWeight: '800',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: hp(10),
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: normalize(14),
        marginTop: 10,
        fontWeight: '600',
    },
});

export default AllLoginsModal;
