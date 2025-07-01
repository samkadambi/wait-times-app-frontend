import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3001/api';

interface Location {
  id: number;
  name: string;
  address: string;
  city_name: string;
  type: 'park' | 'restaurant' | 'bar' | 'other';
  img_url: string;
  busyness_level: string;
  busyness_score: number;
  update_count: number;
  latest_comment: string;
  last_updated: string;
}

interface Update {
  id: number;
  user_name: string;
  message: string;
  img_url: string | null;
  date: string;
  upvotes: number;
  downvotes: number;
}

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    loadUserData();
    if (id) {
      fetchLocationData();
    }
  }, [id]);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  

  const fetchLocationData = async () => {
    try {
      const [locationRes, updatesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/locations/${id}`),
        fetch(`${API_BASE_URL}/updates/location/${id}`),
      ]);

      if (locationRes.ok) {
        const locationData = await locationRes.json();
        setLocation(locationData);
      } else {
        Alert.alert('Error', 'Location not found');
        router.back();
        return;
      }

      if (updatesRes.ok) {
        const updatesData = await updatesRes.json();
        setUpdates(updatesData);
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
      Alert.alert('Error', 'Failed to load location data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLocationData();
    setRefreshing(false);
  };

  const getBusynessColor = (level: string) => {
    switch (level) {
      case 'very_busy':
        return '#ef4444';
      case 'busy':
        return '#f59e0b';
      case 'moderate':
        return '#f59e0b';
      case 'not_busy':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getBusynessText = (level: string) => {
    switch (level) {
      case 'very_busy':
        return 'Very Busy';
      case 'busy':
        return 'Busy';
      case 'moderate':
        return 'Moderate';
      case 'not_busy':
        return 'Not Busy';
      default:
        return 'Unknown';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'park':
        return 'leaf-outline';
      case 'restaurant':
        return 'restaurant-outline';
      case 'bar':
        return 'wine-outline';
      default:
        return 'location-outline';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handlePostUpdate = () => {
    router.push(`/app/post-update?locationId=${id}&locationName=${location?.name}`);
  };

  const handleVote = async (updateId: number, vote: 1 | -1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/updates/${updateId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData?.id || 1,
          vote: vote,
        }),
      });

      if (response.ok) {
        // Refresh the updates to show new vote counts
        await fetchLocationData();
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 16 }}>Loading location...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <Text style={{ color: '#6b7280', fontSize: 18 }}>Location not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.push('/app/home')} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#6b7280" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>
              {location.name}
            </Text>
            <Text style={{ color: '#6b7280' }}>{location.city_name}</Text>
          </View>
        </View>

        {/* Location Info Card */}
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons
              name={getTypeIcon(location.type) as any}
              size={24}
              color="#3b82f6"
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                {location.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>{location.address}</Text>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: getBusynessColor(location.busyness_level),
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                {getBusynessText(location.busyness_level)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>
              {location.update_count} updates
            </Text>
            {location.last_updated && (
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                Last updated {formatTimeAgo(location.last_updated)}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Updates Section */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
              Recent Updates
            </Text>
            <TouchableOpacity
              onPress={handlePostUpdate}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#2563eb',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Ionicons name="add" size={16} color="white" style={{ marginRight: 4 }} />
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
                Post Update
              </Text>
            </TouchableOpacity>
          </View>

          {updates.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="chatbubble-outline" size={64} color="#9ca3af" />
              <Text style={{ color: '#6b7280', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
                No updates yet
              </Text>
              <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
                Be the first to share what's happening here!
              </Text>
              <TouchableOpacity
                onPress={handlePostUpdate}
                style={{
                  marginTop: 16,
                  backgroundColor: '#2563eb',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  Post First Update
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            updates.map((update) => (
              <View
                key={update.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>
                      {update.user_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#1f2937' }}>
                      {update.user_name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                      {formatTimeAgo(update.date)}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 16, color: '#374151', marginBottom: 12, lineHeight: 22 }}>
                  {update.message}
                </Text>

                {update.img_url && (
                  <Image
                    source={{ uri: update.img_url }}
                    style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 12 }}
                    resizeMode="cover"
                  />
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }} onPress={() => handleVote(update.id, 1)}>
                    <Ionicons name="thumbs-up-outline" size={16} color="green" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>{update.upvotes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => handleVote(update.id, -1)}>
                    <Ionicons name="thumbs-down-outline" size={16} color="red" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>{update.downvotes}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
} 