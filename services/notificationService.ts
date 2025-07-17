import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../utils/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  friend_requests: boolean;
  location_updates: boolean;
  points_earned: boolean;
  comments_replies: boolean;
  general_updates: boolean;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'friend_request' | 'location_update' | 'points_earned' | 'comment_reply' | 'general';
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  sent_at: string;
}

class NotificationService {
  private token: string | null = null;

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    return true;
  }

  // Get push token
  async getPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.token = token.data;
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Register push token with backend
  async registerPushToken(token: string, deviceType: 'ios' | 'android' | 'web'): Promise<boolean> {
    try {
      console.log('Attempting to register push token:', { token: token.substring(0, 20) + '...', deviceType });
      
      const authToken = await this.getStoredToken();
      console.log('Auth token available:', !!authToken);
      
      const response = await fetch(`${API_BASE_URL}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token, deviceType }),
      });

      console.log('Push token registration response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Push token registered successfully:', result);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to register push token:', response.status, errorData);
        return false;
      }
    } catch (error) {
      console.error('Error registering push token:', error);
      return false;
    }
  }

  // Unregister push token
  async unregisterPushToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unregister-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
        body: JSON.stringify({ token }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error unregistering push token:', error);
      return false;
    }
  }

  // Get notification preferences
  async getPreferences(): Promise<NotificationPreferences | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/preferences`, {
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  // Update notification preferences
  async updatePreferences(preferences: NotificationPreferences): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
        body: JSON.stringify(preferences),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  // Get user notifications
  async getNotifications(limit: number = 50, offset: number = 0): Promise<Notification[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${await this.getStoredToken()}`,
          },
        }
      );

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.count || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Send test notification
  async sendTestNotification(title: string = 'Test Notification', body: string = 'This is a test notification'): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
        body: JSON.stringify({ title, body }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  // Initialize notifications
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing notifications...');
      const token = await this.getPushToken();
      console.log('Push token obtained:', !!token);
      
      if (token) {
        const deviceType = Platform.OS as 'ios' | 'android' | 'web';
        console.log('Device type:', deviceType);
        const result = await this.registerPushToken(token, deviceType);
        console.log('Notification initialization result:', result);
        return result;
      }
      console.log('No push token available for initialization');
      return false;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    // Handle notification received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification tapped
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap - navigate to appropriate screen
      this.handleNotificationTap(response.notification.request.content.data);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  // Handle notification tap
  private handleNotificationTap(data: any) {
    // Navigate to appropriate screen based on notification data
    if (data.action === 'friend_request') {
      // Navigate to friend requests screen
      console.log('Navigate to friend requests');
    } else if (data.action === 'location_update') {
      // Navigate to location detail screen
      console.log('Navigate to location:', data.locationName);
    } else if (data.action === 'points_earned') {
      // Navigate to profile screen
      console.log('Navigate to profile');
    }
  }

  // Get stored auth token
  private async getStoredToken(): Promise<string | null> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      return await AsyncStorage.default.getItem('userToken');
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }
}

export default new NotificationService(); 