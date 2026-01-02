import React, { useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "../../hooks/useNotification";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.75;

// Helper function to format notification time
const formatTime = (dateString) => {
  if (!dateString) return "";

  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
};

// Helper function to map notification types to icons and colors
const getNotificationStyle = (type) => {
  const styles = {
    alert: { icon: "warning", color: "#f59e0b" },
    warning: { icon: "warning", color: "#f59e0b" },
    maintenance: { icon: "construct", color: "#3b82f6" },
    service: { icon: "construct", color: "#3b82f6" },
    success: { icon: "checkmark-circle", color: "#10b981" },
    completed: { icon: "checkmark-circle", color: "#10b981" },
    info: { icon: "information-circle", color: "#3b82f6" },
    error: { icon: "close-circle", color: "#ef4444" },
    default: { icon: "notifications", color: "#6b7280" },
  };

  return styles[type?.toLowerCase()] || styles.default;
};

export const NotificationDrawer = ({
  visible,
  onClose,
  animValue,
  isDark,
  authToken,
  notifications,
  counts,
  loading,
  loadingAction,
  fetchNotifications,
  markAsSeen,
  markAllAsSeen,
}) => {
  // const {
  //   notifications,
  //   counts,
  //   loading,
  //   loadingAction,
  //   fetchNotifications,
  //   markAsSeen,
  //   markAllAsSeen,
  // } = useNotifications(authToken);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification) => {
    // Mark as seen if not already seen
    if (!notification.is_seen) {
      await markAsSeen([notification.id]);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (counts.unseen > 0) {
      await markAllAsSeen();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType='none'
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.notifDrawer,
                {
                  backgroundColor: isDark ? "#1a1a1a" : "#fff",
                  transform: [{ translateX: animValue }],
                },
              ]}>
              {/* Header */}
              <View
                style={[
                  styles.notifHeader,
                  { borderBottomColor: isDark ? "#333" : "#e5e7eb" },
                ]}>
                <View style={styles.headerLeft}>
                  <Text
                    style={[
                      styles.notifTitle,
                      { color: isDark ? "#fff" : "#000" },
                    ]}>
                    Notifications
                  </Text>
                  {counts.unseen > 0 && (
                    <View style={styles.unseenBadge}>
                      <Text style={styles.unseenBadgeText}>
                        {counts.unseen > 99 ? "99+" : counts.unseen}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons
                    name='close'
                    size={28}
                    color={isDark ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
              </View>

              {/* Notifications List */}
              {loading && notifications.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size='large' color='#3b82f6' />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: isDark ? "#9ca3af" : "#6b7280" },
                    ]}>
                    Loading notifications...
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.notifList}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor={isDark ? "#fff" : "#000"}
                    />
                  }>
                  {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons
                        name='notifications-off-outline'
                        size={64}
                        color={isDark ? "#374151" : "#d1d5db"}
                      />
                      <Text
                        style={[
                          styles.emptyText,
                          { color: isDark ? "#6b7280" : "#9ca3af" },
                        ]}>
                        No notifications yet
                      </Text>
                    </View>
                  ) : (
                    notifications.map((notif) => {
                      const notifStyle = getNotificationStyle(
                        notif.type || notif.notification_type,
                      );

                      return (
                        <TouchableOpacity
                          key={notif.id}
                          style={[
                            styles.notifItem,
                            {
                              backgroundColor: !notif.is_seen
                                ? isDark
                                  ? "#1f2937"
                                  : "#f3f4f6"
                                : "transparent",
                              borderBottomColor: isDark ? "#333" : "#e5e7eb",
                            },
                          ]}
                          onPress={() => handleNotificationPress(notif)}>
                          {/* <View
                            style={[
                              styles.notifIcon,
                              { backgroundColor: `${notifStyle.color}20` },
                            ]}>
                            <Ionicons
                              name={notifStyle.icon}
                              size={24}
                              color={notifStyle.color}
                            />
                          </View> */}
                          <View style={styles.notifContent}>
                            <View style={styles.notifTitleRow}>
                              <Text
                                style={[
                                  styles.notifItemTitle,
                                  { color: isDark ? "#fff" : "#000" },
                                ]}
                                numberOfLines={1}>
                                {notif.title}
                              </Text>
                              {!notif.is_seen && (
                                <View style={styles.unreadBadge} />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.notifMessage,
                                { color: isDark ? "#9ca3af" : "#6b7280" },
                              ]}
                              numberOfLines={2}>
                              {notif.message || notif.body}
                            </Text>
                            {notif.number_plate && (
                              <Text
                                style={[
                                  styles.notifVehicle,
                                  { color: isDark ? "#60a5fa" : "#3b82f6" },
                                ]}>
                                Vehicle: {notif.number_plate}
                              </Text>
                            )}
                            <Text
                              style={[
                                styles.notifTime,
                                { color: isDark ? "#6b7280" : "#9ca3af" },
                              ]}>
                              {formatTime(notif.created_at)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              )}

              {/* Footer Actions */}
              {notifications.length > 0 && (
                <View
                  style={[
                    styles.notifFooter,
                    { borderTopColor: isDark ? "#333" : "#e5e7eb" },
                  ]}>
                  <TouchableOpacity
                    style={styles.footerButton}
                    onPress={handleMarkAllAsRead}
                    disabled={loadingAction || counts.unseen === 0}>
                    {loadingAction ? (
                      <ActivityIndicator size='small' color='#3b82f6' />
                    ) : (
                      <Text
                        style={[
                          styles.footerButtonText,
                          {
                            color: counts.unseen === 0 ? "#9ca3af" : "#3b82f6",
                          },
                        ]}>
                        Mark all as read
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  notifDrawer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notifTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  unseenBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  unseenBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  notifList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  notifItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
    alignItems: "flex-start",
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
    justifyContent: "center",
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  notifItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    lineHeight: 20,
  },
  unreadBadge: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#3b82f6",
    marginTop: 1,
  },
  notifMessage: {
    fontSize: 13,
    marginBottom: 3,
    lineHeight: 18,
  },
  notifVehicle: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  notifTime: {
    fontSize: 11,
    marginTop: 1,
  },
  notifFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    alignItems: "center",
    paddingVertical: 4,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
