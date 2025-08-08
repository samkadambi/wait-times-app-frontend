import Constants from 'expo-constants';

// Get API URL from environment or fallback to local development
export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.0.122:3001/api';
export const IMG_UPLOAD_URL = Constants.expoConfig?.extra?.imgUploadUrl || 'http://10.0.0.122:3001/api';

// Helper function to make authenticated API requests
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  token?: string
) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Helper function for GET requests
export const apiGet = (endpoint: string, token?: string) => {
  return apiRequest(endpoint, { method: 'GET' }, token);
};

// Helper function for POST requests
export const apiPost = (endpoint: string, data: any, token?: string) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

// Helper function for PUT requests
export const apiPut = (endpoint: string, data: any, token?: string) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
};

// Helper function for DELETE requests
export const apiDelete = (endpoint: string, token?: string) => {
  return apiRequest(endpoint, { method: 'DELETE' }, token);
}; 