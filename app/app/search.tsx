import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, User } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../utils/api';


interface Users extends User {
  friendStatus: 'none' | 'pending' | 'accepted' | 'rejected' | 'friends' | 'pending_received';
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Users[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user]);

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setUsers([]);
      return;
    }

    setIsSearching(true);
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/friends/search?query=${encodeURIComponent(query.trim())}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Search failed:', response.status);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };



  const sendFriendRequest = async (receiverId: number) => {
    setIsLoading(true);
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/friends/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiverId }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Friend request sent!');
        // Update the user's friend status
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === receiverId ? { ...u, friendStatus: 'pending' } : u
          )
        );
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getFriendStatusText = (status: string) => {
    switch (status) {
      case 'friends':
        return 'Friends';
      case 'pending':
        return 'Request Sent';
      case 'pending_received':
        return 'Request Received';
      case 'accepted':
        return 'Friends';
      case 'rejected':
        return 'Request Rejected';
      default:
        return 'Add Friend';
    }
  };

  const getFriendStatusColor = (status: string) => {
    switch (status) {
      case 'friends':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'pending_received':
        return '#3b82f6';
      case 'accepted':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  const renderUser = ({ item }: { item: Users }) => (
    <TouchableOpacity
      onPress={() => router.push(`/app/profile?userId=${item.id}` as any)}
      style={{
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
      }}
    >
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

      {/* User Info */}
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
      </View>

      {/* Friend Button */}
      {item.friendStatus === 'none' ? (
        <TouchableOpacity
          onPress={() => sendFriendRequest(item.id)}
          disabled={isLoading}
          style={{
            backgroundColor: '#3b82f6',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="add" size={16} color="white" style={{ marginRight: 4 }} />
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
            Add
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={{
          backgroundColor: getFriendStatusColor(item.friendStatus),
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
        }}>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
            {getFriendStatusText(item.friendStatus)}
          </Text>
        </View>
       )}
     </TouchableOpacity>
   );

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
            <TouchableOpacity onPress={() => router.push('/app/home')} style={{ marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>Find Friends</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={{ backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f3f4f6',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
          <Ionicons name="search" size={20} color="#6b7280" style={{ marginRight: 12 }} />
          <TextInput
            style={{ flex: 1, fontSize: 16, color: '#1f2937' }}
            placeholder="Search by name or email..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.trim().length >= 2) {
                searchUsers(text);
              } else {
                setUsers([]);
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setUsers([]);
            }}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <View style={{ flex: 1 }}>
        {isSearching ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ color: '#6b7280', marginTop: 16 }}>Searching...</Text>
          </View>
        ) : searchQuery.length > 0 && users.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
            <Ionicons name="people-outline" size={64} color="#9ca3af" />
            <Text style={{ color: '#6b7280', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
              No users found
            </Text>
            <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
              Try searching with a different name or email
            </Text>
          </View>
        ) : searchQuery.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
            <Ionicons name="search-outline" size={64} color="#9ca3af" />
            <Text style={{ color: '#6b7280', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
              Search for friends
            </Text>
            <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
              Enter a name or email to find people to connect with
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingVertical: 8 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
} 