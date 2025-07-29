import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

//const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';
const API_BASE_URL = 'http://Goodeye-backend-env.eba-gerwdqvn.us-east-2.elasticbeanstalk.com/api';


interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    location: string;
    interests: Interest[];
    profile_pic_url: string;
    token?: string;
}

interface Interest {
  id: number;
  type: string;
}

interface City {
  id: number;
  name: string;
  state: string;
  country: string;
}

export default function EditProfileScreen() {
  const { user, token, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [userInterests, setUserInterests] = useState<Interest[]>([]);
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (!user) return false;
    return (
      firstName !== user.first_name ||
      lastName !== user.last_name ||
      email !== user.email ||
      location !== (user.location || '') ||
      userInterests !== (user.interests || []) ||
      editedUserImage !== (user.profile_pic_url || null)
    );
  };
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState<Interest[]>([]);
  const [editedUserImage, setEditedUserImage] = useState<string | null>(null);

  useEffect(() => {
    const loadInterests = async () => {
      const response = await fetch(`${API_BASE_URL}/interests`);
      if (response.ok) {
        const interests = await response.json();
        setInterests(interests);
      }
    };
    if (user) {
      loadUserData();
      fetchCities();
      loadInterests();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      router.replace('/auth/login');
      return;
    }

    const interestsResponse = await fetch(`${API_BASE_URL}/users/${user.id}/interests`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (interestsResponse.ok) {
      const interests = await interestsResponse.json();
      setUserInterests(interests);
    }

    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setEmail(user.email || '');
    setLocation(user.location || '');
    setEditedUserImage(user.profile_pic_url || null);
    setIsLoading(false);
  };

  const fetchCities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cities`);
      if (response.ok) {
        const data = await response.json();
        setCities(data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          location: location.trim(),
          profile_pic_url: editedUserImage,
          interests: userInterests,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Update the auth context with new user data
        if (updatedUser.user) {
          await updateUser(updatedUser.user);
        }
        
        // Show success message briefly
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        // Show detailed success feedback
        Alert.alert(
          'Profile Updated Successfully! 🎉',
          'Your profile has been updated and saved. You can see your changes reflected throughout the app.',
          [
            { 
              text: 'View Profile', 
              onPress: () => router.push('/app/profile'),
              style: 'default'
            },
            { 
              text: 'Continue Editing', 
              onPress: () => {},
              style: 'cancel'
            }
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Update Failed', errorData.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 16 }}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <Text style={{ color: '#6b7280', fontSize: 18 }}>User not found</Text>
      </View>
    );
  }

  const uploadImage = async (imageUri: string): Promise<string | null> => {
    try {
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      //pass tag that says "profile-image"
      formData.append('tag', 'profile-image');
      formData.append('image', {
        uri: imageUri,                // <-- the local file path on device
        name: 'image.jpg',            // <-- a filename for the server
        type: 'image/jpeg',           // <-- the MIME type
      } as any);

      //TODO: add support for .heic images
      
      // Upload to server
      const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await uploadResponse.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      return null;
    }
  };

  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setIsUploadingImage(true);
      const imageUri = result.assets[0].uri;
      const imageUrl = await uploadImage(imageUri);
      setEditedUserImage(imageUrl);
      setIsUploadingImage(false);
      
      if (imageUrl) {
        Alert.alert(
          'Image Uploaded Successfully! 📸',
          'Your profile picture has been uploaded and will be saved when you update your profile.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
    >
      {/* Success Message */}
      {showSuccessMessage && (
        <View style={{
          backgroundColor: '#10b981',
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
            Profile updated successfully!
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 24, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={handleCancel} style={{ marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>
              Edit Profile
              {hasUnsavedChanges() && (
                <Text style={{ fontSize: 14, color: '#f59e0b', marginLeft: 8 }}> • Unsaved Changes</Text>
              )}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Profile Picture Section */}
        <View style={{ backgroundColor: 'white', padding: 24, marginBottom: 16 }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            {editedUserImage ? (
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                marginBottom: 16,
                overflow: 'hidden',
              }}>
                <Image
                  source={{ uri: editedUserImage }}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
              </View>
            ) : (
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: '#3b82f6',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 40, fontWeight: 'bold', color: 'white' }}>
                  {`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={{
                backgroundColor: '#f3f4f6',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
              onPress={handleImageUpload}
              disabled={isUploadingImage}
            >
              <Text style={{ color: isUploadingImage ? '#9ca3af' : '#374151', fontWeight: '500' }}>
                {isUploadingImage ? 'Uploading...' : 'Change Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <View style={{ backgroundColor: 'white', marginBottom: 16 }}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
              Personal Information
            </Text>
          </View>

          <View style={{ padding: 24 }}>
            {/* First Name */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>First Name *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: 'white',
                }}
                placeholder="Enter your first name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            {/* Last Name */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>Last Name *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: 'white',
                }}
                placeholder="Enter your last name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>Email *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: 'white',
                }}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Location */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>Location</Text>
              <View style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: 'white',
              }}>
                <Picker
                  selectedValue={location}
                  onValueChange={(itemValue) => setLocation(itemValue)}
                  style={{ fontSize: 16 }}
                >
                  <Picker.Item label="Select a city" value="" />
                  {cities.map((city) => (
                    <Picker.Item key={city.id} label={city.name} value={city.name} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Interests */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8}}>Interests</Text>
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
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 24 }}>
          <TouchableOpacity
            style={{
              borderRadius: 8,
              paddingVertical: 16,
              backgroundColor: isSaving ? '#9ca3af' : hasUnsavedChanges() ? '#2563eb' : '#d1d5db',
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={handleSave}
            disabled={isSaving || !hasUnsavedChanges()}
          >
            {isSaving && (
              <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
            )}
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600', fontSize: 18 }}>
              {isSaving ? 'Saving Changes...' : hasUnsavedChanges() ? 'Save Changes' : 'No Changes to Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              paddingVertical: 16,
              backgroundColor: 'white',
            }}
            onPress={handleCancel}
          >
            <Text style={{ color: '#374151', textAlign: 'center', fontWeight: '600', fontSize: 18 }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}