import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import notificationService from '../services/notificationService';

interface NotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  onPress?: () => void;
  style?: any;
}

export default function NotificationBadge({ 
  size = 'medium', 
  showCount = true, 
  onPress,
  style 
}: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Set up interval to refresh count
    const interval = setInterval(loadUnreadCount, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/app/notifications');
    }
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 16, height: 16, fontSize: 10 };
      case 'large':
        return { width: 24, height: 24, fontSize: 14 };
      default:
        return { width: 20, height: 20, fontSize: 12 };
    }
  };

  const badgeSize = getBadgeSize();

  return (
    <TouchableOpacity onPress={handlePress} style={style}>
      <View style={{ position: 'relative' }}>
        <Ionicons 
          name="notifications-outline" 
          size={size === 'small' ? 20 : size === 'large' ? 28 : 24} 
          color="#6b7280" 
        />
        
        {showCount && unreadCount > 0 && (
          <View style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: '#ef4444',
            borderRadius: badgeSize.width / 2,
            width: badgeSize.width,
            height: badgeSize.height,
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: badgeSize.width,
          }}>
            <Text style={{
              color: 'white',
              fontSize: badgeSize.fontSize,
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
} 