import { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import notificationService from '@/services/notificationService';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  location?: string;
  interests?: string;
  profile_pic_url?: string | null;
  created_at: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      const [storedToken, storedUserData] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userData'),
      ]);

      if (storedToken && storedUserData) {
        setToken(storedToken);
        setUser(JSON.parse(storedUserData));
        
        // Initialize notifications for already authenticated user
        try {
          await notificationService.initialize();
          console.log('Push token registered successfully for existing session');
        } catch (notificationError) {
          console.error('Error registering push token for existing session:', notificationError);
          // Don't block auth check if notification registration fails
        }
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, userData: User) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('userToken', newToken),
        AsyncStorage.setItem('userData', JSON.stringify(userData)),
      ]);
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Unregister push token before logout
      try {
        const token = await notificationService.getPushToken();
        if (token) {
          await notificationService.unregisterPushToken(token);
          console.log('Push token unregistered successfully during logout');
        }
      } catch (notificationError) {
        console.error('Error unregistering push token during logout:', notificationError);
        // Don't block logout if notification unregistration fails
      }
      
      await Promise.all([
        AsyncStorage.removeItem('userToken'),
        AsyncStorage.removeItem('userData'),
      ]);
      setToken(null);
      setUser(null);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const updateUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    checkAuthStatus,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}