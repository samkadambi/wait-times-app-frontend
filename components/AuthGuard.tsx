import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ color: '#6b7280', marginTop: 16 }}>Checking authentication...</Text>
      </View>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Use setTimeout to avoid navigation during render
    setTimeout(() => {
      router.replace('/auth/login');
    }, 0);
    
    return fallback || (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Text style={{ color: '#6b7280' }}>Redirecting to login...</Text>
      </View>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
} 