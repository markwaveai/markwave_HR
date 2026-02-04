import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { getGeolocation, showAlert, requestCameraPermission } from '../utils/platform';
const Geolocation = getGeolocation();
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { CircularProgress as CircularProgress } from '../index';
import { attendanceApi, feedApi, leaveApi, adminApi } from '../services/api';
import { EmployeeOverviewCard as EmployeeOverviewCard } from '../index';

const HomeScreen = ({ user }) => {
    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isClockedIn, setIsClockedIn] = useState(null);
    const [locationState, setLocationState] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [personalStats, setPersonalStats] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isFeedLoading, setIsFeedLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // For Pull-to-Refresh
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostType, setNewPostType] = useState('Activity');
    const [commentingOn, setCommentingOn] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);
    const [leaveBalance, setLeaveBalance] = useState(null); // Added state for leave balance

    const [disabledReason, setDisabledReason] = useState(null); // Added state for leave/weekend status
    const [dashboardStats, setDashboardStats] = useState(null); // Added for Admin Dashboard Stats

    const isAdmin = user?.is_admin === true ||
        user?.role === 'Admin' ||
        user?.role === 'Administrator' ||
        user?.role === 'Project Manager' ||
        user?.role === 'Advisor-Technology & Operations';

    // Fetch Data Function
    const fetchData = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setIsFeedLoading(true);

            // Parallel fetch for speed
            const [statusData, statsData, postsData, balanceData, adminStatsData] = await Promise.all([
                attendanceApi.getStatus(user.id).catch(e => { console.log("Status fetch failed", e); return { status: 'OUT' }; }),
                attendanceApi.getPersonalStats(user.id).catch(e => { console.log("Stats fetch failed", e); return null; }),
                feedApi.getPosts().catch(e => { console.log("Posts fetch failed", e); return []; }),
                leaveApi.getBalance(user.id).catch(e => { console.log("Balance fetch failed", e); return null; }),
                isAdmin ? adminApi.getDashboardStats().catch(e => { console.log("Admin stats fetch failed", e); return null; }) : Promise.resolve(null)
            ]);

            setIsClockedIn(statusData.status === 'IN');
            setDisabledReason(statusData.disabled_reason || null);
            setPersonalStats(statsData);
            setPosts(postsData || []); // Ensure posts is always an array
            setLeaveBalance(balanceData);
            setDashboardStats(adminStatsData);
        } catch (error) {
            console.log("Failed to fetch dashboard data:", error);
        } finally {
            setIsFeedLoading(false);
            setRefreshing(false);
        }
    };

    // Pull-to-Refresh Handler
    const onRefresh = useCallback(() => {
        fetchData(true);
    }, [user.id]);

    // Initial Fetch & Auto-Polling (30s)
    useEffect(() => {
        fetchData(); // Initial load

        const interval = setInterval(() => {
            console.log("Auto-polling dashboard data...");
            fetchData();
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, [user.id]);

    /* ... existing handlers ... */

    const handleToggleLike = async (postId) => {
        try {
            await feedApi.toggleLike(postId, user.id);
            const postsData = await feedApi.getPosts();
            setPosts(postsData);
        } catch (error) {
            console.log("Like failed:", error);
        }
    };

    const handleAddComment = async (postId) => {
        if (!newComment.trim()) return;
        try {
            await feedApi.addComment(postId, user.id, newComment);
            setNewComment('');
            setCommentingOn(null);
            const postsData = await feedApi.getPosts();
            setPosts(postsData);
        } catch (error) {
            console.log("Comment failed:", error);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && selectedImages.length === 0) return;
        try {
            await feedApi.createPost({
                author_id: user.id,
                content: newPostContent,
                images: selectedImages,
                type: newPostType
            });
            setNewPostContent('');
            setSelectedImages([]);
            setIsCreateModalVisible(false);
            const postsData = await feedApi.getPosts();
            setPosts(postsData);
        } catch (error) {
            showAlert("Error", "Failed to create post. Only admins can post.");
        }
    };

    const handleDeletePost = async (postId) => {
        showAlert(
            "Delete Post",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await feedApi.deletePost(postId);
                            const postsData = await feedApi.getPosts();
                            setPosts(postsData);
                        } catch (error) {
                            showAlert("Error", "Failed to delete post.");
                        }
                    }
                }
            ]
        );
    };

    // Removed standalone useEffect(fetchData, []) since it's merged above

    // Holidays State
    const [holidayIndex, setHolidayIndex] = useState(0);
    const holidays = [
        { name: 'BHOGI', date: 'Wed, 14 January, 2026', type: 'Floater Leave' },
        { name: 'PONGAL', date: 'Thu, 15 January, 2026', type: 'Public Holiday' }
    ];

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleClockAction = () => {
        setIsLoadingLocation(true);
        Geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                let finalLocation = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                        { headers: { 'User-Agent': 'Markwave-Mobile-App' } }
                    );
                    const data = await response.json();

                    if (data && data.address) {
                        const addr = data.address;
                        const buildingTags = [
                            addr.building, addr.commercial, addr.office, addr.amenity,
                            addr.house_name, addr.house_number, addr.office, addr.landmark, addr.tourism,
                            addr.shop, addr.retail, addr.university, addr.hospital,
                            addr.hotel, addr.industrial, addr.theatre, addr.place_of_worship
                        ];

                        let buildingName = buildingTags.find(Boolean) || '';
                        if (!buildingName && data.display_name) {
                            const primaryName = data.display_name.split(',')[0].trim();
                            const road = addr.road || addr.pedestrian || '';
                            if (primaryName && road && !road.includes(primaryName) && !primaryName.includes(road)) {
                                buildingName = primaryName;
                            }
                        }

                        const roadDetail = addr.road || addr.pedestrian || '';
                        const areaDetail = addr.neighbourhood || addr.suburb || addr.city_district || '';
                        const cityDetail = addr.city || addr.town || addr.village || '';

                        const displayAddr = [
                            buildingName,
                            roadDetail,
                            areaDetail,
                            cityDetail
                        ].filter(Boolean).join(', ');

                        if (displayAddr) {
                            finalLocation = displayAddr;
                        } else if (data.display_name) {
                            finalLocation = data.display_name.split(',').slice(0, 3).join(',');
                        }
                    }
                } catch (geoError) {
                    console.log("Reverse geocoding failed, using coordinates:", geoError);
                }

                try {
                    const nextType = isClockedIn ? 'OUT' : 'IN';
                    await attendanceApi.clock({
                        employee_id: user.id,
                        location: finalLocation,
                        type: nextType
                    });

                    // Force immediate refresh
                    fetchData();
                    setLocationState(finalLocation);
                } catch (error) {
                    showAlert('Error', 'Failed to update attendance');
                } finally {
                    setIsLoadingLocation(false);
                    setTimeout(() => setLocationState(null), 5000);
                }
            },
            (error) => {
                showAlert('Error', 'Failed to get location');
                setIsLoadingLocation(false);
            },
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 }
        );
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
            }
        >
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
                <Text style={styles.greetingTitle}>{getGreeting()}, {user?.first_name || 'Markwave'} {user?.last_name || ''}!</Text>
                <Text style={styles.greetingSubtitle}>Here's what's happening with your attendance today</Text>
            </View>

            {/* Clock Card */}
            <View style={styles.clockCard}>
                <View style={styles.clockHeader}>
                    <Text style={styles.dateText}>
                        Time Today - {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                    {disabledReason && (
                        <View style={styles.leaveBadge}>
                            <Text style={styles.leaveBadgeText}>{disabledReason.toUpperCase()}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.clockBody}>
                    <View>
                        <Text style={styles.currentTimeLabel}>CURRENT TIME</Text>
                        <View style={styles.timeContainer}>
                            <Text style={styles.bigTime}>
                                {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                            </Text>
                            <Text style={styles.seconds}>:{currentTime.getSeconds().toString().padStart(2, '0')}</Text>
                            <Text style={styles.ampm}>{currentTime.getHours() >= 12 ? 'PM' : 'AM'}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.webClockBtn, (disabledReason || isLoadingLocation) && styles.webClockBtnDisabled]}
                        onPress={handleClockAction}
                        disabled={!!disabledReason || isLoadingLocation}
                    >
                        <Text style={styles.webClockBtnText}>
                            {isLoadingLocation ? 'Locating...' : (isClockedIn ? 'Web Clock-Out' : 'Web Clock-In')}
                        </Text>
                    </TouchableOpacity>
                </View>
                {locationState && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                        <Icon name="map-pin" size={14} color="#637381" />
                        <Text style={[styles.locationText, { marginLeft: 4, marginTop: 0 }]}>{locationState}</Text>
                    </View>
                )}
            </View>

            {/* Employee Overview Card (Admin Only) */}
            {isAdmin && (
                <EmployeeOverviewCard
                    stats={dashboardStats}
                    onShowAbsentees={() => showAlert("Coming Soon", "Absentees list view is coming soon!")}
                />
            )}

            {/* Leave Balance Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Leave Balance</Text>
                </View>
                <View style={styles.balanceRow}>
                    {/* Total Leaves */}
                    <View style={styles.chartContainer}>
                        <CircularProgress value={leaveBalance?.total || 0} total={29} color="#48327d" />
                        <Text style={styles.chartLabel}>Total Leaves</Text>
                    </View>
                    {/* Casual Leaves */}
                    <View style={styles.chartContainer}>
                        <CircularProgress value={leaveBalance?.cl || 0} total={6} color="#48327d" />
                        <Text style={styles.chartLabel}>Casual Leaves</Text>
                    </View>
                    {/* Sick Leaves */}
                    <View style={styles.chartContainer}>
                        <CircularProgress value={leaveBalance?.sl || 0} total={6} color="#48327d" />
                        <Text style={styles.chartLabel}>Sick Leaves</Text>
                    </View>
                    {/* Earned Leaves */}
                    <View style={styles.chartContainer}>
                        <CircularProgress value={leaveBalance?.el || 0} total={17} color="#48327d" />
                        <Text style={styles.chartLabel}>Earned Leaves</Text>
                    </View>
                </View>
            </View>

            {/* Avg Hours Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Average Hours</Text>
                </View>
                <View style={{ alignItems: 'center', padding: 20 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#48327d' }}>
                        {personalStats?.avg_working_hours || '0h 00m'}
                    </Text>
                    <Text style={{ fontSize: 12, color: personalStats?.diff_status === 'up' ? '#00b894' : '#ff7675' }}>
                        {personalStats?.diff_label || 'Same  week'}
                    </Text>
                </View>
            </View>

            {/* Community Wall Section */}
            <View style={styles.feedHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.feedTitle}>Community Wall</Text>
                    <Icon name="zap" size={18} color="#f59e0b" style={{ marginLeft: 6 }} />
                </View>
                {isAdmin && (
                    <TouchableOpacity
                        style={styles.addPostBtn}
                        onPress={() => setIsCreateModalVisible(true)}
                    >
                        <Text style={styles.addPostBtnText}>+ Post</Text>
                    </TouchableOpacity>
                )}
            </View>

            {isFeedLoading ? (
                <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 20 }} />
            ) : posts.length === 0 ? (
                <Text style={styles.emptyFeedText}>No office activities to show yet.</Text>
            ) : (
                <View style={{ gap: 16, marginBottom: 40 }}>
                    {posts.map(post => {
                        const isLikedByMe = post.likes.includes(user.id);
                        return (
                            <View key={post.id} style={styles.postCard}>
                                <View style={styles.postHeader}>
                                    <View style={styles.postAuthorAvatar}>
                                        <Text style={styles.avatarText}>{post.author?.[0]}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.postAuthorName}>{post.author}</Text>
                                        <Text style={styles.postMeta}>
                                            {new Date(post.created_at).toLocaleDateString()} · {post.type}
                                        </Text>
                                    </View>
                                    {isAdmin && (
                                        <TouchableOpacity
                                            onPress={() => handleDeletePost(post.id)}
                                            style={{ padding: 5 }}
                                        >
                                            <Icon name="x" size={16} color="#94a3b8" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Text style={styles.postContent}>{post.content}</Text>

                                {post.images && post.images.length > 0 && (
                                    <View style={post.images.length > 1 ? styles.imagesGrid : null}>
                                        {post.images.map((img, idx) => (
                                            <Image
                                                key={idx}
                                                source={{ uri: img }}
                                                style={[styles.postImage, post.images.length > 1 && styles.gridImage]}
                                                resizeMode="cover"
                                            />
                                        ))}
                                    </View>
                                )}

                                <View style={styles.postActions}>
                                    <TouchableOpacity
                                        style={styles.postActionBtn}
                                        onPress={() => handleToggleLike(post.id)}
                                    >
                                        <Icon
                                            name="heart"
                                            size={18}
                                            color={isLikedByMe ? '#ef4444' : '#94a3b8'}
                                            fill={isLikedByMe ? '#ef4444' : 'none'}
                                        />
                                        <Text style={[styles.actionText, isLikedByMe && { color: '#ef4444' }]}>
                                            {post.likes_count}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.postActionBtn}
                                        onPress={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                                    >
                                        <Icon name="message-square" size={18} color="#94a3b8" />
                                        <Text style={styles.actionText}>{post.comments.length}</Text>
                                    </TouchableOpacity>
                                </View>

                                {commentingOn === post.id && (
                                    <View style={styles.commentSection}>
                                        {post.comments.map((c) => (
                                            <View key={c.id} style={styles.commentRow}>
                                                <Text style={styles.commentAuthor}>{c.author}: </Text>
                                                <Text style={styles.commentText}>{c.content}</Text>
                                            </View>
                                        ))}
                                        <View style={styles.commentInputRow}>
                                            <TextInput
                                                style={styles.commentInput}
                                                placeholder="Add a comment..."
                                                value={newComment}
                                                onChangeText={setNewComment}
                                                underlineColorAndroid="transparent"
                                            />
                                            <TouchableOpacity
                                                onPress={() => handleAddComment(post.id)}
                                                disabled={!newComment.trim()}
                                            >
                                                <Text style={[styles.sendBtn, !newComment.trim() && { opacity: 0.3 }]}>Send</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Create Post Modal */}
            <Modal
                visible={isCreateModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Post</Text>
                            <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                                <Icon name="x" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.postInput}
                            placeholder="What's happening in the office?"
                            multiline
                            numberOfLines={4}
                            value={newPostContent}
                            onChangeText={setNewPostContent}
                            underlineColorAndroid="transparent"
                        />

                        {selectedImages.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                                {selectedImages.map((img, idx) => (
                                    <View key={idx} style={styles.previewContainer}>
                                        <Image source={{ uri: img }} style={styles.imagePreview} />
                                        <TouchableOpacity
                                            style={styles.removeImageBtn}
                                            onPress={() => {
                                                const newImages = [...selectedImages];
                                                newImages.splice(idx, 1);
                                                setSelectedImages(newImages);
                                            }}
                                        >
                                            <Icon name="x" size={14} color="#ffffff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.modalActionsRow}>
                            <TouchableOpacity
                                style={styles.photoSelectBtn}
                                onPress={() => {
                                    Alert.alert(
                                        'Add Photo',
                                        'Choose an option',
                                        [
                                            {
                                                text: 'Camera',
                                                onPress: async () => {
                                                    const hasPermission = await requestCameraPermission();
                                                    if (!hasPermission) {
                                                        Alert.alert('Permission denied', 'Camera permission is required');
                                                        return;
                                                    }
                                                    const options = {
                                                        mediaType: 'photo',
                                                        includeBase64: true,
                                                        quality: 0.5,
                                                    };
                                                    launchCamera(options, (response) => {
                                                        if (response.didCancel) return;
                                                        if (response.errorMessage) {
                                                            Alert.alert('Error', response.errorMessage);
                                                            return;
                                                        }
                                                        if (response.assets && response.assets[0].base64) {
                                                            const base64Img = `data:${response.assets[0].type};base64,${response.assets[0].base64}`;
                                                            setSelectedImages([...selectedImages, base64Img]);
                                                        }
                                                    });
                                                }
                                            },
                                            {
                                                text: 'Gallery',
                                                onPress: async () => {
                                                    const options = {
                                                        mediaType: 'photo',
                                                        includeBase64: true,
                                                        quality: 0.5,
                                                        selectionLimit: 3
                                                    };
                                                    launchImageLibrary(options, (response) => {
                                                        if (response.didCancel) return;
                                                        if (response.errorMessage) {
                                                            Alert.alert('Error', response.errorMessage);
                                                            return;
                                                        }
                                                        if (response.assets) {
                                                            const newImages = response.assets
                                                                .filter(asset => asset.base64)
                                                                .map(asset => `data:${asset.type};base64,${asset.base64}`);
                                                            setSelectedImages([...selectedImages, ...newImages]);
                                                        }
                                                    });
                                                }
                                            },
                                            { text: 'Cancel', style: 'cancel' }
                                        ]
                                    );
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon name="camera" size={18} color="#48327d" />
                                    <Text style={[styles.photoSelectBtnText, { marginLeft: 8 }]}>Add Photo</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeBtn, newPostType === 'Activity' && styles.typeBtnActive]}
                                onPress={() => setNewPostType('Activity')}
                            >
                                <Text style={[styles.typeBtnText, newPostType === 'Activity' && styles.typeBtnTextActive]}>Activity</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, newPostType === 'Event' && styles.typeBtnActive, newPostType === 'Event' && { backgroundColor: '#f59e0b' }]}
                                onPress={() => setNewPostType('Event')}
                            >
                                <Text style={[styles.typeBtnText, newPostType === 'Event' && styles.typeBtnTextActive]}>Event</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.publishBtn, !newPostContent.trim() && { opacity: 0.5 }]}
                            onPress={handleCreatePost}
                            disabled={!newPostContent.trim()}
                        >
                            <Text style={styles.publishBtnText}>Publish Post</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        padding: 20,
    },
    welcomeSection: {
        marginBottom: 20,
        marginTop: 20,
    },
    greetingTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2d3436',
    },
    greetingSubtitle: {
        fontSize: 13,
        color: '#636e72',
        marginTop: 4,
    },
    // Clock Card Styles
    clockCard: {
        backgroundColor: '#8e78b0',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    clockHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        opacity: 0.9,
    },
    leaveBadge: {
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    leaveBadgeText: {
        color: '#8e78b0',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    dateText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    clockBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    currentTimeLabel: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        opacity: 0.8,
        marginBottom: 4,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    bigTime: {
        color: 'white',
        fontSize: 32,
        fontWeight: '300',
    },
    seconds: {
        color: 'white',
        fontSize: 14,
        marginHorizontal: 2,
        opacity: 0.8,
    },
    ampm: {
        color: 'white',
        fontSize: 18,
        fontWeight: '400',
    },
    webClockBtn: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    webClockBtnDisabled: {
        opacity: 0.5,
    },
    webClockBtnText: {
        color: '#8e78b0',
        fontWeight: 'bold',
        fontSize: 13,
    },
    locationText: {
        color: 'white',
        fontSize: 10,
        marginTop: 10,
        opacity: 0.8,
    },
    // Generic Card
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderColor: '#e2e8f0',
        borderWidth: 1, // Added border matching Web
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2d3436',
    },
    // Holiday Card Specifics
    holidayCard: {
        position: 'relative',
        overflow: 'hidden',
        borderColor: '#f1f5f9', // slate-100 equivalent
    },
    viewAllLink: {
        fontSize: 14,
        fontWeight: '500',
        color: '#48327d',
        textDecorationLine: 'underline',
    },
    holidayContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    holidayName: {
        fontSize: 28, // Matches text-4xl roughly scaling
        fontWeight: 'bold',
        color: '#48327d',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    holidayInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    holidayDate: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(142, 120, 176, 0.8)',
    },
    holidayTag: {
        backgroundColor: '#48327d',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    holidayTagText: {
        color: 'white',
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    holidayNav: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        paddingBottom: 5,
    },
    navArrow: {
        fontSize: 24,
        color: '#48327d',
        fontWeight: '300',
    },
    disabledArrow: {
        opacity: 0.3,
    },
    holidayDecoration: {
        position: 'absolute',
        bottom: -40,
        right: -40,
        width: 160,
        height: 160,
        backgroundColor: 'rgba(142, 120, 176, 0.05)',
        borderRadius: 80,
        zIndex: 0,
    },

    // Leave Balance Charts
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    chartContainer: {
        alignItems: 'center',
        gap: 8,
    },
    circleChart: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#48327d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2d3436',
    },
    chartLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2d3436',
    },

    // Feed Styles
    feedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 10,
    },
    feedTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
    },
    addPostBtn: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    addPostBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyFeedText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 13,
        marginTop: 20,
        fontStyle: 'italic',
    },
    postCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    postAuthorAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#48327d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    postAuthorName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    postMeta: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 2,
    },
    postContent: {
        fontSize: 14,
        lineHeight: 20,
        color: '#475569',
        marginBottom: 16,
    },
    postActions: {
        flexDirection: 'row',
        gap: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 12,
    },
    postActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionIcon: {
        fontSize: 16,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
    },
    commentSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
    },
    commentRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    commentAuthor: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1e293b',
    },
    commentText: {
        fontSize: 11,
        color: '#475569',
        flex: 1,
    },
    commentInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    commentInput: {
        flex: 1,
        fontSize: 12,
        color: '#1e293b',
        padding: 0,
        outlineStyle: 'none',
    },
    sendBtn: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6366f1',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1e293b',
    },
    closeBtn: {
        fontSize: 20,
        color: '#94a3b8',
    },
    postInput: {
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        color: '#1e293b',
        height: 120,
        textAlignVertical: 'top',
        marginBottom: 20,
        outlineStyle: 'none',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
    },
    typeBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    typeBtnActive: {
        backgroundColor: '#6366f1',
    },
    typeBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    typeBtnTextActive: {
        color: 'white',
    },
    publishBtn: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    publishBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 12,
    },
    imagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    gridImage: {
        width: '48.5%',
        height: 120,
        marginBottom: 0,
    },
    previewScroll: {
        marginBottom: 20,
    },
    previewContainer: {
        position: 'relative',
        marginRight: 10,
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    removeImageBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeImageText: {
        color: 'white',
        fontSize: 12,
    },
    modalActionsRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    photoSelectBtn: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    photoSelectBtnText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: 'bold',
    },
});

export default HomeScreen;



