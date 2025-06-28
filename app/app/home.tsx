import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'http://localhost:3001/api';

interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  type: 'park' | 'restaurant' | 'bar' | 'other';
  img_url: string;
  busyness_level: string;
  busyness_score: number;
  update_count: number;
  latest_comment: string;
  last_updated: string;
}

export default function HomeScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [types, setTypes] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [locationsRes, typesRes, citiesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/locations`),
        fetch(`${API_BASE_URL}/locations/types`),
        fetch(`${API_BASE_URL}/locations/cities`),
      ]);

      const locationsData = await locationsRes.json();
      const typesData = await typesRes.json();
      const citiesData = await citiesRes.json();

      setLocations(locationsData);
      setFilteredLocations(locationsData);
      setTypes(typesData);
      setCities(citiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    let filtered = locations;

    if (selectedType !== 'all') {
      filtered = filtered.filter(location => location.type === selectedType);
    }

    if (selectedCity !== 'all') {
      filtered = filtered.filter(location => location.city === selectedCity);
    }

    setFilteredLocations(filtered);
  }, [selectedType, selectedCity, locations]);

  const getBusynessColor = (level: string) => {
    switch (level) {
      case 'very_busy':
        return '#ef4444';
      case 'busy':
        return '#f59e0b';
      case 'moderate':
        return '#f59e0b';
      case 'not_busy':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getBusynessText = (level: string) => {
    switch (level) {
      case 'very_busy':
        return 'Very Busy';
      case 'busy':
        return 'Busy';
      case 'moderate':
        return 'Moderate';
      case 'not_busy':
        return 'Not Busy';
      default:
        return 'Unknown';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'park':
        return 'leaf-outline';
      case 'restaurant':
        return 'restaurant-outline';
      case 'bar':
        return 'wine-outline';
      default:
        return 'location-outline';
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderLocationCard = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 16,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
      }}
      onPress={() => router.push(`/app/location/${item.id}`)}
    >
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons
              name={getTypeIcon(item.type) as any}
              size={24}
              color="#3b82f6"
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
                {item.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>{item.city}</Text>
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
              backgroundColor: getBusynessColor(item.busyness_level),
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
              {getBusynessText(item.busyness_level)}
            </Text>
          </View>
        </View>

        {item.latest_comment && (
          <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }} numberOfLines={2}>
            "{item.latest_comment}"
          </Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>
            {item.update_count} updates
          </Text>
          {item.last_updated && (
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>
              Updated {new Date(item.last_updated).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (
    title: string,
    value: string,
    currentValue: string,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: currentValue === value ? '#2563eb' : '#f3f4f6',
        borderWidth: 1,
        borderColor: currentValue === value ? '#2563eb' : '#d1d5db',
      }}
      onPress={onPress}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: currentValue === value ? 'white' : '#374151',
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 16 }}>Loading locations...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>WaitNSee</Text>
            <Text style={{ color: '#6b7280' }}>Find your perfect spot</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={{ padding: 8 }}
          >
            <Ionicons name="log-out-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 12 }}>Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {renderFilterButton('All', 'all', selectedType, () =>
            setSelectedType('all')
          )}
          {types.map((type) =>
            renderFilterButton(
              type.charAt(0).toUpperCase() + type.slice(1),
              type,
              selectedType,
              () => setSelectedType(type)
            )
          )}
        </View>

        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 12, marginTop: 16 }}>City</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {renderFilterButton('All', 'all', selectedCity, () =>
            setSelectedCity('all')
          )}
          {cities.map((city) =>
            renderFilterButton(
              city,
              city,
              selectedCity,
              () => setSelectedCity(city)
            )
          )}
        </View>
      </View>

      {/* Locations List */}
      <FlatList
        data={filteredLocations}
        renderItem={renderLocationCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="location-outline" size={64} color="#9ca3af" />
            <Text style={{ color: '#6b7280', fontSize: 18, marginTop: 16 }}>No locations found</Text>
            <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
              Try adjusting your filters or check back later
            </Text>
          </View>
        }
      />
    </View>
  );
} 