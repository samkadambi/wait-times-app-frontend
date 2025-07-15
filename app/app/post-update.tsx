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
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import Constants from 'expo-constants';
import Dropdown from '../../components/ui/Dropdown';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.0.122:3001/api';

interface Location {
  id: number;
  name: string;
  address: string;
  city_id: number;
  type: string;
  img_url: string;
}

interface City {
  id: number;
  name: string;
  state: string;
  country: string;
}

export default function PostUpdateScreen() {
  const { locationId, locationName } = useLocalSearchParams<{ locationId?: string; locationName?: string }>();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState(locationId || '');
  const [comment, setComment] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City>({ id: 0, name: '', state: '', country: '' });
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analyzedBusyness, setAnalyzedBusyness] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/locations`);
      const data = await response.json();
      setLocations(data);

      //get cities from cities table
      const citiesResponse = await fetch(`${API_BASE_URL}/cities`);
      const citiesData = await citiesResponse.json();
      setCities(citiesData);
      setSelectedCity(citiesData.find((city: City) => city.name == user?.location) || { id: 0, name: '', state: '', country: '' });
    } catch (error) {
      console.error('Error fetching locations:', error);
      Alert.alert('Error', 'Failed to load locations');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

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

  const analyzeImage = async (imageUrl: string): Promise<string | null> => {
    setIsAnalyzingImage(true);
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/image-busyness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.busyness_level;
      } else {
        throw new Error('Failed to analyze image');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
      return null;
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handlePostUpdate = async () => {
    if (!selectedLocation || !comment.trim()) {
      Alert.alert('Error', 'Please select a location and add a comment');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User data not found. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      let uploadedImageUrl = null;
      let busynessLevel = null;
      
      // Upload image if one is selected
      if (image) {
        uploadedImageUrl = await uploadImage(image);
        if (!uploadedImageUrl) {
          setIsLoading(false);
          return; // Stop if image upload failed
        }

        // Analyze image for busyness if upload was successful
        busynessLevel = await analyzeImage(uploadedImageUrl);
        if (busynessLevel) {
          setAnalyzedBusyness(busynessLevel);
        }
      }

      // Post the update with the uploaded image URL and analyzed busyness
      const response = await fetch(`${API_BASE_URL}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          location_id: selectedLocation,
          message: comment.trim(),
          img_url: uploadedImageUrl,
          busyness_level: busynessLevel, // Include analyzed busyness level
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success feedback with points
        const pointsMessage = data.pointsEarned 
          ? `Your update has been posted successfully! 🎉\n\nYou earned ${data.pointsEarned} points!\nTotal points: ${data.totalPoints}`
          : 'Your update has been posted successfully! 🎉\n\nOther users can now see what\'s happening at this location!';
        
        Alert.alert(
          'Success! 🎉', 
          pointsMessage,
        );
        setTimeout(() => {
          router.push('/app/home')
        }, 1000)
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
      <View style={{ padding: 24, paddingTop: 50, }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={handleBack} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 18, color: '#2563eb' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', textAlign: 'center' }}>
            Post Update
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 20 }}>
          {/* City Selection */}
          <Dropdown
            label="Select City *"
            options={[
              { label: 'Choose a city', value: '' },
              ...cities.map((city) => ({
                label: city.name,
                value: city.name
              }))
            ]}
            selectedValue={selectedCity.name}
            onValueChange={(itemValue) => setSelectedCity(cities.find((city) => city.name === itemValue) || { id: 0, name: '', state: '', country: '' })}
            placeholder="Choose a city"
          />
          {/* Location Selection */}
          <Dropdown
            label="Select Location *"
            options={[
              { label: 'Choose a location', value: '' },
              ...locations.filter((location) => location.city_id === selectedCity.id).map((location) => ({
                label: location.name,
                value: location.id.toString()
              }))
            ]}
            selectedValue={selectedLocation}
            onValueChange={(itemValue) => setSelectedLocation(itemValue)}
            placeholder="Choose a location"
          />

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
                
                {/* AI Analysis Result */}
                {analyzedBusyness && (
                  <View style={{ 
                    backgroundColor: '#f0f9ff', 
                    borderWidth: 1, 
                    borderColor: '#0ea5e9', 
                    borderRadius: 8, 
                    padding: 12, 
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Ionicons name="sparkles" size={20} color="#0ea5e9" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#0c4a6e' }}>
                        AI Analysis Complete
                      </Text>
                      <Text style={{ fontSize: 12, color: '#0369a1' }}>
                        Detected: {analyzedBusyness.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Analysis Loading */}
                {isAnalyzingImage && (
                  <View style={{ 
                    backgroundColor: '#fef3c7', 
                    borderWidth: 1, 
                    borderColor: '#f59e0b', 
                    borderRadius: 8, 
                    padding: 12, 
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <ActivityIndicator size="small" color="#f59e0b" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, color: '#92400e' }}>
                      AI analyzing image for busyness...
                    </Text>
                  </View>
                )}

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
                    onPress={() => {
                      setImage(null);
                      setAnalyzedBusyness(null);
                    }}
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
                    Max 5MB • JPG, PNG • AI Analysis
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