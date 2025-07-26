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
import PeopleCountInput from '../../components/ui/PeopleCountInput';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.0.122:3001/api';

console.log(API_BASE_URL);

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
  const [totalPeopleCount, setTotalPeopleCount] = useState<number | null>(null);
  const [waitingPeopleCount, setWaitingPeopleCount] = useState<number | null>(null);
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
      console.log('Starting image upload for:', imageUri);
      
      // Create form data with proper file object for React Native
      const formData = new FormData();
      
      // For React Native, we need to create a file object with proper metadata
      // Get the file extension from the URI
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1] || 'jpg';
      const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;
      
      // React Native FormData requires a specific format
      const imageFile = {
        uri: imageUri,
        type: mimeType,
        name: `image.${fileType}`,
      };
      
      console.log('Image file object:', imageFile);
      
      // Try different approaches for React Native
      try {
        formData.append('image', imageFile as any);
      } catch (formDataError) {
        console.log('FormData append failed, trying alternative approach:', formDataError);
        // Alternative approach for React Native
        formData.append('image', {
          uri: imageUri,
          type: mimeType,
          name: `image.${fileType}`,
        } as any);
      }
      
      console.log('FormData created, uploading to:', `${API_BASE_URL}/upload/image`);
      
      // Upload to server
      const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it with the boundary
      });
      
      console.log('Upload response status:', uploadResponse.status);
      
      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        console.log('Upload successful, image URL:', uploadData.imageUrl);
        return uploadData.imageUrl;
      } else {
        const errorText = await uploadResponse.text();
        console.error('Upload failed with status:', uploadResponse.status, 'Error:', errorText);
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to upload image: ${errorMessage}`);
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
          total_people_count: totalPeopleCount,
          waiting_people_count: waitingPeopleCount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success feedback with points
        let pointsMessage = '';
        
        if (data.dailyLimitReached) {
          pointsMessage = `Your update has been posted successfully! 🎉\n\n${data.limitMessage}\n\nDaily Progress:\n• Points earned today: ${data.dailyPointsEarned}/100\n• Updates posted today: ${data.dailyUpdatesCount}/10\n\nTotal points: ${data.totalPoints}`;
        } else if (data.pointsEarned) {
          pointsMessage = `Your update has been posted successfully! 🎉\n\nYou earned ${data.pointsEarned} points!\n\nDaily Progress:\n• Points earned today: ${data.dailyPointsEarned}/100\n• Updates posted today: ${data.dailyUpdatesCount}/10\n\nTotal points: ${data.totalPoints}`;
        } else {
          pointsMessage = 'Your update has been posted successfully! 🎉\n\nOther users can now see what\'s happening at this location!';
        }
        
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

  const testUploadConfig = async () => {
    try {
      console.log('Testing upload configuration...');
      const response = await fetch(`${API_BASE_URL}/upload/test`);
      const data = await response.json();
      console.log('Upload config test result:', data);
      Alert.alert('Upload Config Test', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Upload config test failed:', error);
      Alert.alert('Error', 'Failed to test upload configuration');
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
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', flex: 1 }}>
            Post Update
          </Text>
          <TouchableOpacity onPress={testUploadConfig} style={{ padding: 8 }}>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>Test Upload</Text>
          </TouchableOpacity>
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

          {/* People Count Inputs */}
          <PeopleCountInput
            label="Approximate number of people at this location (Optional)"
            value={totalPeopleCount}
            onValueChange={setTotalPeopleCount}
            placeholder="e.g., 15"
            quickOptions={[
              { label: "5+", value: 5 },
              { label: "10+", value: 10 },
              { label: "25+", value: 25 },
              { label: "50+", value: 50 },
              { label: "100+", value: 100 },
            ]}
          />

          <PeopleCountInput
            label="Number of people waiting in line (Optional)"
            value={waitingPeopleCount}
            onValueChange={setWaitingPeopleCount}
            placeholder="e.g., 8"
            quickOptions={[
              { label: "None", value: 0 },
              { label: "5+", value: 5 },
              { label: "10+", value: 10 },
              { label: "20+", value: 20 },
              { label: "50+", value: 50 },
            ]}
          />

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
                      {(totalPeopleCount !== null || waitingPeopleCount !== null) && (
                        <Text style={{ fontSize: 11, color: '#0369a1', marginTop: 2 }}>
                          Will be enhanced with your people counts
                        </Text>
                      )}
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