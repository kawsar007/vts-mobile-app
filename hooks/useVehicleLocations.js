import { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/api';

export const useVehicleLocations = (numberPlates = []) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLocations = useCallback(async () => {
    if (!numberPlates || numberPlates.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query string: vehicles=PLATE1&vehicles=PLATE2
      const queryString = numberPlates
        .map(plate => `vehicles=${encodeURIComponent(plate)}`)
        .join('&');

      const response = await ApiService.fetchWithAuth(
        `/location/last?${queryString}`
      );

      if (response && response.data) {
        console.log('Locations received:', response.data.length);
        setLocations(response.data);
      } else {
        setLocations([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch vehicle locations');
      console.error('Error fetching locations:', err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [numberPlates]);

  useEffect(() => {
    if (numberPlates && numberPlates.length > 0) {
      fetchLocations();

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchLocations();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [numberPlates.length]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    loading,
    error,
    refresh,
  };
};
