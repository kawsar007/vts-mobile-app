import { useState, useCallback } from 'react';
import ApiService from "../services/api";

export const useVehicleHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log("MY History:===>", history.length);


  const fetchHistory = useCallback(async (vehicleNumberPlate, startTime, endTime) => {
    if (!vehicleNumberPlate || !startTime || !endTime) {
      setError('Please provide all required parameters');
      return;
    }


    setLoading(true);
    setError(null);

    try {

      const formattedStart = Math.floor(startTime.getTime() / 1000);
      const formattedEnd = Math.floor(endTime.getTime() / 1000);

      const queryString = `vehicle=${encodeURIComponent(vehicleNumberPlate)}&start_time=${encodeURIComponent(formattedStart)}&end_time=${encodeURIComponent(formattedEnd)}`;

      const response = await fetch(
        `http://45.33.50.13/api/location/history?${queryString}`
      );
      const data = await response.json();
      setHistory(data?.data.slice(0, 100));

    } catch (err) {
      setError(err.message || 'Failed to fetch vehicle history');
      console.error('Error fetching history:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setError(null);
  }, [])
  return {
    history,
    loading,
    error,
    fetchHistory,
    clearHistory,
    isHistoryActive: history.length > 0,
  };
}