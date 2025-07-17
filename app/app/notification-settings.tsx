import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import notificationService, { NotificationPreferences } from '../../services/notificationService';

export default function NotificationSettingsScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    friend_requests: true,
    location_updates: true,
    points_earned: true,
    comments_replies: true,
    general_updates: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const success = await notificationService.updatePreferences(preferences);
      if (success) {
        Alert.alert('Success', 'Notification preferences updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update notification preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      const success = await notificationService.sendTestNotification(
        'Test Notification',
        'This is a test notification to verify your settings are working correctly.'
      );
      if (success) {
        Alert.alert('Success', 'Test notification sent! Check your device.');
      } else {
        Alert.alert('Error', 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 16 }}>Loading preferences...</Text>
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
          </View>
          <TouchableOpacity 
            onPress={savePreferences}
            disabled={isSaving}
            style={{ 
              paddingHorizontal: 16, 
              paddingVertical: 8, 
              backgroundColor: isSaving ? '#9ca3af' : '#3b82f6',
              borderRadius: 8 
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Notification Types */}
        <View style={{ backgroundColor: 'white', marginBottom: 16 }}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
              Notification Types
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              Choose which notifications you want to receive
            </Text>
          </View>

          {/* Friend Requests */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1f2937' }}>
                Friend Requests
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                When someone sends you a friend request
              </Text>
            </View>
            <Switch
              value={preferences.friend_requests}
              onValueChange={(value) => updatePreference('friend_requests', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.friend_requests ? '#3b82f6' : '#9ca3af'}
            />
          </View>

          {/* Location Updates */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1f2937' }}>
                Location Updates
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                When your friends post updates about locations
              </Text>
            </View>
            <Switch
              value={preferences.location_updates}
              onValueChange={(value) => updatePreference('location_updates', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.location_updates ? '#3b82f6' : '#9ca3af'}
            />
          </View>

          {/* Points Earned */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1f2937' }}>
                Points Earned
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                When you earn points for your contributions
              </Text>
            </View>
            <Switch
              value={preferences.points_earned}
              onValueChange={(value) => updatePreference('points_earned', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.points_earned ? '#3b82f6' : '#9ca3af'}
            />
          </View>

          {/* Comments & Replies */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1f2937' }}>
                Comments & Replies
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                When someone comments on your updates
              </Text>
            </View>
            <Switch
              value={preferences.comments_replies}
              onValueChange={(value) => updatePreference('comments_replies', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.comments_replies ? '#3b82f6' : '#9ca3af'}
            />
          </View>

          {/* General Updates */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1f2937' }}>
                General Updates
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                App updates, new features, and announcements
              </Text>
            </View>
            <Switch
              value={preferences.general_updates}
              onValueChange={(value) => updatePreference('general_updates', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.general_updates ? '#3b82f6' : '#9ca3af'}
            />
          </View>
        </View>

        {/* Test Notification */}
        <View style={{ backgroundColor: 'white', marginBottom: 16 }}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
              Test Notifications
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              Send a test notification to verify your settings
            </Text>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingVertical: 16,
            }}
            onPress={sendTestNotification}
          >
            <Ionicons name="notifications-outline" size={20} color="#6b7280" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 16, color: '#1f2937', flex: 1 }}>Send Test Notification</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Notification History */}
        <View style={{ backgroundColor: 'white', marginBottom: 16 }}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
              Notification History
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              View and manage your notification history
            </Text>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingVertical: 16,
            }}
            onPress={() => router.push('/app/notifications' as any)}
          >
            <Ionicons name="time-outline" size={20} color="#6b7280" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 16, color: '#1f2937', flex: 1 }}>View All Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={{ backgroundColor: 'white', marginBottom: 24 }}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
              Help & Support
            </Text>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingVertical: 16,
            }}
            onPress={() => Alert.alert('Help', 'If you\'re not receiving notifications, please check:\n\n1. Your device notification settings\n2. App permissions\n3. Do Not Disturb mode\n4. Battery optimization settings')}
          >
            <Ionicons name="help-circle-outline" size={20} color="#6b7280" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 16, color: '#1f2937', flex: 1 }}>Notification Troubleshooting</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
} 