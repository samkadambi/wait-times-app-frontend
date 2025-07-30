import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import Constants from 'expo-constants';
import Dropdown from '../../components/ui/Dropdown';
import NotificationBadge from '../../components/NotificationBadge';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.0.122:3001/api';

interface Location {
  id: number;
  name: string;
  address: string;
  city_name: string;
  type: string;
  img_url: string;
  busyness_level: string;
  busyness_score: number;
  update_count: number;
  latest_comment: string;
  last_updated: string;
  today_update_count: number;
  is_favorite?: boolean;
}

interface City {
  id: number;
  name: string;
  state: string;
  country: string;
}

export default function HomeScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFavorites, setShowFavorites] = useState<boolean>(true);
  const [types, setTypes] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, [showFavorites, user]);

  const fetchData = useCallback(async () => {
    try {
      let locationsRes;
      
      if (showFavorites && user) {
        locationsRes = await fetch(`${API_BASE_URL}/locations/user/${user.id}/favorites`);
      } else {
        locationsRes = await fetch(`${API_BASE_URL}/locations/data`);
      }

      const [typesRes, citiesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/locations/types`),
        fetch(`${API_BASE_URL}/cities`),
      ]);

      const locationsData = await locationsRes.json();
      const typesData = await typesRes.json();
      const citiesData = await citiesRes.json();

      // If we're not showing favorites, we need to fetch favorite status for each location
      if (!showFavorites && user) {
        try {
          const favoritesRes = await fetch(`${API_BASE_URL}/locations/user/${user.id}/favorites`);
          const favoritesData = await favoritesRes.json();
          const favoriteIds = new Set(favoritesData.map((fav: any) => fav.id));
          
          // Mark locations as favorite if they're in the user's favorites
          const locationsWithFavorites = locationsData.map((location: Location) => ({
            ...location,
            is_favorite: favoriteIds.has(location.id)
          }));
          
          setLocations(locationsWithFavorites);
          setFilteredLocations(locationsWithFavorites);
        } catch (error) {
          console.error('Error fetching favorites:', error);
          setLocations(locationsData);
          setFilteredLocations(locationsData);
        }
      } else {
        setLocations(locationsData);
        setFilteredLocations(locationsData);
      }
      
      setTypes(typesData);
      setCities(citiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  }, [showFavorites, user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const toggleFavorite = async (locationId: number) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to favorite locations');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/locations/${locationId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state immediately for better UX
        setLocations(prevLocations => 
          prevLocations.map(location => 
            location.id === locationId 
              ? { ...location, is_favorite: result.is_favorite }
              : location
          )
        );
        setFilteredLocations(prevFiltered => 
          prevFiltered.map(location => 
            location.id === locationId 
              ? { ...location, is_favorite: result.is_favorite }
              : location
          )
        );
        
        // If we're in favorites view and the item was unfavorited, refresh the data
        if (showFavorites && !result.is_favorite) {
          setTimeout(() => fetchData(), 100); // Small delay to ensure state updates first
        }
      } else {
        Alert.alert('Error', 'Failed to update favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  useEffect(() => {
    let filtered = locations;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(location => 
        location.name.toLowerCase().includes(query) ||
        location.address.toLowerCase().includes(query) ||
        location.city_name.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(location => location.type === selectedType);
    }

    // Filter by city
    if (selectedCity !== 'all') {
      filtered = filtered.filter(location => location.city_name === selectedCity);
    }

    setFilteredLocations(filtered);
  }, [selectedType, selectedCity, searchQuery, locations, showFavorites]);

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

  const getTypeIcon = (type: string, locationName?: string) => {
    // Check for specific sports courts in the location name
    if (locationName) {
      const name = locationName.toLowerCase();
      
      // Basketball courts
      if (name.includes('basketball')) {
        return 'basketball-outline';
      }
      
      // Tennis courts
      if (name.includes('tennis')) {
        return 'tennisball-outline';
      }
      
      // Volleyball courts
      if (name.includes('volleyball')) {
        return 'football-outline'; // Ionicons doesn't have volleyball, using football as closest
      }
      
      // Soccer fields
      if (name.includes('soccer') || name.includes('football field')) {
        return 'football-outline';
      }
      
      // Baseball fields
      if (name.includes('baseball') || name.includes('diamond')) {
        return 'baseball-outline';
      }
      
      // Swimming pools
      if (name.includes('pool') || name.includes('swimming') || name.includes('beach')) {
        return 'water-outline';
      }
      
      // Gym/fitness
      if (name.includes('gym') || name.includes('fitness') || name.includes('workout')) {
        return 'fitness-outline';
      }
    }
    
    // Fall back to type-based icons
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
      await logout();
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
      onPress={() => {
        router.push(`/app/location/${item.id}`);
      }}
    >
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons
              name={getTypeIcon(item.type, item.name) as any}
              size={24}
              color="#3b82f6"
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
                {item.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>{item.city_name || 'Unknown City'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => toggleFavorite(item.id)}
              style={{ padding: 8, marginRight: 8 }}
            >
              <Ionicons 
                name={item.is_favorite ? "star" : "star-outline"} 
                size={20} 
                color={item.is_favorite ? "#f59e0b" : "#9ca3af"} 
              />
            </TouchableOpacity>
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
        </View>

        {item.latest_comment && (
          <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }} numberOfLines={2}>
            "{item.latest_comment}"
          </Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>
            {item.today_update_count} updates today
          </Text>
          {item.last_updated && (
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>
              Last updated {new Date(item.last_updated).toLocaleDateString()} at {new Date(item.last_updated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </View>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: 'white', 
        paddingHorizontal: 16, 
        paddingVertical: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#e5e7eb',
        paddingTop: Platform.OS === 'ios' ? 0 : 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>GoodEye</Text>
            <Text style={{ color: '#6b7280' }}>Know before you go</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NotificationBadge size="medium" style={{ marginRight: 8 }} />
            <TouchableOpacity
              onPress={() => {
                try {
                  router.push('/app/search');
                } catch (error) {
                  console.error('Navigation error:', error);
                  Alert.alert('Error', 'Could not navigate to search');
                }
              }}
              style={{ padding: 8, marginRight: 8 }}
            >
              <Ionicons name="people-outline" size={24} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                try {
                  router.push('/app/profile');
                } catch (error) {
                  console.error('Navigation error:', error);
                  Alert.alert('Error', 'Could not navigate to profile');
                }
              }}
              style={{ padding: 8, marginRight: 8 }}
            >
              {user?.profile_pic_url ? (
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  overflow: 'hidden',
                }}>
                  <Image
                    source={{ uri: user.profile_pic_url }}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </View>
              ) : (
                <Ionicons name="person-outline" size={24} color="#6b7280" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={{ padding: 8 }}
            >
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f3f4f6',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
          <Ionicons name="search" size={20} color="#6b7280" style={{ marginRight: 12 }} />
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              color: '#1f2937',
            }}
            placeholder="Search locations, addresses, or cities..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={{ marginLeft: 8 }}
            >
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>Filters</Text>
          <TouchableOpacity
            onPress={() => {
              setShowFavorites(!showFavorites);
              setSelectedType('all');
              setSelectedCity('all');
              setSearchQuery('');
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: showFavorites ? '#f59e0b' : '#f3f4f6',
            }}
          >
            <Ionicons 
              name="star" 
              size={16} 
              color={showFavorites ? 'white' : '#6b7280'} 
              style={{ marginRight: 4 }}
            />
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '500', 
              color: showFavorites ? 'white' : '#6b7280' 
            }}>
              Favorites
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Dropdown
              label="Type"
              options={[
                { label: 'All Types', value: 'all' },
                ...types.map(type => ({
                  label: type.charAt(0).toUpperCase() + type.slice(1),
                  value: type
                }))
              ]}
              selectedValue={selectedType}
              onValueChange={setSelectedType}
              placeholder="Select type"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Dropdown
              label="City"
              options={[
                { label: 'All Cities', value: 'all' },
                ...cities.map(city => ({
                  label: city.name,
                  value: city.name
                }))
              ]}
              selectedValue={selectedCity}
              onValueChange={setSelectedCity}
              placeholder="Select city"
            />
          </View>
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
            <Text style={{ color: '#6b7280', fontSize: 18, marginTop: 16 }}>
              {showFavorites ? 'No favorites found' : 'No locations found'}
            </Text>
            <Text style={{ color: '#6b7280', fontSize: 18, marginTop: 16 }}>
              {searchQuery.trim() ? 'No locations found' : 'No locations found'}
            </Text>
            <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
              {searchQuery.trim() 
                ? `No results for "${searchQuery}". Try adjusting your search or filters.`
                : 'Try adjusting your filters or check back later'
              }
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#2563eb',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={() => router.push('/app/post-update')}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
} 