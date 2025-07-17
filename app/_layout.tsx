import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../hooks/useAuth';
import notificationService from '../services/notificationService';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Set up notification listeners (but don't initialize tokens here)
    notificationService.setupNotificationListeners();
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="app" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
