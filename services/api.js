import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

class ApiService {
  constructor() {
    this.baseURL = BASE_URL;
  }

  // Get token from storage
  async getToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Create headers with authorization
  async getHeaders() {
    const token = await this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Generic fetch method
  async fetchWithAuth(endpoint, options = {}) {
    try {
      const headers = await this.getHeaders();
      const url = `${this.baseURL}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please login again');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Get all vehicles
  async getAllVehicles() {
    return this.fetchWithAuth('vehicle/all-vehicles');
  }

  // Get vehicles with query parameters
  async getVehiclesWithQuery(queryParams = {}) {
    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = `/api/vehicle/all-vehicles${queryString ? `?${queryString}` : ''}`;
    return this.fetchWithAuth(endpoint);
  }
}

export default new ApiService();