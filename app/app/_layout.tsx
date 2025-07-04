import { Stack } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function AppLayout() {
  return (
    <ProtectedRoute>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="post-update" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="location" />
      </Stack>
    </ProtectedRoute>
  );
} 