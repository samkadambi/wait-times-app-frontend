import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const API_BASE_URL = 'http://localhost:3001/api';

interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  type: string;
  img_url: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  profile_pic_url: string;
}

export default function PostUpdateScreen() {
  const { locationId, locationName } = useLocalSearchParams<{ locationId?: string; locationName?: string }>();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState(locationId || '');
  const [comment, setComment] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    fetchLocations();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        setUserData(JSON.parse(userDataString));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/locations`);
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      Alert.alert('Error', 'Failed to load locations');
    }
  };

  const pickImage = async () => {
    console.log('Picking image');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log('Result:', result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (imageUri: string): Promise<string | null> => {
    setIsUploadingImage(true);
    try {
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');
      
      // Upload to server
      const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        body: formData,
      });
      
      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        return uploadData.imageUrl;
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePostUpdate = async () => {
    if (!selectedLocation || !comment.trim()) {
      Alert.alert('Error', 'Please select a location and add a comment');
      return;
    }

    if (!userData) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      let uploadedImageUrl = null;
      
      // Upload image if one is selected
      if (image) {
        uploadedImageUrl = await uploadImage(image);
        if (!uploadedImageUrl) {
          setIsLoading(false);
          return; // Stop if image upload failed
        }
      }

      // Post the update with the uploaded image URL
      const response = await fetch(`${API_BASE_URL}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.id,
          location_id: selectedLocation,
          message: comment.trim(),
          img_url: uploadedImageUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success feedback
        Alert.alert(
          'Success! 🎉', 
          'Your update has been posted successfully. Other users can now see what\'s happening at this location!', 
          [
            { 
              text: 'View Updates', 
              onPress: () => router.push('/app/home') 
            }
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to post update');
      }
    } catch (error) {
      console.error('Error posting update:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 24 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={handleBack} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 18, color: '#2563eb' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>
            Post Update
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 20 }}>
          {/* Location Selection */}
          <View>
            <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>
              Select Location *
            </Text>
            <View style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: 'white',
            }}>
              <Picker
                selectedValue={selectedLocation}
                onValueChange={(itemValue) => setSelectedLocation(itemValue)}
                style={{ fontSize: 16 }}
              >
                <Picker.Item label="Choose a location" value="" />
                {locations.map((location) => (
                  <Picker.Item 
                    key={location.id} 
                    label={`${location.name}`} 
                    value={location.id} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Comment */}
          <View>
            <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>
              What's happening? *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
              placeholder="Share what you're seeing... (e.g., 'Long line at the entrance', 'Not too busy right now')"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Image Upload */}
          <View>
            <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>
              Add Photo (Optional)
            </Text>
            {image ? (
              <View style={{ position: 'relative' }}>
                <Image 
                  source={{ uri: image }} 
                  style={{ 
                    width: '100%', 
                    height: 200, 
                    borderRadius: 8,
                    marginBottom: 8
                  }} 
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#f3f4f6',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                    onPress={pickImage}
                  >
                    <Text style={{ color: '#374151', fontWeight: '500' }}>Change Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#ef4444',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                    onPress={() => setImage(null)}
                  >
                    <Text style={{ color: 'white', fontWeight: '500' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={{
                  borderWidth: 2,
                  borderColor: '#d1d5db',
                  borderStyle: 'dashed',
                  borderRadius: 8,
                  padding: 20,
                  alignItems: 'center',
                  backgroundColor: '#f9fafb',
                }}
                onPress={pickImage}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, color: '#9ca3af' }}>📷</Text>
                  <Text style={{ color: '#6b7280', marginTop: 8 }}>Tap to add a photo</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
                    Max 5MB • JPG, PNG
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={{
              borderRadius: 8,
              paddingVertical: 16,
              marginTop: 24,
              backgroundColor: (isLoading || isUploadingImage) ? '#9ca3af' : '#2563eb',
            }}
            onPress={handlePostUpdate}
            disabled={isLoading || isUploadingImage}
          >
            {isLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 18 }}>
                  Posting...
                </Text>
              </View>
            ) : isUploadingImage ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 18 }}>
                  Uploading Image...
                </Text>
              </View>
            ) : (
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600', fontSize: 18 }}>
                Post Update
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
} 