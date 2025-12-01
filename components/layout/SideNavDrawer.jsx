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

export const SideNavigationDrawer = ({
  visible,
  onClose,
  animValue,
  isDark,
  user,
  onLogout,
}) => {
  if (!visible) return null;

  const menuItems = [
    {
      icon: "person-outline",
      label: "Profile",
      action: () => console.log("Profile"),
    },
    {
      icon: "car-outline",
      label: "My Vehicles",
      action: () => console.log("Vehicles"),
    },
    {
      icon: "settings-outline",
      label: "Settings",
      action: () => console.log("Settings"),
    },
    {
      icon: "help-circle-outline",
      label: "Help & Support",
      action: () => console.log("Help"),
    },
    {
      icon: "information-circle-outline",
      label: "About",
      action: () => console.log("About"),
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
                styles.sideDrawer,
                {
                  backgroundColor: isDark ? "#1a1a1a" : "#fff",
                  transform: [{ translateX: animValue }],
                },
              ]}>
              {/* User Header */}
              <View
                style={[
                  styles.drawerHeader,
                  { borderBottomColor: isDark ? "#333" : "#e5e7eb" },
                ]}>
                <View style={styles.userAvatar}>
                  <Ionicons
                    name='person'
                    size={32}
                    color={isDark ? "#fff" : "#000"}
                  />
                </View>
                <Text
                  style={[
                    styles.userName,
                    { color: isDark ? "#fff" : "#000" },
                  ]}>
                  {user?.name || user?.email || "Guest User"}
                </Text>
                <Text
                  style={[
                    styles.userEmail,
                    { color: isDark ? "#9ca3af" : "#6b7280" },
                  ]}>
                  {user?.email || ""}
                </Text>
              </View>

              {/* Menu Items */}
              <ScrollView style={styles.menuContainer}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.menuItem,
                      { borderBottomColor: isDark ? "#333" : "#f3f4f6" },
                    ]}
                    onPress={() => {
                      item.action();
                      onClose();
                    }}>
                    <Ionicons
                      name={item.icon}
                      size={24}
                      color={isDark ? "#9ca3af" : "#6b7280"}
                    />
                    <Text
                      style={[
                        styles.menuLabel,
                        { color: isDark ? "#fff" : "#000" },
                      ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Logout */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    styles.logoutItem,
                    { borderBottomColor: isDark ? "#333" : "#f3f4f6" },
                  ]}
                  onPress={() => {
                    onClose();
                    onLogout();
                  }}>
                  <Ionicons name='log-out-outline' size={24} color='#ef4444' />
                  <Text style={[styles.menuLabel, { color: "#ef4444" }]}>
                    Logout
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* App Version */}
              <View style={styles.drawerFooter}>
                <Text
                  style={[
                    styles.versionText,
                    { color: isDark ? "#6b7280" : "#9ca3af" },
                  ]}>
                  TrackFleet v1.0.0
                </Text>
              </View>
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

  // Side Drawer Styles
  sideDrawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  drawerHeader: {
    padding: 24,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  logoutItem: {
    marginTop: 8,
  },
  drawerFooter: {
    padding: 16,
    alignItems: "center",
  },
  versionText: {
    fontSize: 12,
  },
});
