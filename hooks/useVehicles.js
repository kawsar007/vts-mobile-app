import { useState, useEffect, useCallback } from 'react';
import ApiService from "../services/api";
export const useVehicles = (autoFetch = true) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getAllVehicles();
      
      if (response && response.vehicles) {
        setVehicles(response.vehicles);
        setMeta(response.meta);
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch vehicles');
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh function (can be called manually)
  const refresh = useCallback(() => {
    return fetchVehicles();
  }, [fetchVehicles]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchVehicles();
    }
  }, [autoFetch, fetchVehicles]);

  // Get all vehicle number plates as array
  const getNumberPlates = useCallback(() => {
    return vehicles.map(vehicle => vehicle.number_plate);
  }, [vehicles]);

  // Get vehicle number plates as query string
  const getNumberPlatesQuery = useCallback(() => {
    const plates = getNumberPlates();
    return plates.map((plate, index) => `vehicles[${index}]=${encodeURIComponent(plate)}`).join('&');
  }, [getNumberPlates]);

  // Get active vehicles only
  const getActiveVehicles = useCallback(() => {
    return vehicles.filter(vehicle => vehicle.is_active);
  }, [vehicles]);

  // Get vehicles by type
  const getVehiclesByType = useCallback((type) => {
    return vehicles.filter(vehicle => vehicle.vehicle_type === type);
  }, [vehicles]);

  // Get vehicle by ID
  const getVehicleById = useCallback((id) => {
    return vehicles.find(vehicle => vehicle.id === id);
  }, [vehicles]);

  // Get vehicle by number plate
  const getVehicleByNumberPlate = useCallback((numberPlate) => {
    return vehicles.find(vehicle => vehicle.number_plate === numberPlate);
  }, [vehicles]);

  return {
    vehicles,
    loading,
    error,
    meta,
    refresh,
    fetchVehicles,
    getNumberPlates,
    getNumberPlatesQuery,
    getActiveVehicles,
    getVehiclesByType,
    getVehicleById,
    getVehicleByNumberPlate,
  }
}