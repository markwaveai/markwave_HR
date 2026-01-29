import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
    Platform
} from 'react-native';
import { teamApi } from '../services/api';

interface MyTeamScreenProps {
    user: any;
}

const MyTeamScreen: React.FC<MyTeamScreenProps> = ({ user }) => {
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTeamData();
    }, [user]);

    const fetchTeamData = async () => {
        try {
            const teamId = user?.team_id;
            const [membersData, statsData] = await Promise.all([
                teamApi.getMembers(teamId),
                teamApi.getStats(teamId)
            ]);

            setTeamMembers(membersData);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to fetch team data:", error);
            Alert.alert("Error", "Could not load team data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = teamMembers.filter(member =>
        (member.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (member.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.titleRow}>
                <View style={styles.titleContent}>
                    <Text style={styles.pageTitle}>My Team</Text>
                    <Text style={styles.pageSubtitle}>Manage and view your team members</Text>
                </View>
                <TouchableOpacity style={styles.addButton}>
                    <Text style={styles.addButtonText}>Add Member</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search members..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholderTextColor="#94a3b8"
                />
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Members</Text>
                    <Text style={[styles.statValue, { color: '#1e293b' }]}>{stats?.total || 0}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Active Now</Text>
                    <View style={styles.activeRow}>
                        <Text style={[styles.statValue, { color: '#10b981' }]}>{stats?.active || 0}</Text>
                        <Text style={styles.onlineBadge}>Online</Text>
                    </View>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>On Leave</Text>
                    <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats?.onLeave || 0}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Remote</Text>
                    <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats?.remote || 0}</Text>
                </View>
            </View>
        </View>
    );

    const renderMemberCard = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
                <View style={styles.memberInfo}>
                    <Text style={styles.memberName} numberOfLines={1} ellipsizeMode="tail">
                        {item.name}
                    </Text>
                    <Text style={styles.memberRole} numberOfLines={1} ellipsizeMode="tail">
                        {item.role}
                    </Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                    <Text style={styles.moreButtonText}>⋮</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardDetailsRow}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>STATUS</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: item.status === 'Active' ? '#10b981' : '#f59e0b' }]} />
                        <Text style={styles.detailValue}>{item.status}</Text>
                    </View>
                </View>
                <View style={[styles.detailItem, { flex: 1.5 }]}>
                    <Text style={styles.detailLabel}>LOCATION</Text>
                    <View style={styles.statusRow}>
                        <Text style={{ fontSize: 10 }}>📍</Text>
                        <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                            {item.location || 'Not Specified'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="middle">
                    ✉️ {item.email || 'No email provided'}
                </Text>
                <TouchableOpacity style={styles.viewProfileBtn}>
                    <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={{ marginTop: 10, color: '#64748b', fontWeight: '500' }}>Syncing team...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={filteredMembers}
                keyExtractor={item => item.id.toString()}
                renderItem={renderMemberCard}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100, // Space for tab bar
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    headerContainer: {
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleContent: {
        flex: 1,
        paddingRight: 10,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    addButton: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
        fontSize: 14,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
    },
    // Stats
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    statCard: {
        width: '48%',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 1,
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
    },
    activeRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
    },
    onlineBadge: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#10b981',
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
        marginBottom: 4,
    },
    // Member Card
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    memberInfo: {
        flex: 1,
        paddingRight: 12,
    },
    memberName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        letterSpacing: -0.3,
    },
    memberRole: {
        fontSize: 12,
        color: '#6366f1',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 4,
    },
    moreButton: {
        padding: 4,
        marginTop: -4,
    },
    moreButtonText: {
        fontSize: 20,
        color: '#94a3b8',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 16,
    },
    cardDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1,
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
    },
    cardFooter: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    emailText: {
        flex: 1,
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    viewProfileBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#eff6ff',
    },
    viewProfileText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#3b82f6',
        textTransform: 'uppercase',
    }
});

export default MyTeamScreen;
