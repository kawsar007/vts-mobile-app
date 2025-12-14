import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = 'http://69.167.170.135/api';
const POLLING_INTERVAL = 10000;

export const useVehicleFollow = (mapRef) => {
  const [followingVehicle, setFollowingVehicle] = useState(null);
  const [followPath, setFollowPath] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const intervalRef = useRef(null);
  const lastLocationRef = useRef(null);

  const fetchLastLocation = useCallback(async (vehiclePlate) => {

    try {
      const response = await fetch(`${API_BASE}/location/last?vehicles=${vehiclePlate}`);
      const data = await response.json();
      console.log("Response Data:===>", data.data);

      if (data?.data && data?.data?.length > 0) {
        const location = data?.data[0];
        const lat = parseFloat(location.latitude);
        const lng = parseFloat(location.longitude);

        if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0)) {
          return {
            latitude: lat,
            longitude: lng,
            speed: location.speed,
            engine: location.engine,
            time: location.time,
            ac: location.ac,
            batt_level: location.batt_level,
            fuel: location.fuel,
            network_strength: location.network_strength,
            satellite: location.satellite,
            temp: location.temp,
            data_status: location["data-status"]
          }
        }

      }
      return null;
    } catch (error) {
      console.error('Error fetching vehicle location:', error);
      return null;
    }
  }, []);

  // Calculate bearing between two points
  const calculateBearing = useCallback((start, end) => {
    const startLat = start.latitude * Math.PI / 180;
    const startLng = start.longitude * Math.PI / 180;
    const endLat = end.latitude * Math.PI / 180;
    const endLng = end.longitude * Math.PI / 180;

    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }, []);

  // Start following a vehicle
  const startFollowing = useCallback(async (vehiclePlate) => {
    if (followingVehicle === vehiclePlate) {
      // Stop following if already following this vehicle
      stopFollowing();
      return;
    }

    // Clear previous path
    setFollowPath([]);
    lastLocationRef.current = null;

    // Fetch initial location
    const initialLocation = await fetchLastLocation(vehiclePlate);
    if (!initialLocation) {
      console.error('Could not get initial location');
      return;
    }

    // Set initial path
    setFollowPath([initialLocation]);
    lastLocationRef.current = initialLocation;
    setFollowingVehicle(vehiclePlate);
    setIsFollowing(true);

    // Animate map to vehicle
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }

    // Start polling for updates
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      const newLocation = await fetchLastLocation(vehiclePlate);

      if (newLocation) {
        const lastLoc = lastLocationRef.current;

        // Check if location has actually changed
        if (lastLoc &&
          Math.abs(newLocation.latitude - lastLoc.latitude) < 0.00001 &&
          Math.abs(newLocation.longitude - lastLoc.longitude) < 0.00001) {
          return; // Location hasn't changed significantly
        }

        // Add bearing if we have a previous location
        if (lastLoc) {
          newLocation.bearing = calculateBearing(lastLoc, newLocation);
        }

        // Update path
        setFollowPath(prev => [...prev, newLocation]);
        lastLocationRef.current = newLocation;

        // Keep map centered on vehicle
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 500);
        }
      }
    }, POLLING_INTERVAL);
  }, [followingVehicle, fetchLastLocation, calculateBearing, mapRef]);

  // Stop following
  const stopFollowing = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsFollowing(false);
    setFollowingVehicle(null);
    setFollowPath([]);
    lastLocationRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    followingVehicle,
    followPath,
    isFollowing,
    startFollowing,
    stopFollowing,
  };
};