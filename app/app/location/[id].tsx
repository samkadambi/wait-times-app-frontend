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
  TextInput,
  Modal,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.0.122:3001/api';

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
  today_update_count: number;
}

interface Update {
  id: number;
  user_name: string;
  user_id: number;
  message: string;
  img_url: string | null;
  date: string;
  upvotes: number;
  downvotes: number;
  total_people_count: number | null;
  waiting_people_count: number | null;
  busyness_level: string;
}

interface Comment {
  id: number;
  user_name: string;
  comment: string;
  created_at: string;
  user_id: number;
}

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [comments, setComments] = useState<{ [updateId: number]: Comment[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedUpdate, setExpandedUpdate] = useState<number | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [commentingOn, setCommentingOn] = useState<number | null>(null);
  const [filterLastDay, setFilterLastDay] = useState(true); // Default to last day filter
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string>('');
  const { user } = useAuth();
  
  // State for collapsible location info
  const [isLocationInfoExpanded, setIsLocationInfoExpanded] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLocationData();
    }
  }, [id, filterLastDay]);


  const fetchLocationData = async () => {
    try {
      const filterParam = filterLastDay ? 'lastDay' : 'all';
      const [locationRes, updatesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/locations/${id}`),
        fetch(`${API_BASE_URL}/updates/location/${id}?filter=${filterParam}`),
      ]);

      if (locationRes.ok && updatesRes.ok) {
        const locationData = await locationRes.json();
        const updatesData = await updatesRes.json();
        
        setLocation(locationData);
        setUpdates(updatesData);

        // Fetch comments for each update
        const commentsPromises = updatesData.map((update: Update) =>
          fetch(`${API_BASE_URL}/comments/update/${update.id}`)
        );
        
        const commentsResponses = await Promise.all(commentsPromises);
        const commentsData = await Promise.all(
          commentsResponses.map(res => res.json())
        );

        const commentsMap: { [updateId: number]: Comment[] } = {};
        updatesData.forEach((update: Update, index: number) => {
          commentsMap[update.id] = commentsData[index];
        });
        
        setComments(commentsMap);
      } else {
        Alert.alert('Error', 'Failed to load location data');
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
      Alert.alert('Error', 'Network error. Please try again.');
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

  const getTypeIcon = (type: string, locationName?: string) => {
    // Check for specific sports courts in the location name
    if (locationName) {
      const name = locationName.toLowerCase();
      
      // Basketball courts
      if (name.includes('basketball')) {
        return 'basketball-outline';
      }
      
      // Tennis courts
      if (name.includes('tennis')) {
        return 'tennisball-outline';
      }
      
      // Volleyball courts
      if (name.includes('volleyball')) {
        return 'football-outline'; // Ionicons doesn't have volleyball, using football as closest
      }
      
      // Soccer fields
      if (name.includes('soccer') || name.includes('football field')) {
        return 'football-outline';
      }
      
      // Baseball fields
      if (name.includes('baseball') || name.includes('diamond')) {
        return 'baseball-outline';
      }
      
      // Swimming pools
      if (name.includes('pool') || name.includes('swimming')) {
        return 'water-outline';
      }
      
      // Gym/fitness
      if (name.includes('gym') || name.includes('fitness') || name.includes('workout')) {
        return 'fitness-outline';
      }
    }
    
    // Fall back to type-based icons
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

  const handleImagePress = (imageUrl: string) => {
    setFullScreenImageUrl(imageUrl);
    setShowFullScreenImage(true);
  };

  const handleVote = async (updateId: number, vote: 1 | -1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/updates/${updateId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id || 1,
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

  const handlePostComment = async (updateId: number) => {
    if (!newComment.trim() || !user) {
      Alert.alert('Error', 'Please enter a comment and make sure you are logged in');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          update_id: updateId,
          comment: newComment.trim(),
        }),
      });

      if (response.ok) {
        setNewComment('');
        setCommentingOn(null);
        // Refresh comments for this update
        const commentsRes = await fetch(`${API_BASE_URL}/comments/update/${updateId}`);
        if (commentsRes.ok) {
          const updateComments = await commentsRes.json();
          setComments(prev => ({
            ...prev,
            [updateId]: updateComments
          }));
        }
      } else {
        Alert.alert('Error', 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: number, updateId: number) => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      if (response.ok) {
        // Refresh comments for this update
        const commentsRes = await fetch(`${API_BASE_URL}/comments/update/${updateId}`);
        if (commentsRes.ok) {
          const updateComments = await commentsRes.json();
          setComments(prev => ({
            ...prev,
            [updateId]: updateComments
          }));
        }
      } else {
        Alert.alert('Error', 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert('Error', 'Network error. Please try again.');
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Fixed Header */}
      <View style={{ 
        backgroundColor: 'white', 
        paddingHorizontal: 16, 
        paddingVertical: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#e5e7eb',
        paddingTop: Platform.OS === 'ios' ? 0 : 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#6b7280" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }} selectable={true}>
              {location.name}
            </Text>
            <Text style={{ color: '#6b7280' }}>{location.city_name}</Text>
          </View>
        </View>
      </View>

      {/* Collapsible Location Info */}
      {isLocationInfoExpanded && (
        <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
          <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons
                name={getTypeIcon(location.type, location.name) as any}
                size={24}
                color="#3b82f6"
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text 
                  style={{ fontSize: 14, color: '#6b7280' }}
                  selectable={true}
                >
                  {location.address}
                </Text>
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

            {/* Location Image */}
            {location.img_url && (
              <TouchableOpacity
                onPress={() => handleImagePress(location.img_url)}
                style={{ marginBottom: 12 }}
              >
                <Image
                  source={{ uri: location.img_url }}
                  style={{
                    width: '100%',
                    height: 100,
                    borderRadius: 8,
                  }}
                  resizeMode="cover"
                />
                <View style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: 16,
                  padding: 4,
                }}>
                  <Ionicons name="expand-outline" size={16} color="white" />
                </View>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                {filterLastDay ? location.today_update_count : location.update_count} update{location.update_count === 1 ? '' : 's'} {filterLastDay ? 'today' : 'total'}
              </Text>
              {location.last_updated && (
                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                  Last updated {formatTimeAgo(location.last_updated)}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Collapse/Expand Arrow */}
      <TouchableOpacity
        onPress={() => setIsLocationInfoExpanded(!isLocationInfoExpanded)}
        style={{
          backgroundColor: 'white',
          paddingVertical: 8,
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        }}
      >
        <Ionicons 
          name={isLocationInfoExpanded ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#6b7280" 
        />
      </TouchableOpacity>

      {/* Updates Section */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>
              Recent Updates
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setFilterLastDay(!filterLastDay)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filterLastDay ? '#10b981' : '#6b7280',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 16,
                  marginRight: 8,
                  minWidth: 100,
                  height: 36,
                }}
              >
                <Ionicons 
                  name={filterLastDay ? "time" : "time-outline"} 
                  size={14} 
                  color="white" 
                  style={{ marginRight: 4 }} 
                />
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
                  {filterLastDay ? 'Last Day' : 'All Time'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePostUpdate}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#2563eb',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 16,
                  marginRight: 8,
                  minWidth: 100,
                  height: 36,
                }}
              >
                <Ionicons name="add" size={14} color="white" style={{ marginRight: 4 }} />
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
                  Post Update
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {updates.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="chatbubble-outline" size={64} color="#9ca3af" />
              <Text style={{ color: '#6b7280', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
                {filterLastDay ? 'No recent updates' : 'No updates yet'}
              </Text>
              <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
                {filterLastDay 
                  ? 'No updates from the last 24 hours. Try switching to "All Time" to see older updates.'
                  : 'Be the first to share what\'s happening here!'
                }
              </Text>
              {!filterLastDay && (
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
              )}
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
                    <TouchableOpacity onPress={() => router.push(`/app/profile?userId=${update.user_id}`)}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>
                        {update.user_name.charAt(0).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity onPress={() => router.push(`/app/profile?userId=${update.user_id}`)}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#1f2937' }}>
                        {update.user_name}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push(`/app/profile?userId=${update.user_id}`)}>
                      <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                        {formatTimeAgo(update.date)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={{ fontSize: 16, color: '#374151', marginBottom: 12, lineHeight: 22 }}>
                  {update.message}
                </Text>

                {/* People Count Information */}
                {(update.total_people_count !== null || update.waiting_people_count !== null) && (
                  <View style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                    borderLeftWidth: 3,
                    borderLeftColor: '#3b82f6'
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons name="people-outline" size={16} color="#3b82f6" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>
                        Approximate People Count
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                      {update.total_people_count !== null && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="people" size={14} color="#6b7280" style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 13, color: '#6b7280' }}>
                            {update.total_people_count} total
                          </Text>
                        </View>
                      )}
                      {update.waiting_people_count !== null && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="time-outline" size={14} color="#6b7280" style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 13, color: '#6b7280' }}>
                            {update.waiting_people_count} waiting
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Busyness Level */}
                {update.busyness_level && update.busyness_level !== 'unknown' && (
                  <View style={{
                    backgroundColor: '#f0f9ff',
                    borderRadius: 8,
                    padding: 8,
                    marginBottom: 12,
                    alignSelf: 'flex-start'
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="analytics-outline" size={14} color="#0ea5e9" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#0c4a6e' }}>
                        {update.busyness_level.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}

                {update.img_url && (
                  <TouchableOpacity
                    onPress={() => handleImagePress(update.img_url!)}
                    style={{ marginBottom: 12 }}
                  >
                    <Image
                      source={{ uri: update.img_url }}
                      style={{ width: '100%', height: 200, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                    <View style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: 16,
                      padding: 4,
                    }}>
                      <Ionicons name="expand-outline" size={16} color="white" />
                    </View>
                  </TouchableOpacity>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }} onPress={() => handleVote(update.id, 1)}>
                      <Ionicons name="thumbs-up-outline" size={16} color="green" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, color: '#6b7280' }}>{update.upvotes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }} onPress={() => handleVote(update.id, -1)}>
                      <Ionicons name="thumbs-down-outline" size={16} color="red" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, color: '#6b7280' }}>{update.downvotes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center' }} 
                      onPress={() => setExpandedUpdate(expandedUpdate === update.id ? null : update.id)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color="#6b7280" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, color: '#6b7280' }}>
                        {comments[update.id]?.length || 0} comments
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      setCommentingOn(commentingOn === update.id ? null : update.id)
                      setExpandedUpdate(expandedUpdate === update.id ? null : update.id)
                    }}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#2563eb" />
                  </TouchableOpacity>
                </View>

                {/* Comments Section */}
                {expandedUpdate === update.id && (
                  <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12 }}>
                    {/* Comment Input */}
                    {commentingOn === update.id && (
                      <View style={{ marginBottom: 12 }}>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: '#d1d5db',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            fontSize: 14,
                            minHeight: 40,
                          }}
                          placeholder="Write a comment..."
                          value={newComment}
                          onChangeText={setNewComment}
                          multiline
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                          <TouchableOpacity
                            onPress={() => setCommentingOn(null)}
                            style={{ marginRight: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                          >
                            <Text style={{ color: '#6b7280' }}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handlePostComment(update.id)}
                            style={{
                              backgroundColor: '#2563eb',
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 6,
                            }}
                          >
                            <Text style={{ color: 'white', fontWeight: '500' }}>Post</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Comments List */}
                    {comments[update.id]?.length > 0 ? (
                      comments[update.id].map((comment) => (
                        <View key={comment.id} style={{ marginBottom: 8, paddingLeft: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ fontSize: 12, fontWeight: '500', color: '#1f2937' }}>
                                  {comment.user_name}
                                </Text>
                                <Text style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>
                                  {formatTimeAgo(comment.created_at)}
                                </Text>
                              </View>
                              <Text style={{ fontSize: 14, color: '#374151', lineHeight: 18 }}>
                                {comment.comment}
                              </Text>
                            </View>
                            {user && comment.user_id === user.id && (
                              <TouchableOpacity
                                onPress={() => handleDeleteComment(comment.id, update.id)}
                                style={{ padding: 4, marginLeft: 8 }}
                              >
                                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' }}>
                        No comments yet
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={showFullScreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullScreenImage(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              zIndex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: 20,
              padding: 8,
            }}
            onPress={() => setShowFullScreenImage(false)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              width: Dimensions.get('window').width,
              height: Dimensions.get('window').height * 0.8,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowFullScreenImage(false)}
          >
            <Image
              source={{ uri: fullScreenImageUrl }}
              style={{
                width: '100%',
                height: '100%',
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 