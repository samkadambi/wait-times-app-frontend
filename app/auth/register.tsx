import React, { useEffect, useState } from 'react';
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
import Dropdown from '../../components/ui/Dropdown';
import { Ionicons } from '@expo/vector-icons';
import notificationService from '../../services/notificationService';
import { API_BASE_URL } from '../../utils/api';

interface Interest {
  id: number;
  type: string;
}

export default function RegisterScreen() {
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [userInterests, setUserInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<{ id: number; name: string; state: string; country: string }[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const { login } = useAuth();

  const fetchCities = async () => {
    const response = await fetch(`${API_BASE_URL}/cities`);
    const data = await response.json();
    setCities(data);
  }

  const fetchInterests = async () => {
    const response = await fetch(`${API_BASE_URL}/interests`);
    const data = await response.json();
    setInterests(data);
  }

  useEffect(() => {
    fetchCities();
    fetchInterests();
  }, []);

  const handleRegister = async () => {
    if (!first_name.trim() || !last_name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email.trim(),
          password: password.trim(),
          location: location.trim(),
          interests: userInterests.map(interest => interest.id) || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await login(data.token, data.user);
        
        // Initialize notifications after successful registration
        try {
          await notificationService.initialize();
          console.log('Push token registered successfully after registration');
        } catch (notificationError) {
          console.error('Error registering push token after registration:', notificationError);
          // Don't block registration if notification registration fails
        }
        
        router.replace('/app/home');
      } else {
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: 'white', paddingTop: 50, paddingBottom: 50 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
            <Ionicons name="arrow-back" size={24} color="#2563eb" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#2563eb', marginBottom: 8 }}>
              Create Account
            </Text>
            <Text style={{ color: '#6b7280', textAlign: 'center' }}>
              Join GoodEye to help others and stay informed
            </Text>
          </View>

          {/* Registration Form */}
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>First Name *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                }}
                placeholder="Enter your first name"
                value={first_name}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>
            <View>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>Last Name *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                }}
                placeholder="Enter your last name"
                value={last_name}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>Email *</Text>
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
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>Password *</Text>
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

            <Dropdown
              label="Location"
              options={[
                { label: 'Select a city', value: '' },
                ...cities.map((city) => ({
                  label: city.name,
                  value: city.name
                }))
              ]}
              selectedValue={location}
              onValueChange={(itemValue) => setLocation(itemValue)}
              placeholder="Select a city"
            />

            <View>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>Interests (optional)</Text>
              {/* TODO: Add interests checkbox */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {interests.map((interest) => (
                  <TouchableOpacity 
                    key={interest.id} 
                    style={{ 
                      padding: 8, 
                      borderRadius: 8, 
                      backgroundColor: userInterests.some(item => item.id === interest.id) ? '#2563eb' : '#d1d5db' 
                    }} 
                    onPress={() => {
                        if (userInterests.some(item => item.id === interest.id)) {
                        setUserInterests(userInterests.filter(item => item.id !== interest.id));
                      } else {
                        setUserInterests([...userInterests, interest]);
                      }
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '500' }}>{interest.type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
            </View>

            <TouchableOpacity
              style={{
                borderRadius: 8,
                paddingVertical: 16,
                marginTop: 24,
                backgroundColor: isLoading ? '#9ca3af' : '#2563eb',
              }}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600', fontSize: 18 }}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 16 }}
              onPress={handleBackToLogin}
            >
              <Text style={{ color: '#2563eb', textAlign: 'center', fontWeight: '500' }}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={{ marginTop: 32 }}>
            <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 14 }}>
              By creating an account, you agree to our Terms of Service and{' '}
              <Text 
                style={{ color: '#2563eb', textDecorationLine: 'underline' }}
                onPress={() => router.push('/privacy-policy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 