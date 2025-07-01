import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'http://localhost:3001/api';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  created_at: string;
}

interface UserUpdate {
  id: number;
  location_name: string;
  message: string;
  date: string;
  upvotes: number;
  downvotes: number;
}

export default function ProfileScreen() {
  console.log('ProfileScreen component rendered');
  const [user, setUser] = useState<User | null>(null);
  const [userUpdates, setUserUpdates] = useState<UserUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUpdates: 0,
    totalUpvotes: 0,
    totalDownvotes: 0,
    averageRating: 0,
  });

  useEffect(() => {
    console.log('ProfileScreen useEffect triggered');
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        Alert.alert('Error', 'User data not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      const userData = JSON.parse(userDataString);
      setUser(userData);

      // Fetch user's updates
      const response = await fetch(`${API_BASE_URL}/updates/user/${userData.id}`);
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
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    console.log('Formatting date:', dateString);
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

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <Text style={{ color: '#6b7280', fontSize: 18 }}>User not found</Text>
      </View>
    );
  }

  console.log(user);

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.push('/app/home')} style={{ marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>Profile</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={{ padding: 8 }}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Profile Header */}
        <View style={{ backgroundColor: 'white', padding: 24, marginBottom: 16 }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
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
                {getInitials(user.first_name, user.last_name)}
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>
              {user.first_name} {user.last_name}
            </Text>
            <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 8 }}>
              {user.email}
            </Text>
            <Text style={{ fontSize: 14, color: '#9ca3af' }}>
              Member since {formatDate(user.created_at)}
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: '#f8fafc', borderRadius: 8, marginRight: 8 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>
                {stats.totalUpdates}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Updates</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: '#f8fafc', borderRadius: 8, marginHorizontal: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>
                {stats.totalUpvotes}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Upvotes</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: '#f8fafc', borderRadius: 8, marginLeft: 8 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: stats.averageRating >= 0 ? '#10b981' : '#ef4444' }}>
                {stats.averageRating}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Avg Rating</Text>
            </View>
          </View>
        </View>

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
                No updates yet
              </Text>
              <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
                Start sharing updates to see them here
              </Text>
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
            </View>
          ) : (
            userUpdates.map((update) => (
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
                    {formatDate(update.date)}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8, lineHeight: 20 }}>
                  {update.message}
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

        {/* Settings Section */}
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
            onPress={() => Alert.alert('Coming Soon', 'Edit profile feature will be available soon!')}
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
            onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon!')}
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
            }}
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon!')}
          >
            <Ionicons name="shield-outline" size={20} color="#6b7280" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 16, color: '#1f2937', flex: 1 }}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={{ backgroundColor: 'white', marginBottom: 24 }}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center' }}>
              WaitNSee v1.0.0
            </Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
              Know before you go
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
} 