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
import { API_BASE_URL } from '../../utils/api';

interface FriendRequest {
  id: number;
  sender_id: number;
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  profile_pic_url: string;
  created_at: string;
}

export default function FriendRequestsScreen() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<number | null>(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    } else {
      loadFriendRequests();
    }
  }, [user]);

  const loadFriendRequests = async () => {
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/friends/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        console.error('Failed to load friend requests:', response.status);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
      Alert.alert('Error', 'Failed to load friend requests');
    } finally {
      setIsLoading(false);
    }
  };



  const handleAcceptRequest = async (requestId: number) => {
    setProcessingRequest(requestId);
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/friends/request/${requestId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Friend request accepted!');
        // Remove the request from the list
        setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setProcessingRequest(requestId);
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/friends/request/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Friend request rejected');
        // Remove the request from the list
        setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to reject friend request');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    } finally {
      setProcessingRequest(null);
    }
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

  const renderRequest = ({ item }: { item: FriendRequest }) => (
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
        <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          {formatDate(item.created_at)}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => handleAcceptRequest(item.id)}
          disabled={processingRequest === item.id}
          style={{
            backgroundColor: '#10b981',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            marginRight: 8,
            opacity: processingRequest === item.id ? 0.6 : 1,
          }}
        >
          {processingRequest === item.id ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
              Accept
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleRejectRequest(item.id)}
          disabled={processingRequest === item.id}
          style={{
            backgroundColor: '#ef4444',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            opacity: processingRequest === item.id ? 0.6 : 1,
          }}
        >
          {processingRequest === item.id ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
              Reject
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
        <Text style={{ color: '#6b7280', marginTop: 16 }}>Loading friend requests...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingTop: 50, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>Friend Requests</Text>
          </View>
        </View>
      </View>

      {/* Requests List */}
      <View style={{ flex: 1 }}>
        {requests.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
            <Ionicons name="people-outline" size={64} color="#9ca3af" />
            <Text style={{ color: '#6b7280', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
              No friend requests
            </Text>
            <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
              When someone sends you a friend request, it will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingVertical: 8 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
} 