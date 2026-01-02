import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Configure your API base URL
const API_BASE = "http://69.167.170.135/api/"; // Replace with your actual API URL

export const useNotifications = (authToken) => {
  console.log("Auth Token:--->", authToken);
  
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({ total: 0, seen: 0, unseen: 0 });
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [filters, setFilters] = useState({
    is_seen: "",
    number_plate: "",
    from_date: "",
    to_date: "",
    search: "",
    page: 1
  });

  const fetchCounts = useCallback(async () => {
    if (!authToken) return;

    try {
      const res = await axios.get(`${API_BASE}notification/counts`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setCounts(res.data?.counts || { total: 0, seen: 0, unseen: 0 });
    } catch (error) {
      console.error("Failed to fetch notification counts", error);
    }
  }, [authToken]);

  const fetchNotifications = useCallback(async () => {
    if (!authToken) return;

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filters.is_seen) params.append("is_seen", filters.is_seen);
      if (filters.number_plate) params.append("number_plate", filters.number_plate);
      if (filters.from_date) params.append("from_date", filters.from_date);
      if (filters.to_date) params.append("to_date", filters.to_date);
      if (filters.search) params.append("search", filters.search);
      params.append("page", filters.page.toString());
      params.append("limit", "20");

      const res = await axios.get(`${API_BASE}notification/get-all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      console.log("Notifi:--->", res);
      
      
      setNotifications(res.data?.notifications || []);
      setMeta(res.data?.meta || { page: 1, totalPages: 1 });
      setCounts({
        total: res.data?.meta?.total || 0,
        seen: res.data?.meta?.seen || 0,
        unseen: res.data?.meta?.unseen || 0
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [authToken, filters]);

  const markAsSeen = useCallback(async (notificationIds) => {
    if (!authToken || notificationIds.length === 0) return;
    setLoadingAction(true);

    try {
      await axios.put(
        `${API_BASE}notification/seen`,
        { notification_ids: notificationIds },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id)
            ? { ...n, is_seen: true, seen_at: new Date().toISOString() }
            : n
        )
      );

      setCounts((prev) => ({
        ...prev,
        seen: prev.seen + notificationIds.length,
        unseen: Math.max(0, prev.unseen - notificationIds.length)
      }));
    } catch (err) {
      console.error("Failed to mark as seen", err);
    } finally {
      setLoadingAction(false);
    }
  }, [authToken]);

  const markAllAsSeen = useCallback(async () => {
    if (!authToken || counts.unseen === 0) return;
    setLoadingAction(true);

    try {
      await axios.put(
        `${API_BASE}/notification/seen-all`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_seen: true, seen_at: new Date().toISOString() }))
      );
      
      setCounts((prev) => ({ ...prev, seen: prev.total, unseen: 0 }));
    } catch (err) {
      console.error("Failed to mark all as seen", err);
    } finally {
      setLoadingAction(false);
    }
  }, [authToken, counts.unseen]);

  const deleteNotifications = useCallback(async (notificationIds) => {
    if (!authToken || !notificationIds.length) return;
    setLoadingAction(true);

    try {
      await axios.delete(
        `${API_BASE}/notification/delete`,
        {
          data: { notification_ids: notificationIds },
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      const deletedNotifs = notifications.filter(n => notificationIds.includes(n.id));
      const unseenDeleted = deletedNotifs.filter(n => !n.is_seen).length;
      const seenDeleted = deletedNotifs.filter(n => n.is_seen).length;

      setNotifications((prev) => prev.filter((n) => !notificationIds.includes(n.id)));
      
      setCounts((prev) => ({
        ...prev,
        total: prev.total - notificationIds.length,
        seen: Math.max(0, prev.seen - seenDeleted),
        unseen: Math.max(0, prev.unseen - unseenDeleted)
      }));
    } catch (err) {
      console.error("Failed to delete notifications", err);
    } finally {
      setLoadingAction(false);
    }
  }, [authToken, notifications]);

  const clearFilters = useCallback(() => {
    setFilters({
      is_seen: "",
      number_plate: "",
      from_date: "",
      to_date: "",
      search: "",
      page: 1,
    });
  }, []);

  useEffect(() => {
    if (authToken) {
      fetchCounts();
      fetchNotifications();
    }
  }, [authToken, fetchCounts, fetchNotifications]);

  return {
    notifications,
    counts,
    meta,
    loading,
    loadingAction,
    filters,
    setFilters,
    fetchNotifications,
    markAsSeen,
    markAllAsSeen,
    deleteNotifications,
    clearFilters,
  };
};