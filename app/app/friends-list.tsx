import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

const API_BASE_URL = 'http://localhost:3001/api';

interface Friend {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  profile_pic_url: string;
  created_at: string;
}

export default function FriendsListScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unfriendingId, setUnfriendingId] = useState<number | null>(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    } else {
      loadFriends();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/friends/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      } else {
        console.error('Failed to load friends:', response.status);
        Alert.alert('Error', 'Failed to load friends list');
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfriend = async (friendId: number, friendName: string) => {
    Alert.alert(
      'Unfriend',
      `Are you sure you want to unfriend ${friendName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfriend',
          style: 'destructive',
          onPress: async () => {
            setUnfriendingId(friendId);
            try {
              if (!token) {
                Alert.alert('Error', 'Authentication token not found. Please log in again.');
                router.replace('/auth/login');
                return;
              }

              const response = await fetch(`${API_BASE_URL}/friends/${friendId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Success', `${friendName} has been removed from your friends list.`);
                // Remove the friend from the local state
                setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
              } else {
                const error = await response.json();
                Alert.alert('Error', error.message || 'Failed to unfriend user');
              }
            } catch (error) {
              console.error('Error unfriending user:', error);
              Alert.alert('Error', 'Failed to unfriend user');
            } finally {
              setUnfriendingId(null);
            }
          },
        },
      ]
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={{
      backgroundColor: 'white',
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    }}>
      {/* Profile Picture */}
      {item.profile_pic_url ? (
        <Image
          source={{ uri: item.profile_pic_url }}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            marginRight: 12,
          }}
        />
      ) : (
        <View style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: '#3b82f6',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
            {getInitials(item.first_name, item.last_name)}
          </Text>
        </View>
      )}

      {/* Friend Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 2 }}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 2 }}>
          {item.email}
        </Text>
        {item.location && (
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>
            📍 {item.location}
          </Text>
        )}
        <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          Friends since {formatDate(item.created_at)}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => router.push(`/app/profile?userId=${item.id}` as any)}
          style={{
            backgroundColor: '#3b82f6',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            marginRight: 8,
          }}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
            View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleUnfriend(item.id, `${item.first_name} ${item.last_name}`)}
          disabled={unfriendingId === item.id}
          style={{
            backgroundColor: '#ef4444',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            opacity: unfriendingId === item.id ? 0.6 : 1,
          }}
        >
          {unfriendingId === item.id ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
              Remove
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 16 }}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>My Friends</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: '#6b7280', marginRight: 8 }}>
              {friends.length} friend{friends.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Friends List */}
      <View style={{ flex: 1 }}>
        {friends.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
            <Ionicons name="people-outline" size={64} color="#9ca3af" />
            <Text style={{ color: '#6b7280', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
              No friends yet
            </Text>
            <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
              Start connecting with people by searching for friends
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/app/search' as any)}
              style={{
                marginTop: 16,
                backgroundColor: '#3b82f6',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>
                Find Friends
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingVertical: 8 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
} 