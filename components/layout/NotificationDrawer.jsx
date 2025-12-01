import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  StatusBar,
  Alert,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
const { width, height } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.75;

export const NotificationDrawer = ({ visible, onClose, animValue, isDark }) => {
  if (!visible) return null;

  // Sample notifications - replace with real data
  const notifications = [
    {
      id: 1,
      title: "Vehicle Alert",
      message: "Vehicle ABC-123 exceeded speed limit",
      time: "5 min ago",
      unread: true,
      icon: "warning",
      iconColor: "#f59e0b",
    },
    {
      id: 2,
      title: "Maintenance Due",
      message: "Vehicle XYZ-789 is due for service",
      time: "1 hour ago",
      unread: true,
      icon: "construct",
      iconColor: "#3b82f6",
    },
    {
      id: 3,
      title: "Trip Completed",
      message: "Driver John completed route #45",
      time: "2 hours ago",
      unread: false,
      icon: "checkmark-circle",
      iconColor: "#10b981",
    },
  ];

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
                <Text
                  style={[
                    styles.notifTitle,
                    { color: isDark ? "#fff" : "#000" },
                  ]}>
                  Notifications
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons
                    name='close'
                    size={28}
                    color={isDark ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
              </View>

              {/* Notifications List */}
              <ScrollView style={styles.notifList}>
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
                  notifications.map((notif) => (
                    <TouchableOpacity
                      key={notif.id}
                      style={[
                        styles.notifItem,
                        {
                          backgroundColor: notif.unread
                            ? isDark
                              ? "#1f2937"
                              : "#f3f4f6"
                            : "transparent",
                          borderBottomColor: isDark ? "#333" : "#e5e7eb",
                        },
                      ]}>
                      <View
                        style={[
                          styles.notifIcon,
                          { backgroundColor: `${notif.iconColor}20` },
                        ]}>
                        <Ionicons
                          name={notif.icon}
                          size={24}
                          color={notif.iconColor}
                        />
                      </View>
                      <View style={styles.notifContent}>
                        <View style={styles.notifTitleRow}>
                          <Text
                            style={[
                              styles.notifItemTitle,
                              { color: isDark ? "#fff" : "#000" },
                            ]}>
                            {notif.title}
                          </Text>
                          {notif.unread && <View style={styles.unreadBadge} />}
                        </View>
                        <Text
                          style={[
                            styles.notifMessage,
                            { color: isDark ? "#9ca3af" : "#6b7280" },
                          ]}>
                          {notif.message}
                        </Text>
                        <Text
                          style={[
                            styles.notifTime,
                            { color: isDark ? "#6b7280" : "#9ca3af" },
                          ]}>
                          {notif.time}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              {/* Footer Actions */}
              {notifications.length > 0 && (
                <View
                  style={[
                    styles.notifFooter,
                    { borderTopColor: isDark ? "#333" : "#e5e7eb" },
                  ]}>
                  <TouchableOpacity style={styles.footerButton}>
                    <Text
                      style={[styles.footerButtonText, { color: "#3b82f6" }]}>
                      Mark all as read
                    </Text>
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
  // Overlay
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
  notifTitle: {
    fontSize: 20,
    fontWeight: "700",
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
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  notifIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  notifItemTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
  },
  notifMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 12,
  },
  notifFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    alignItems: "center",
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
