import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Pressable,
    Image,
    Dimensions,
    Platform,
    Alert,
    Modal,
    TextInput,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    PermissionsAndroid
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { launchCamera, launchImageLibrary, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
import CircularProgress from '../components/CircularProgress';
import { attendanceApi, feedApi, leaveApi, adminApi } from '../services/api';
import EmployeeOverviewCard from '../components/EmployeeOverviewCard';
import HolidayModal from '../components/HolidayModal';
import RegularizeModal from '../components/RegularizeModal';
import ClockCard from '../components/ClockCard';
import {
    UsersIcon,
    EditIcon,
    TrashIcon,
    HeartIcon,
    MessageIcon,
    ImageIcon,
    CameraIcon,
    CloseIcon,
    ClockIcon,
    ChevronDownIcon
} from '../components/Icons';

import LeaveBalanceCard from '../components/LeaveBalanceCard';

const HomeScreen = ({ user }: { user: any }) => {
    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    // Debug: Log user data to check admin status
    console.log('User data:', JSON.stringify(user, null, 2));

    const [currentTime, setCurrentTime] = useState(new Date());
    const [isClockedIn, setIsClockedIn] = useState<boolean | null>(null);
    const [canClock, setCanClock] = useState(true);
    const [locationState, setLocationState] = useState<string | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [personalStats, setPersonalStats] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [isFeedLoading, setIsFeedLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [showHolidayCalendar, setShowHolidayCalendar] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostType, setNewPostType] = useState('Activity');
    const [commentingOn, setCommentingOn] = useState<number | null>(null);
    const [newComment, setNewComment] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [leaveBalance, setLeaveBalance] = useState<any>(null);
    const [disabledReason, setDisabledReason] = useState<string | null>(null);
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [isAbsenteesModalVisible, setIsAbsenteesModalVisible] = useState(false);
    const [holidayIndex, setHolidayIndex] = useState(0);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
    const [statsDuration, setStatsDuration] = useState<'week' | 'month'>('week');
    const [isRegularizeModalVisible, setIsRegularizeModalVisible] = useState(false);
    const [missedCheckoutDate, setMissedCheckoutDate] = useState<string | null>(null);

    const isAdmin = user?.is_admin === true ||
        ['Admin', 'Administrator', 'Project Manager', 'Advisor-Technology & Operations', 'Intern'].includes(user?.role);

    console.log('Is admin check:', isAdmin, 'Role:', user?.role, 'is_admin flag:', user?.is_admin);

    const fetchData = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setIsFeedLoading(true);

            const [statusData, statsData, postsData, balanceData, adminStatsData, holidayData, historyData, attHistoryData] = await Promise.all([
                attendanceApi.getStatus(user.id).catch(() => ({ status: 'OUT' })),
                attendanceApi.getPersonalStats(user.id).catch(() => null),
                feedApi.getPosts().catch(() => []),
                leaveApi.getBalance(user.id).catch(() => null),
                isAdmin ? adminApi.getDashboardStats().catch(() => null) : Promise.resolve(null),
                attendanceApi.getHolidays().catch(() => []),
                !isAdmin ? leaveApi.getLeaves(user.id).catch(() => []) : Promise.resolve([]),
                attendanceApi.getHistory(user.id).catch(() => [])
            ]);

            setIsClockedIn(statusData.status === 'IN');
            setCanClock(statusData.can_clock !== false);
            setDisabledReason(statusData.disabled_reason || null);
            setPersonalStats(statsData);
            setPosts(postsData || []);
            setLeaveBalance(balanceData);
            setDashboardStats(adminStatsData);
            setHolidays(holidayData || []);
            setLeaveHistory(historyData || []);

            // Check for missed checkout
            // We look for a past date with status 'Present' (or similar) but checkOut is missing or '-'
            // limit to last 7 days to avoid annoying old alerts
            const history = statusData.history || []; // Wait, getStatus doesn't return history. We added it to the Promise.all
            // The result array index 7 is history (index 6 was leaves) if I added it at end?
            // Wait, Promise.all returns array.
            // index 0: statusData
            // index 1: statsData
            // index 2: postsData
            // index 3: balanceData
            // index 4: adminStatsData
            // index 5: holidayData
            // index 6: historyData (Leaves)
            // I need to add index 7: attendanceHistory

            if (attHistoryData && Array.isArray(attHistoryData)) {
                const today = new Date().toISOString().split('T')[0];
                const missed = attHistoryData.find((log: any) => {
                    if (log.date === today) return false;
                    const hasIncomplete = log.logs?.some((session: any) => session.in && !session.out);
                    return hasIncomplete || (log.status === 'Present' && log.checkOut === '-');
                });
                if (missed) setMissedCheckoutDate(missed.date);
                else setMissedCheckoutDate(null);
            }

        } catch (error) {
            console.log("Failed to fetch dashboard data:", error);
        } finally {
            setIsFeedLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        fetchData(true);
    }, [user.id]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(), 30000);
        return () => clearInterval(interval);
    }, [user.id]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleToggleLike = async (postId: number) => {
        try {
            await feedApi.toggleLike(postId, user.id);
            fetchData();
        } catch (error) {
            console.log("Like failed:", error);
        }
    };

    const handleAddComment = async (postId: number) => {
        if (!newComment.trim()) return;
        try {
            await feedApi.addComment(postId, user.id, newComment);
            setNewComment('');
            setCommentingOn(null);
            fetchData();
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
            fetchData();
        } catch (error) {
            Alert.alert("Error", "Failed to create post. Please try again.");
        }
    };

    const handleDeletePost = async (postId: number) => {
        Alert.alert(
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
                            fetchData();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete post.");
                        }
                    }
                }
            ]
        );
    };

    const handleClockAction = async () => {
        setIsLoadingLocation(true);
        let finalLocation = "Mobile Check-in";

        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "Markwave HR needs access to your location to clock in.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    await new Promise<void>((resolve, reject) => {
                        Geolocation.getCurrentPosition(
                            (position) => {
                                const { latitude, longitude } = position.coords;
                                finalLocation = `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;
                                resolve();
                            },
                            (error) => {
                                console.log(error.code, error.message);
                                finalLocation = "Location Error (GPS)";
                                resolve(); // Proceed even if location fails, or reject if strict
                            },
                            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                        );
                    });
                } else {
                    finalLocation = "Location Permission Denied";
                }
            }
        } catch (err: any) {
            console.warn(err);
            finalLocation = `Error: ${err.message || 'Unknown'}`;
        }

        const nextType = isClockedIn ? 'OUT' : 'IN';

        try {
            await attendanceApi.clock({
                employee_id: user.id,
                location: finalLocation,
                type: nextType
            });
            fetchData();
            setLocationState(finalLocation);
        } catch (error) {
            Alert.alert('Error', 'Failed to update attendance');
        } finally {
            setIsLoadingLocation(false);
            setTimeout(() => setLocationState(null), 5000);
        }
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const upcomingHolidays = holidays.filter(h => {
        if (!h.raw_date) return false;
        const hDate = new Date(h.raw_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return hDate >= today;
    });

    return (
        <View style={{ flex: 1 }}>
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
                    <Text style={styles.greetingSubtitle}>You're doing great today.</Text>
                </View>

                {/* Clock Card */}
                <ClockCard
                    currentTime={currentTime}
                    isClockedIn={isClockedIn}
                    isLoadingLocation={isLoadingLocation}
                    locationState={locationState}
                    handleClockAction={handleClockAction}
                    canClock={canClock}
                    disabledReason={disabledReason}
                />

                {/* Dashboard Stats (Admin Only) */}
                {isAdmin && dashboardStats && (
                    <EmployeeOverviewCard
                        stats={dashboardStats}
                        onShowAbsentees={() => setIsAbsenteesModalVisible(true)}
                    />
                )}


                {/* Leave Balance Card - Only show for non-admin users OR specific roles */}
                {(!isAdmin || ['Intern', 'Project Manager'].includes(user?.role)) && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Leave Balance</Text>
                        </View>
                        <View style={styles.balanceGridContainer}>
                            {[
                                { key: 'cl', label: 'Casual', max: 12 },
                                { key: 'sl', label: 'Sick', max: 12 },
                                { key: 'el', label: 'Earned', max: 15 },
                                { key: 'scl', label: 'Special', max: 3 },
                                { key: 'bl', label: 'Bereavement', max: 5 },
                                { key: 'pl', label: 'Paternity', max: 3 },
                                { key: 'll', label: 'Long', max: 21 },
                                { key: 'co', label: 'Comp Off', max: 2 }
                            ].map(({ key, label, max }) => (
                                <View key={key} style={styles.chartItem}>
                                    <CircularProgress value={leaveBalance?.[key] || 0} total={max} color="#48327d" size={40} strokeWidth={3} />
                                    <Text style={styles.chartLabel}>{label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Avg Hours Card */}
                <View style={[styles.card, { zIndex: 5 }]}>
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ClockIcon color="#64748b" size={20} strokeWidth={2} />
                            <Text style={styles.cardTitle}>Avg. Working Hours</Text>
                        </View>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                            onPress={() => setStatsDuration(prev => prev === 'week' ? 'month' : 'week')}
                        >
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>
                                {statsDuration === 'week' ? 'This Week' : 'This Month'}
                            </Text>
                            <ChevronDownIcon color="#64748b" size={14} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#48327d', marginBottom: 4 }}>
                            {statsDuration === 'week'
                                ? (personalStats?.week?.me?.avg || '0h 00m')
                                : (personalStats?.month?.me?.avg || '0h 00m')
                            }
                        </Text>
                        {statsDuration === 'week' && (
                            <Text style={{ fontSize: 14, color: personalStats?.diff_status === 'up' ? '#10b981' : '#ef4444' }}>
                                {personalStats?.diff_label || '+0h 00m vs last week'}
                            </Text>
                        )}
                        {statsDuration === 'month' && (
                            <Text style={{ fontSize: 14, color: '#94a3b8' }}>
                                Current Month Average
                            </Text>
                        )}
                    </View>
                </View>

                {/* Holidays Card */}
                {upcomingHolidays.length > 0 && (
                    <View style={[styles.card, styles.holidayCard]}>
                        <View style={styles.holidayDecoration} pointerEvents="none" />

                        {/* Make entire header clickable */}
                        <Pressable
                            onPress={() => {
                                console.log('Holiday header pressed!');
                                setShowHolidayCalendar(true);
                            }}
                            style={({ pressed }) => [
                                styles.cardHeader,
                                pressed && { opacity: 0.7 }
                            ]}
                        >
                            <Text style={styles.cardTitle}>Holidays</Text>
                            <Text style={{ color: '#48327d', fontSize: 12, fontWeight: 'bold' }}>View All →</Text>
                        </Pressable>

                        <View style={styles.holidayContent}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.holidayName} numberOfLines={1} adjustsFontSizeToFit>
                                    {upcomingHolidays[holidayIndex]?.name || 'Holiday'}
                                </Text>
                                <View style={styles.holidayInfoRow}>
                                    <Text style={styles.holidayDate}>
                                        {upcomingHolidays[holidayIndex]?.date || 'Date'}
                                    </Text>
                                    <View style={styles.holidayTag}>
                                        <Text style={styles.holidayTagText}>
                                            {upcomingHolidays[holidayIndex]?.is_optional ? 'OPTIONAL' : 'PUBLIC'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.holidayNav}>
                                <TouchableOpacity
                                    onPress={() => setHolidayIndex(prev => Math.max(0, prev - 1))}
                                    disabled={holidayIndex === 0}
                                >
                                    <Text style={[styles.navArrow, holidayIndex === 0 && styles.disabledArrow]}>‹</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setHolidayIndex(prev => Math.min(upcomingHolidays.length - 1, prev + 1))}
                                    disabled={holidayIndex === upcomingHolidays.length - 1}
                                >
                                    <Text style={[styles.navArrow, holidayIndex === upcomingHolidays.length - 1 && styles.disabledArrow]}>›</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.feedHeader}>
                    <Text style={styles.feedTitle}>Community Wall ⚡</Text>
                </View>

                {/* Post Input Bar - Admin Only */}
                {user?.is_admin && (
                    <View style={styles.postBarCard}>
                        <View style={styles.postBarTop}>
                            <View style={styles.postBarAvatar}>
                                <Text style={styles.postBarAvatarText}>{user?.first_name?.[0].toUpperCase()}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.postBarInputPlaceholder}
                                onPress={() => setIsCreateModalVisible(true)}
                            >
                                <Text style={styles.postBarPlaceholderText}>Share an office activity or event...</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.postBarDivider} />
                        <View style={styles.postBarBottom}>
                            <View style={styles.postBarActions}>
                                <TouchableOpacity
                                    style={[styles.postBarLabelBtn, newPostType === 'Activity' && styles.postBarLabelBtnActive]}
                                    onPress={() => { setNewPostType('Activity'); setIsCreateModalVisible(true); }}
                                >
                                    <UsersIcon color={newPostType === 'Activity' ? 'white' : '#64748b'} size={14} style={{ marginRight: 4 }} />
                                    <Text style={[styles.postBarLabelText, newPostType === 'Activity' && styles.postBarLabelTextActive]}>Activity</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.postBarLabelBtn, newPostType === 'Event' && styles.postBarLabelBtnActive]}
                                    onPress={() => { setNewPostType('Event'); setIsCreateModalVisible(true); }}
                                >
                                    <EditIcon color={newPostType === 'Event' ? 'white' : '#64748b'} size={14} style={{ marginRight: 4 }} />
                                    <Text style={[styles.postBarLabelText, newPostType === 'Event' && styles.postBarLabelTextActive]}>Event</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.postBarLabelBtn} onPress={() => setIsCreateModalVisible(true)}>
                                    <ImageIcon color="#64748b" size={14} style={{ marginRight: 4 }} />
                                    <Text style={styles.postBarLabelText}>Photo</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={styles.postBarSubmitBtn} onPress={() => setIsCreateModalVisible(true)}>
                                <Text style={styles.postBarSubmitText}>Post</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

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
                                            <TouchableOpacity onPress={() => handleDeletePost(post.id)} style={{ padding: 5 }}>
                                                <TrashIcon color="#94a3b8" size={18} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text style={styles.postContent}>{post.content}</Text>
                                    {post.images && post.images.length > 0 && (
                                        <View style={post.images.length > 1 ? styles.imagesGrid : null}>
                                            {post.images.map((img: string, idx: number) => (
                                                <Image key={idx} source={{ uri: img }} style={[styles.postImage, post.images.length > 1 && styles.gridImage]} resizeMode="cover" />
                                            ))}
                                        </View>
                                    )}
                                    <View style={styles.postActions}>
                                        <TouchableOpacity style={styles.postActionBtn} onPress={() => handleToggleLike(post.id)}>
                                            <HeartIcon
                                                color={isLikedByMe ? '#ef4444' : '#64748b'}
                                                fill={isLikedByMe ? '#ef4444' : 'none'}
                                                size={18}
                                            />
                                            <Text style={[styles.actionText, isLikedByMe && { color: '#ef4444' }]}>{post.likes_count}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.postActionBtn} onPress={() => setCommentingOn(commentingOn === post.id ? null : post.id)}>
                                            <MessageIcon color="#64748b" size={18} />
                                            <Text style={styles.actionText}>{post.comments.length}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {commentingOn === post.id && (
                                        <View style={styles.commentSection}>
                                            {post.comments.map((c: any) => (
                                                <View key={c.id} style={styles.commentRow}>
                                                    <Text style={styles.commentAuthor}>{c.author}: </Text>
                                                    <Text style={styles.commentText}>{c.content}</Text>
                                                </View>
                                            ))}
                                            <View style={styles.commentInputRow}>
                                                <TextInput style={styles.commentInput} placeholder="Add a comment..." value={newComment} onChangeText={setNewComment} />
                                                <TouchableOpacity onPress={() => handleAddComment(post.id)} disabled={!newComment.trim()}>
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
                <Modal visible={isCreateModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>New Post</Text>
                                <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                                    <CloseIcon color="#94a3b8" size={20} />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.postInput}
                                placeholder="What's happening in the office?"
                                multiline
                                numberOfLines={4}
                                value={newPostContent}
                                onChangeText={setNewPostContent}
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
                                                <CloseIcon color="white" size={14} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}
                            <View style={styles.modalActionsRow}>
                                <TouchableOpacity
                                    style={styles.photoSelectBtn}
                                    onPress={() => {
                                        Alert.alert('Add Photo', 'Select Source', [
                                            { text: 'Camera', onPress: () => launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.5 }, r => r.assets?.[0].base64 && setSelectedImages([...selectedImages, `data:${r.assets[0].type};base64,${r.assets[0].base64}`])) },
                                            { text: 'Gallery', onPress: () => launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.5, selectionLimit: 3 }, r => r.assets && setSelectedImages([...selectedImages, ...r.assets.filter(a => a.base64).map(a => `data:${a.type};base64,${a.base64}`)])) },
                                            { text: 'Cancel', style: 'cancel' }
                                        ]);
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <CameraIcon color="#64748b" size={16} />
                                        <Text style={styles.photoSelectBtnText}>Add Photo</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.typeSelector}>
                                {['Activity', 'Event'].map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.typeBtn, newPostType === t && styles.typeBtnActive, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                                        onPress={() => setNewPostType(t)}
                                    >
                                        {t === 'Activity' ? (
                                            <UsersIcon color={newPostType === t ? 'white' : '#64748b'} size={16} />
                                        ) : (
                                            <EditIcon color={newPostType === t ? 'white' : '#64748b'} size={16} />
                                        )}
                                        <Text style={[styles.typeBtnText, newPostType === t && styles.typeBtnTextActive]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity style={[styles.publishBtn, !newPostContent.trim() && { opacity: 0.5 }]} onPress={handleCreatePost} disabled={!newPostContent.trim()}>
                                <Text style={styles.publishBtnText}>Publish Post</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>

            <HolidayModal
                visible={showHolidayCalendar}
                onClose={() => setShowHolidayCalendar(false)}
                holidays={holidays}
            />

            <RegularizeModal
                visible={isRegularizeModalVisible}
                onClose={() => setIsRegularizeModalVisible(false)}
                date={missedCheckoutDate || ''}
                employeeId={user.id}
                onSuccess={() => fetchData(true)}
            />

            {/* Absentees Modal */}
            <Modal animationType="slide" transparent={true} visible={isAbsenteesModalVisible} onRequestClose={() => setIsAbsenteesModalVisible(false)}>
                <View style={styles.absenteesModalOverlay}>
                    <View style={styles.absenteesModalContent}>
                        <View style={styles.absenteesModalHeader}>
                            <Text style={styles.absenteesModalTitle}>Today's Absentees</Text>
                            <TouchableOpacity onPress={() => setIsAbsenteesModalVisible(false)}><Text style={styles.absenteesCloseButtonText}>✕</Text></TouchableOpacity>
                        </View>
                        <FlatList
                            data={dashboardStats?.absentees || []}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.memberItem}>
                                    <View style={[styles.memberAvatar, { backgroundColor: '#48327d' }]}><Text style={[styles.memberAvatarText, { color: 'white' }]}>{item.name[0]}</Text></View>
                                    <View style={{ flex: 1 }}><Text style={styles.memberName}>{item.name}</Text><Text style={styles.memberRole}>{item.role || 'Employee'}</Text></View>
                                    <View style={[styles.statusTag, styles.statusTagAbsent]}><Text style={[styles.statusTagText, styles.statusTagTextAbsent]}>ABSENT</Text></View>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyStateText}>Everyone is present! 🎉</Text>}
                        />
                        <TouchableOpacity style={styles.doneButton} onPress={() => setIsAbsenteesModalVisible(false)}><Text style={styles.doneButtonText}>Close</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
    welcomeSection: { marginBottom: 20, marginTop: 20 },
    greetingTitle: { fontSize: 22, fontWeight: 'bold', color: '#2d3436' },
    greetingSubtitle: { fontSize: 13, color: '#636e72', marginTop: 4 },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20, elevation: 2, borderColor: '#e2e8f0', borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center', zIndex: 20 },
    cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#2d3436' },
    holidayCard: { position: 'relative', borderColor: '#f1f5f9' },
    viewAllLink: { fontSize: 14, fontWeight: '500', color: '#48327d', textDecorationLine: 'underline' },
    holidayContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
    holidayName: { fontSize: 28, fontWeight: 'bold', color: '#48327d', marginBottom: 8 },
    holidayInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    holidayDate: { fontSize: 12, fontWeight: '500', color: 'rgba(142, 120, 176, 0.8)' },
    holidayTag: { backgroundColor: '#48327d', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
    holidayTagText: { color: 'white', fontSize: 8, fontWeight: 'bold' },
    holidayNav: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingBottom: 5 },
    navArrow: { fontSize: 24, color: '#48327d', fontWeight: '300' },
    disabledArrow: { opacity: 0.3 },
    holidayDecoration: { position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, backgroundColor: 'rgba(142, 120, 176, 0.05)', borderRadius: 80, zIndex: 0 },
    balanceGridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10, gap: 12 },
    chartItem: { alignItems: 'center', width: '22%', marginBottom: 10 },
    chartLabel: { fontSize: 8, fontWeight: 'bold', color: '#2d3436', marginTop: 4, textAlign: 'center' },
    feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
    feedTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    addPostBtn: { backgroundColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    addPostBtnText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    emptyFeedText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 20, fontStyle: 'italic' },
    postCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
    postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    postAuthorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#48327d', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    postAuthorName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    postMeta: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
    postContent: { fontSize: 14, lineHeight: 20, color: '#475569', marginBottom: 16 },
    postActions: { flexDirection: 'row', gap: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    postActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionIcon: { fontSize: 16 },
    actionText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
    commentSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f8fafc' },
    commentRow: { flexDirection: 'row', marginBottom: 6 },
    commentAuthor: { fontSize: 11, fontWeight: '700', color: '#1e293b' },
    commentText: { fontSize: 11, color: '#475569', flex: 1 },
    commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
    commentInput: { flex: 1, fontSize: 12, color: '#1e293b' },
    sendBtn: { fontSize: 12, fontWeight: 'bold', color: '#6366f1' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: '60%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    closeBtn: { fontSize: 20, color: '#94a3b8' },
    postInput: { backgroundColor: '#f1f5f9', borderRadius: 16, padding: 16, fontSize: 15, color: '#1e293b', height: 120, textAlignVertical: 'top', marginBottom: 20 },
    typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 30 },
    typeBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9' },
    typeBtnActive: { backgroundColor: '#6366f1' },
    typeBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
    typeBtnTextActive: { color: 'white' },
    publishBtn: { backgroundColor: '#1e293b', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    publishBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    postImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
    imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    gridImage: { width: '48.5%', height: 120, marginBottom: 0 },
    previewScroll: { marginBottom: 20 },
    previewContainer: { position: 'relative', marginRight: 10 },
    imagePreview: { width: 100, height: 100, borderRadius: 12 },
    removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    removeImageText: { color: 'white', fontSize: 12 },
    modalActionsRow: { flexDirection: 'row', marginBottom: 20 },
    photoSelectBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    photoSelectBtnText: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
    statusTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
    statusTagAbsent: { backgroundColor: '#ffe5e5' },
    statusTagText: { fontSize: 12, fontWeight: 'bold' },
    statusTagTextAbsent: { color: '#ff7675' },
    absenteesModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    absenteesModalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%', minHeight: '50%' },
    absenteesModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    absenteesModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3436' },
    absenteesCloseButtonText: { fontSize: 24, color: '#b2bec3', fontWeight: 'bold' },
    memberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    memberAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    memberAvatarText: { fontSize: 16, fontWeight: 'bold' },
    memberName: { fontSize: 16, fontWeight: '600', color: '#2d3436' },
    memberRole: { fontSize: 12, color: '#636e72', marginTop: 2 },
    emptyStateText: { fontSize: 16, color: '#b2bec3', marginTop: 10, textAlign: 'center' },
    doneButton: { backgroundColor: '#48327d', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    doneButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    // Post Bar Card
    postBarCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    postBarTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    postBarAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#6366f11a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    postBarAvatarText: {
        color: '#6366f1',
        fontWeight: 'bold',
        fontSize: 14,
    },
    postBarInputPlaceholder: {
        flex: 1,
        paddingVertical: 8,
    },
    postBarPlaceholderText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    postBarDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 12,
    },
    postBarBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    postBarActions: {
        flexDirection: 'row',
        gap: 8,
    },
    postBarLabelBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
    },
    postBarLabelBtnActive: {
        backgroundColor: '#6366f1',
    },
    postBarLabelText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
    },
    postBarLabelTextActive: {
        color: 'white',
    },
    postBarSubmitBtn: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    postBarSubmitText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
    },
});

export default HomeScreen;
