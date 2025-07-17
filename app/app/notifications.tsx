import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import notificationService, { Notification } from '../../services/notificationService';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNotifications = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const success = await notificationService.markAsRead(notificationId);
      if (success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const success = await notificationService.markAllAsRead();
      if (success) {
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
        setUnreadCount(0);
        Alert.alert('Success', 'All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return 'person-add-outline';
      case 'location_update':
        return 'location-outline';
      case 'points_earned':
        return 'star-outline';
      case 'comment_reply':
        return 'chatbubble-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'friend_request':
        return '#3b82f6';
      case 'location_update':
        return '#10b981';
      case 'points_earned':
        return '#f59e0b';
      case 'comment_reply':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={{
        backgroundColor: item.is_read ? 'white' : '#fef3c7',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
      onPress={() => markAsRead(item.id)}
    >
      <View style={{ marginRight: 16, marginTop: 2 }}>
        <Ionicons
          name={getNotificationIcon(item.type) as any}
          size={20}
          color={getNotificationColor(item.type)}
        />
      </View>
      
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: item.is_read ? '400' : '600', 
            color: '#1f2937',
            flex: 1 
          }}>
            {item.title}
          </Text>
          {!item.is_read && (
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#3b82f6',
              marginLeft: 8,
            }} />
          )}
        </View>
        
        <Text style={{ 
          fontSize: 14, 
          color: '#6b7280', 
          lineHeight: 20,
          marginBottom: 8 
        }}>
          {item.body}
        </Text>
        
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>
          {formatDate(item.sent_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 16 }}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 24, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View style={{
                backgroundColor: '#ef4444',
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 8,
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </View>
          
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: '#3b82f6',
                borderRadius: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                Mark All Read
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Ionicons name="notifications-off-outline" size={64} color="#9ca3af" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16, textAlign: 'center' }}>
            No Notifications Yet
          </Text>
          <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            You'll see notifications here when you receive friend requests, location updates, and other important updates.
          </Text>
          
          <TouchableOpacity
            onPress={() => router.push('/app/notification-settings')}
            style={{
              marginTop: 24,
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: '#3b82f6',
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Notification Settings
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshNotifications}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
} 