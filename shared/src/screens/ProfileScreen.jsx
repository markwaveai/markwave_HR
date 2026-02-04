import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const ProfileScreen = ({ user }) => {
    if (!user) return null;

    const getFormattedID = (id) => {
        if (!id) return '----';
        const numId = parseInt(id);
        if (numId < 1000) {
            return `MWI${numId.toString().padStart(3, '0')}`;
        }
        return `MW${numId}`;
    };

    const getInitials = () => {
        return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    };

    const InfoRow = ({ icon, label, value }) => (
        <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
                <Icon name={icon} size={20} color="#636e72" />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value || '-'}</Text>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>{getInitials()}</Text>
                </View>
                <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
                <Text style={styles.role}>{user.role}</Text>
                <View style={styles.idTag}>
                    <Text style={styles.idText}>{getFormattedID(user.id)}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <View style={styles.card}>
                    <InfoRow icon="mail" label="Email" value={user.email} />
                    <View style={styles.divider} />
                    <InfoRow icon="phone" label="Mobile" value={user.contact} />
                    <View style={styles.divider} />
                    <InfoRow icon="map-pin" label="Location" value={user.location} />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Details</Text>
                <View style={styles.card}>
                    <InfoRow icon="credit-card" label="Aadhar Number" value={user.aadhar ? user.aadhar.toString().replace(/(\d{4})(?=\d)/g, "$1 ") : '-'} />
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#48327d',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#48327d',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    avatarTextLarge: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d3436',
        marginBottom: 4,
    },
    role: {
        fontSize: 16,
        color: '#636e72',
        marginBottom: 12,
    },
    idTag: {
        backgroundColor: '#f1f2f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    idText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#48327d',
    },
    section: {
        padding: 20,
        paddingBottom: 0,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#636e72',
        marginBottom: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f7fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    icon: {
        fontSize: 20,
    },
    infoContent: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: '#636e72',
        marginBottom: 2,
    },
    value: {
        fontSize: 16,
        color: '#2d3436',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f2f6',
        marginVertical: 16,
        marginLeft: 56, // Align with text
    },
});

export default ProfileScreen;



