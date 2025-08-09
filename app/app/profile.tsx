import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../utils/api';

interface UserUpdate {
  id: number;
  location_id: number;
  user_id: number;
  wait_time: number;
  busyness_level: string;
  comment: string;
  date: string;
  upvotes: number;
  downvotes: number;
  location_name: string;
}

export default function ProfileScreen() {
  const [userUpdates, setUserUpdates] = useState<UserUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUpdates: 0,
    totalUpvotes: 0,
    totalDownvotes: 0,
    averageRating: 0,
  });
  const [pointsData, setPointsData] = useState({
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    dailyStatus: {
      dailyPointsEarned: 0,
      dailyUpdatesCount: 0,
      dailyPointsRemaining: null,
      dailyUpdatesRemaining: 10,
      dailyPointsLimit: null,
      dailyUpdatesLimit: 10,
      canEarnPoints: true
    }
  });
  const [profileUser, setProfileUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const { user, logout, token } = useAuth();
  
  // Get user ID from route params if viewing another user's profile
  const route = useLocalSearchParams();
  const targetUserId = route.userId ? parseInt(route.userId as string) : null;
  const isOwnProfile = !targetUserId || targetUserId === user?.id;

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }

    //get friends from friends table
    const loadFriends = async () => {
      const response = await fetch(`${API_BASE_URL}/friends/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const friends = await response.json();
        setFriends(friends);
      }
    };

    loadFriends();

  }, [user, targetUserId]);

  const loadUserProfile = async () => {
    if (!user) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      router.replace('/auth/login');
      return;
    }

    // Load profile user data, either the target user when viewing another user's profile, or the current user when viewing their own profile
    const userIdToLoad = targetUserId || user.id;

    try {
      // Load profile user data
      if (!isOwnProfile) {
        if (!token) {
          Alert.alert('Error', 'Authentication token not found. Please log in again.');
          router.replace('/auth/login');
          return;
        }
        
        const userResponse = await fetch(`${API_BASE_URL}/users/${userIdToLoad}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setProfileUser(userData);
        } else {
          Alert.alert('Error', 'User not found');
          router.back();
          return;
        }
      } else {
        setProfileUser(user);
      }

      // Fetch user's updates
      const response = await fetch(`${API_BASE_URL}/updates/user/${userIdToLoad}`);
      if (response.ok) {
        const updates = await response.json();
        setUserUpdates(updates);
        
        // Calculate stats
        const totalUpdates = updates.length;
        const totalUpvotes = updates.reduce((sum: number, update: UserUpdate) => sum + update.upvotes, 0);
        const totalDownvotes = updates.reduce((sum: number, update: UserUpdate) => sum + update.downvotes, 0);
        const averageRating = totalUpdates > 0 ? ((totalUpvotes - totalDownvotes) / totalUpdates) : 0;
        
        setStats({
          totalUpdates,
          totalUpvotes,
          totalDownvotes,
          averageRating: averageRating,
        });
      }

      // Load points data
      if (token) {
        try {
          const pointsResponse = await fetch(`${API_BASE_URL}/points/user/${userIdToLoad}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (pointsResponse.ok) {
            const points = await pointsResponse.json();
            setPointsData({
              totalPoints: points.totalPoints,
              currentStreak: points.currentStreak,
              longestStreak: points.longestStreak,
              dailyStatus: points.dailyStatus || {
                dailyPointsEarned: 0,
                dailyUpdatesCount: 0,
                dailyPointsRemaining: 100,
                dailyUpdatesRemaining: 10,
                dailyPointsLimit: 100,
                dailyUpdatesLimit: 10
              }
            });
          }
        } catch (error) {
          console.error('Error loading points data:', error);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 16 }}>Loading profile...</Text>
      </View>
    );
  }

  if (!user || !profileUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <Text style={{ color: '#6b7280', fontSize: 18 }}>User not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: 'white', 
        paddingHorizontal: 16, 
        paddingVertical: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#e5e7eb',
        paddingTop: Platform.OS === 'ios' ? 0 : 16,
      }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                <Ionicons name="arrow-back" size={24} color="#6b7280" />
              </TouchableOpacity>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>
                {isOwnProfile ? 'Profile' : `${profileUser.first_name}'s Profile`}
              </Text>
            </View>
            {isOwnProfile && (
              <TouchableOpacity onPress={handleLogout} style={{ padding: 8 }} onLongPress={() => Alert.alert('Logout', 'Are you sure you want to logout?')}>
                <Ionicons name="log-out-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Profile Header */}
        <View style={{ backgroundColor: 'white', padding: 24, marginBottom: 16 }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            {isOwnProfile ? (
              // Make profile picture clickable for own profile
              <TouchableOpacity
                onPress={() => router.push('/app/edit-profile')}
                style={{ marginBottom: 16 }}
              >
                {profileUser.profile_pic_url ? (
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    overflow: 'hidden',
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                  }}>
                    <Image
                      source={{ uri: profileUser.profile_pic_url }}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </View>
                ) : (
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: '#3b82f6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                  }}>
                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>
                      {getInitials(profileUser.first_name, profileUser.last_name)}
                    </Text>
                    {/* Edit overlay */}
                    <View style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: '#3b82f6',
                      borderRadius: 12,
                      width: 24,
                      height: 24,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: 'white',
                    }}>
                      <Ionicons name="camera" size={12} color="white" />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              // Non-clickable profile picture for other users
              <>
                {profileUser.profile_pic_url ? (
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    marginBottom: 16,
                    overflow: 'hidden',
                  }}>
                    <Image
                      source={{ uri: profileUser.profile_pic_url }}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </View>
                ) : (
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: '#3b82f6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}>
                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>
                      {getInitials(profileUser.first_name, profileUser.last_name)}
                    </Text>
                  </View>
                )}
              </>
            )}
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>
              {profileUser.first_name} {profileUser.last_name}
            </Text>
            <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 8 }}>
              {profileUser.email}
            </Text>
            <Text style={{ fontSize: 14, color: '#9ca3af' }}>
              Member since {formatDate(profileUser.created_at)}
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity 
              style={{ flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: '#f8fafc', borderRadius: 8, marginRight: 8 }}
              onPress={() => router.push('/app/friends-list' as any)}
            >
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>
                {friends.length}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Friends</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: '#f8fafc', borderRadius: 8, marginRight: 8 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>
                {stats.totalUpdates}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Updates</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: '#f8fafc', borderRadius: 8, marginLeft: 8 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: stats.averageRating >= 0 ? '#10b981' : '#ef4444' }}>
                {stats.averageRating.toFixed(1)}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Avg Rating</Text>
            </View>
          </View>

          {/* Points Section */}
          <View style={{ backgroundColor: '#fef3c7', borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="star" size={20} color="#f59e0b" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#92400e' }}>Points & Achievements</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#92400e' }}>
                  {pointsData.totalPoints}
                </Text>
                <Text style={{ fontSize: 12, color: '#b45309' }}>Total Points</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#92400e' }}>
                  {pointsData.longestStreak}
                </Text>
                <Text style={{ fontSize: 12, color: '#b45309' }}>Best Streak</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#92400e' }}>
                  {pointsData.currentStreak}
                </Text>
                <Text style={{ fontSize: 12, color: '#b45309' }}>Day Streak</Text>
              </View>
            </View>
          </View>

          {/* Daily Progress Section */}
          <View style={{ backgroundColor: '#dbeafe', borderRadius: 8, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="calendar" size={20} color="#2563eb" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e40af' }}>Today's Progress</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e40af' }}>
                  {pointsData.dailyStatus.dailyPointsEarned}
                </Text>
                <Text style={{ fontSize: 12, color: '#3b82f6' }}>Points Earned</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e40af' }}>
                  {pointsData.dailyStatus.dailyUpdatesCount}/{pointsData.dailyStatus.dailyUpdatesLimit}
                </Text>
                <Text style={{ fontSize: 12, color: '#3b82f6' }}>Updates Posted</Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#e0e7ff', borderRadius: 4, height: 8, marginTop: 8 }}>
              <View 
                style={{ 
                  backgroundColor: pointsData.dailyStatus.canEarnPoints ? '#6366f1' : '#f59e0b', 
                  borderRadius: 4, 
                  height: 8, 
                  width: `${Math.min((pointsData.dailyStatus.dailyUpdatesCount / pointsData.dailyStatus.dailyUpdatesLimit) * 100, 100)}%` 
                }} 
              />
            </View>
            <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'center', marginTop: 4 }}>
              {pointsData.dailyStatus.canEarnPoints 
                ? `${pointsData.dailyStatus.dailyUpdatesRemaining} more posts can earn points today`
                : 'You can continue posting, but no more points today'
              }
            </Text>
          </View>
        </View>

        {/* Settings Section - Only show for own profile */}
        {isOwnProfile && (
          <View style={{ backgroundColor: 'white', marginBottom: 16 }}>
            <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
                Settings
              </Text>
            </View>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6',
              }}
              onPress={() => router.push('/app/edit-profile')}
            >
              <Ionicons name="person-outline" size={20} color="#6b7280" style={{ marginRight: 16 }} />
              <Text style={{ fontSize: 16, color: '#1f2937', flex: 1 }}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6',
              }}
              onPress={() => router.push('/app/notification-settings')}
            >
              <Ionicons name="notifications-outline" size={20} color="#6b7280" style={{ marginRight: 16 }} />
              <Text style={{ fontSize: 16, color: '#1f2937', flex: 1 }}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6',
              }}
              onPress={() => router.push('/app/friend-requests' as any)}
            >
              <Ionicons name="people-outline" size={20} color="#6b7280" style={{ marginRight: 16 }} />
              <Text style={{ fontSize: 16, color: '#1f2937', flex: 1 }}>Friend Requests</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 16,
              }}
              onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon!')}
            >
              <Ionicons name="shield-outline" size={20} color="#6b7280" style={{ marginRight: 16 }} />
              <Text style={{ fontSize: 16, color: '#1f2937', flex: 1 }}>Privacy</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Activity */}
        <View style={{ backgroundColor: 'white', marginBottom: 16 }}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
              Recent Activity
            </Text>
          </View>

          {userUpdates.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="chatbubble-outline" size={48} color="#9ca3af" />
              <Text style={{ color: '#6b7280', fontSize: 16, marginTop: 12, textAlign: 'center' }}>
                {isOwnProfile ? 'No updates yet' : 'No updates yet'}
              </Text>
              <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
                {isOwnProfile ? 'Start sharing updates to see them here' : 'This user hasn\'t shared any updates yet'}
              </Text>
              {isOwnProfile && (
                <TouchableOpacity
                  onPress={() => router.push('/app/post-update')}
                  style={{
                    marginTop: 16,
                    backgroundColor: '#2563eb',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    Post First Update
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // only show most recent 5 updates
            userUpdates.slice(0, 5).map((update) => (
              <View
                key={update.id}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f3f4f6',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="location-outline" size={16} color="#6b7280" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#1f2937' }}>
                    {update.location_name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>
                    {formatDate(update.date.split('T')[0])}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8, lineHeight: 20 }}>
                  {update.comment}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                    <Ionicons name="thumbs-up" size={14} color="#10b981" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>{update.upvotes}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="thumbs-down" size={14} color="#ef4444" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>{update.downvotes}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* App Info */}
        <View style={{ backgroundColor: 'white', marginBottom: 24 }}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center' }}>
              GoodEye v1.0.0
            </Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
              Know before you go
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 