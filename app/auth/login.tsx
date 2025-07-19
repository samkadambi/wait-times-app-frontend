import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { apiPost } from '../../utils/api';
import notificationService from '@/services/notificationService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiPost('/auth/login', { email, password });
      await login(data.token, data.user);
      
      // Initialize notifications after successful login
      try {
        await notificationService.initialize();
        console.log('Push token registered successfully after login');
      } catch (notificationError) {
        console.error('Error registering push token after login:', notificationError);
        // Don't block login if notification registration fails
      }
      
      router.replace('/app/home');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: 'white' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#2563eb', marginBottom: 8 }}>
              GoodEye
            </Text>
            <Text style={{ fontSize: 18, color: '#6b7280', textAlign: 'center' }}>
              Know before you go
            </Text>
          </View>

          {/* Login Form */}
          <View style={{ gap: 24 }}>
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>Email</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                  }}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              <View>
                <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>Password</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                  }}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                />
              </View>
            </View>

            <TouchableOpacity
              style={{
                borderRadius: 8,
                paddingVertical: 16,
                backgroundColor: isLoading ? '#9ca3af' : '#2563eb',
              }}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600', fontSize: 18 }}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#d1d5db' }} />
              <Text style={{ color: '#6b7280', paddingHorizontal: 16 }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#d1d5db' }} />
            </View>

            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: '#2563eb',
                borderRadius: 8,
                paddingVertical: 16,
              }}
              onPress={handleRegister}
            >
              <Text style={{ color: '#2563eb', textAlign: 'center', fontWeight: '600', fontSize: 18 }}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={{ marginTop: 48 }}>
            <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 14 }}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 