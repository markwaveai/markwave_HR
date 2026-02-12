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
    SearchIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarIcon,
    PartyPopperIcon,
    ZapIcon,
} from '../components/Icons';

import LeaveBalanceCard from '../components/LeaveBalanceCard';

const HomeScreen = ({ user, setActiveTabToSettings }: { user: any; setActiveTabToSettings: (u: any) => void }) => {
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
    const [isFeedLoading, setIsFeedLoading] = useState(false);
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
    const [absenteeSearch, setAbsenteeSearch] = useState('');
    const [absenteeFilter, setAbsenteeFilter] = useState('All Status');
    const [isStatusDropdownVisible, setIsStatusDropdownVisible] = useState(false);
    const [apiErrors, setApiErrors] = useState<{ [key: string]: string }>({});

    const isAdmin = user?.is_admin === true ||
        ['Admin', 'Administrator', 'Project Manager', 'Advisor-Technology & Operations'].includes(user?.role);

    console.log('Is admin check:', isAdmin, 'Role:', user?.role, 'is_admin flag:', user?.is_admin);

    const fetchDashboardData = async () => {
        try {
            const errors: { [key: string]: string } = {};
            const [statusData, statsData, balanceData, adminStatsData, holidayData, historyData, attHistoryData] = await Promise.all([
                attendanceApi.getStatus(user.id).catch((err) => {
                    console.error('❌ Status API Error:', err);
                    errors.status = err.message || 'Failed to load status';
                    return { status: 'OUT' };
                }),
                attendanceApi.getPersonalStats(user.id).catch((err) => {
                    console.error('❌ Stats API Error:', err);
                    errors.stats = err.message || 'Failed to load stats';
                    return null;
                }),
                leaveApi.getBalance(user.id).catch((err) => {
                    console.error('❌ Balance API Error:', err);
                    errors.balance = err.message || 'Failed to load leave balance';
                    Alert.alert('Error Loading Leave Balance', err.message || 'Could not fetch leave balance. Please check your connection.');
                    return null;
                }),
                adminApi.getDashboardStats().catch((err) => {
                    console.error('❌ Admin Stats API Error:', err);
                    errors.adminStats = err.message || 'Failed to load admin stats';
                    return null;
                }),
                attendanceApi.getHolidays().catch((err) => {
                    console.error('❌ Holidays API Error:', err);
                    errors.holidays = err.message || 'Failed to load holidays';
                    Alert.alert('Error Loading Holidays', err.message || 'Could not fetch holidays. Please check your connection.');
                    return [];
                }),
                !isAdmin ? leaveApi.getLeaves(user.id).catch((err) => {
                    console.error('❌ Leaves API Error:', err);
                    errors.leaves = err.message || 'Failed to load leave history';
                    return [];
                }) : Promise.resolve([]),
                attendanceApi.getHistory(user.id).catch((err) => {
                    console.error('❌ History API Error:', err);
                    errors.history = err.message || 'Failed to load attendance history';
                    return [];
                })
            ]);

            setApiErrors(errors);


            setIsClockedIn(statusData.status === 'IN');
            setCanClock(statusData.can_clock !== false);
            setDisabledReason(statusData.disabled_reason || null);
            console.log('Personal Stats Data:', JSON.stringify(statsData, null, 2));
            console.log('Leave Balance Data:', JSON.stringify(balanceData, null, 2));
            console.log('Holidays Data:', holidayData);
            setPersonalStats(statsData);
            setLeaveBalance(balanceData);
            setDashboardStats(adminStatsData);
            setHolidays(holidayData || []);
            setLeaveHistory(historyData || []);

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
        }
    };

    const fetchFeedData = async () => {
        try {
            setIsFeedLoading(true);
            const postsData = await feedApi.getPosts().catch(() => []);
            setPosts(postsData || []);
        } catch (error) {
            console.log("Failed to fetch feed:", error);
        } finally {
            setIsFeedLoading(false);
        }
    };

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);

        // Fetch critical data first, don't wait for feed if not refreshing
        await fetchDashboardData();

        // Then fetch feed
        fetchFeedData();

        if (isRefresh) setRefreshing(false);
    };

    const onRefresh = useCallback(() => {
        fetchData(true);
    }, [user.id]);

    const updateLocation = async () => {
        setIsLoadingLocation(true);
        try {
            let hasPermission = false;
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
            } else {
                hasPermission = true; // For iOS, handled via Info.plist usually
            }

            if (hasPermission) {
                await new Promise<void>((resolve) => {
                    Geolocation.getCurrentPosition(
                        async (position) => {
                            const { latitude, longitude } = position.coords;
                            try {
                                const data = await attendanceApi.resolveLocation(latitude, longitude);
                                if (data && data.address) {
                                    setLocationState(`${data.address} (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
                                } else {
                                    setLocationState(`Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`);
                                }
                            } catch (e) {
                                setLocationState(`Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`);
                            }
                            resolve();
                        },
                        (error) => {
                            console.log(error.code, error.message);
                            setLocationState("Location Error");
                            resolve();
                        },
                        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                    );
                });
            } else {
                setLocationState("Location Permission Denied");
            }
        } catch (err) {
            console.warn(err);
        } finally {
            setIsLoadingLocation(false);
        }
    };

    useEffect(() => {
        fetchData();
        updateLocation();
        const interval = setInterval(() => fetchData(), 30000);
        return () => clearInterval(interval);
    }, [user.id]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleToggleLike = async (postId: number) => {
        const userId = user.employee_id || user.id;
        if (!userId) return;

        // Optimistic UI update
        const previousPosts = [...posts];
        setPosts(currentPosts => currentPosts.map(p => {
            if (p.id === postId) {
                const isLiked = p.likes && Array.isArray(p.likes) &&
                    p.likes.map((id: any) => String(id)).includes(String(userId));

                const newLikes = isLiked
                    ? p.likes.filter((id: any) => String(id) !== String(userId))
                    : [...(p.likes || []), userId];

                return {
                    ...p,
                    likes: newLikes,
                    likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1
                };
            }
            return p;
        }));

        try {
            await feedApi.toggleLike(postId, userId);
            // Optionally fetch fresh data, but optimistic update handles immediate feedback
            // fetchFeedData(); 
        } catch (error) {
            console.log("Like failed:", error);
            setPosts(previousPosts); // Revert on failure
        }
    };

    const handleAddComment = async (postId: number) => {
        if (!newComment.trim()) return;
        try {
            await feedApi.addComment(postId, user.id, newComment);
            setNewComment('');
            setCommentingOn(null);
            fetchFeedData();
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
            fetchFeedData();
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
                            fetchFeedData();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete post.");
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteComment = async (postId: number, commentId: number) => {
        const userId = user.employee_id || user.id;
        Alert.alert(
            "Delete Comment",
            "Are you sure you want to delete this comment?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await feedApi.deleteComment(postId, commentId, userId);
                            fetchFeedData();
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to delete comment.");
                        }
                    }
                }
            ]
        );
    };

    const handleClockAction = async () => {
        if (!locationState || locationState.includes('Error') || locationState.includes('Denied')) {
            await updateLocation();
        }

        // Check again after update attempt
        if (!locationState || locationState.includes('Error') || locationState.includes('Denied')) {
            Alert.alert('Location Required', 'Please enable GPS and grant permission to clock in/out.');
            return;
        }

        setIsLoadingLocation(true);
        const nextType = isClockedIn ? 'OUT' : 'IN';

        try {
            await attendanceApi.clock({
                employee_id: user.id,
                location: locationState,
                type: nextType
            });
            fetchDashboardData();
            // Don't clear locationState, let it stay visible on the card
        } catch (error) {
            Alert.alert('Error', 'Failed to update attendance');
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };


    const upcomingHolidays = holidays.filter(h => {
        if (!h.date) return false;
        const hDate = new Date(h.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return hDate >= today;
    });

    console.log('Is Admin:', isAdmin);
    console.log('Holidays count:', holidays.length);
    console.log('Upcoming Holidays count:', upcomingHolidays.length);
    console.log('Leave Balance:', leaveBalance);
    console.log('Dashboard Stats:', dashboardStats);

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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={styles.greetingTitle}>{getGreeting()}, {user?.first_name || 'Markwave'} {user?.last_name || ''}!</Text>
                            <Text style={styles.greetingSubtitle}>You're doing great today.</Text>
                        </View>
                    </View>
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

                {/* Dashboard Stats - Employee Overview */}
                {dashboardStats && (
                    <EmployeeOverviewCard
                        stats={dashboardStats}
                        onShowAbsentees={() => setIsAbsenteesModalVisible(true)}
                    />
                )}


                {/* Leave Balance Card - Only show for non-admin users */}
                {!isAdmin && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <CalendarIcon color="#64748b" size={20} strokeWidth={2} />
                                <Text style={styles.cardTitle}>Leave Balance</Text>
                            </View>
                        </View>
                        {apiErrors.balance ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#ef4444', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>❌ {apiErrors.balance}</Text>
                                <TouchableOpacity onPress={() => fetchDashboardData()} style={{ backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                                    <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : leaveBalance ? (
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
                                        <CircularProgress value={leaveBalance?.[key] || 0} total={max} color="#48327d" size={46} strokeWidth={3} />
                                        <Text style={styles.chartLabel}>{label}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color="#6366f1" />
                                <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>Loading leave balance...</Text>
                            </View>
                        )}
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
                            style={{ padding: 4 }}
                            onPress={() => setStatsDuration(prev => prev === 'week' ? 'month' : 'week')}
                        >
                            <ClockIcon color="#48327d" size={24} strokeWidth={2} />
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
                            <Text style={{ fontSize: 14, color: personalStats?.lastWeekDiff?.startsWith('+') ? '#10b981' : '#ef4444' }}>
                                {personalStats?.lastWeekDiff || '+0h 00m vs last week'}
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
                <View style={[styles.card, styles.holidayCard]}>
                    <View style={styles.holidayDecoration} pointerEvents="none" />

                    {/* Make entire header clickable */}
                    <Pressable
                        onPress={() => {
                            if (upcomingHolidays.length > 0) {
                                console.log('Holiday header pressed!');
                                setShowHolidayCalendar(true);
                            }
                        }}
                        style={({ pressed }) => [
                            styles.cardHeader,
                            pressed && { opacity: 0.7 }
                        ]}
                    >
                        <Text style={styles.cardTitle}>Holidays</Text>
                        {upcomingHolidays.length > 0 && (
                            <Text style={{ color: '#48327d', fontSize: 12, fontWeight: 'bold' }}>View All</Text>
                        )}
                    </Pressable>

                    {apiErrors.holidays ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#ef4444', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>❌ {apiErrors.holidays}</Text>
                            <TouchableOpacity onPress={() => fetchDashboardData()} style={{ backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                                <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : upcomingHolidays.length > 0 ? (
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
                                    <ChevronLeftIcon color={holidayIndex === 0 ? "#cbd5e1" : "#48327d"} size={24} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setHolidayIndex(prev => Math.min(upcomingHolidays.length - 1, prev + 1))}
                                    disabled={holidayIndex === upcomingHolidays.length - 1}
                                >
                                    <ChevronRightIcon color={holidayIndex === upcomingHolidays.length - 1 ? "#cbd5e1" : "#48327d"} size={24} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <PartyPopperIcon color="#cbd5e1" size={48} style={{ marginBottom: 8 }} />
                            <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>No upcoming holidays</Text>
                        </View>
                    )}
                </View>

                <View style={styles.feedHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.feedTitle}>Community Wall</Text>
                        <ZapIcon color="#48327d" size={20} />
                    </View>
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
                            // Ensure type consistency for includes (string vs number)
                            const userIdForLike = user.employee_id || user.id;
                            const isLikedByMe = post.likes && Array.isArray(post.likes) &&
                                post.likes.map((id: any) => String(id)).includes(String(userIdForLike));
                            return (
                                <View key={post.id} style={styles.postCard}>
                                    <View style={styles.postHeader}>
                                        <View style={styles.postAuthorAvatar}>
                                            <Text style={styles.avatarText}>{post.author?.[0]}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.postAuthorName}>{post.author}</Text>
                                            <Text style={styles.postMeta}>
                                                {new Date(post.created_at).toLocaleDateString('en-US')} · {post.type}
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
                                            {post.comments.map((c: any) => {
                                                const userId = user.employee_id || user.id;
                                                const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
                                                const isAuthor = String(c.author_id || c.employee_id) === String(userId) ||
                                                    c.author === userName;
                                                const canDelete = isAdmin || isAuthor;

                                                return (
                                                    <View key={c.id} style={styles.commentRow}>
                                                        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                                                            <Text style={styles.commentAuthor}>{c.author}: </Text>
                                                            <Text style={styles.commentText}>{c.content}</Text>
                                                        </View>
                                                        {canDelete && (
                                                            <TouchableOpacity onPress={() => handleDeleteComment(post.id, c.id)} style={{ padding: 4 }}>
                                                                <TrashIcon color="#cbd5e1" size={14} />
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                );
                                            })}
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
                    </View >
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
            </ScrollView >

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
                onSuccess={() => fetchDashboardData()}
                teamLeadName={user.team_lead_name}
            />

            {/* Absentees Modal */}
            <Modal animationType="slide" transparent={true} visible={isAbsenteesModalVisible} onRequestClose={() => setIsAbsenteesModalVisible(false)}>
                <View style={styles.absenteesModalOverlay}>
                    <View style={styles.absenteesModalContent}>
                        {/* Header */}
                        <View style={styles.absenteesModalHeader}>
                            <View>
                                <Text style={styles.absenteesModalTitle}>Today's Absentees</Text>
                                <Text style={styles.syncStatusText}>SYNC STATUS: {new Date().toLocaleDateString('en-US')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsAbsenteesModalVisible(false)}>
                                <CloseIcon color="#94a3b8" size={24} />
                            </TouchableOpacity>
                        </View>

                        {/* Search & Filter */}
                        <View style={styles.searchFilterContainer}>
                            <View style={styles.searchContainer}>
                                <SearchIcon color="#94a3b8" size={18} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search name/role..."
                                    placeholderTextColor="#94a3b8"
                                    value={absenteeSearch}
                                    onChangeText={setAbsenteeSearch}
                                />
                            </View>
                            <View style={{ position: 'relative' }}>
                                <TouchableOpacity
                                    style={styles.filterBtn}
                                    onPress={() => setIsStatusDropdownVisible(!isStatusDropdownVisible)}
                                >
                                    <Text style={styles.filterBtnText}>{absenteeFilter}</Text>
                                    <ChevronDownIcon color="#64748b" size={16} />
                                </TouchableOpacity>

                                {isStatusDropdownVisible && (
                                    <View style={styles.dropdownMenu}>
                                        {['All Status', 'Absent', 'On Leave'].map((status) => (
                                            <TouchableOpacity
                                                key={status}
                                                style={[styles.dropdownItem, absenteeFilter === status && styles.dropdownItemActive]}
                                                onPress={() => {
                                                    setAbsenteeFilter(status);
                                                    setIsStatusDropdownVisible(false);
                                                }}
                                            >
                                                <Text style={[styles.dropdownItemText, absenteeFilter === status && styles.dropdownItemTextActive]}>
                                                    {status}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>

                        <FlatList
                            data={(dashboardStats?.absentees || []).filter((a: any) => {
                                const matchesSearch = a.name.toLowerCase().includes(absenteeSearch.toLowerCase()) ||
                                    (a.role && a.role.toLowerCase().includes(absenteeSearch.toLowerCase()));

                                const matchesStatus = absenteeFilter === 'All Status'
                                    ? true
                                    : (a.status || 'Absent') === absenteeFilter;

                                return matchesSearch && matchesStatus;
                            })}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.absenteeCard}>
                                    <View style={styles.absenteeInfo}>
                                        <Text style={styles.absenteeName}>{item.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                            {/* ID Badge - Mocking MWID if not present */}
                                            <View style={styles.idBadge}>
                                                <Text style={styles.idBadgeText}>{item.employee_id || `MW${1000 + Math.floor(Math.random() * 100)}`}</Text>
                                            </View>
                                            <Text style={styles.absenteeRole}>{item.role || 'Employee'}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.statusTag, (item.status === 'On Leave' ? styles.statusTagLeave : styles.statusTagAbsent)]}>
                                        <Text style={[styles.statusTagText, (item.status === 'On Leave' ? styles.statusTagTextLeave : styles.statusTagTextAbsent)]}>
                                            {item.status || 'Absent'}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyStateText}>No absentees found.</Text>}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.gotItButton} onPress={() => setIsAbsenteesModalVisible(false)}>
                                <Text style={styles.gotItButtonText}>Got It</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
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

    // Absentees Modal Styles
    absenteesModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    absenteesModalContent: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%', minHeight: '60%' },
    absenteesModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    absenteesModalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    syncStatusText: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 4, textTransform: 'uppercase' },

    searchFilterContainer: { flexDirection: 'row', gap: 12, marginBottom: 20, zIndex: 100 },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, height: 44 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1e293b' },
    filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 16, height: 44, justifyContent: 'center' },
    filterBtnText: { fontSize: 14, fontWeight: '600', color: '#2d3436' },

    dropdownMenu: { position: 'absolute', top: 50, right: 0, width: 140, backgroundColor: 'white', borderRadius: 8, elevation: 5, paddingVertical: 4, zIndex: 1000, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 1, borderColor: '#f1f5f9' },
    dropdownItem: { paddingVertical: 10, paddingHorizontal: 16 },
    dropdownItemActive: { backgroundColor: '#64748b' },
    dropdownItemText: { fontSize: 13, color: '#475569', fontWeight: '500' },
    dropdownItemTextActive: { color: 'white', fontWeight: 'bold' },

    absenteeCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    absenteeInfo: { flex: 1 },
    absenteeName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    absenteeRole: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

    idBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    idBadgeText: { fontSize: 11, fontWeight: '700', color: '#64748b' },

    statusTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, },
    statusTagAbsent: { backgroundColor: '#ffe5e5' },
    statusTagText: { fontSize: 12, fontWeight: 'bold' },
    statusTagTextAbsent: { color: '#ff7675' },
    statusTagLeave: { backgroundColor: '#e0f2fe' },
    statusTagTextLeave: { color: '#0284c7' },

    modalFooter: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 16, marginTop: 10 },
    gotItButton: { backgroundColor: '#48327d', paddingVertical: 14, borderRadius: 12, alignItems: 'center', width: '100%' },
    gotItButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    emptyStateText: { fontSize: 14, color: '#94a3b8', marginTop: 20, textAlign: 'center' },

    // Legacy styles (hidden)
    absenteesCloseButtonText: { display: 'none' },
    memberItem: { display: 'none' },
    memberAvatar: { display: 'none' },
    memberAvatarText: { display: 'none' },
    memberName: { display: 'none' },
    memberRole: { display: 'none' },
    doneButton: { display: 'none' },
    doneButtonText: { display: 'none' },
});

export default HomeScreen;
