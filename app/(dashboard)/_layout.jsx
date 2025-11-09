import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Tabs } from "expo-router";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import UserOnly from "../../components/auth/UserOnly";
import { useUser } from "../../hooks/useUser";

const { width } = Dimensions.get("window");

export default function DashboardLayout() {
  const { logout, user } = useUser();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const isDark = colorScheme === "dark";

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);

  // Handle logout
  const handleLogout = () => {
    setDrawerVisible(false);
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: logout,
        },
      ],
      { cancelable: true },
    );
  };

  // Sample notifications - replace with your actual data
  const notifications = [
    {
      id: 1,
      title: "New Message",
      description: "You have a new message from John",
      time: "5m ago",
      read: false,
    },
    {
      id: 2,
      title: "Update Available",
      description: "Version 2.0 is now available",
      time: "1h ago",
      read: false,
    },
    {
      id: 3,
      title: "Location Shared",
      description: "Sarah shared their location with you",
      time: "2h ago",
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Drawer menu items
  const drawerItems = [
    { icon: "home-outline", label: "Home", route: "home" },
    { icon: "settings-outline", label: "Settings", route: "settings" },
    { icon: "help-circle-outline", label: "Help & Support", route: "help" },
    { icon: "information-circle-outline", label: "About", route: "about" },
  ];

  return (
    <UserOnly>
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}>
        <StatusBar
        
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={isDark ? "#1a1a1a" : "#ffffff"}
          translucent={false}
        />
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          {/* Top Navigation Bar */}
          <View
            style={[
              styles.topNav,
              {
                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                borderBottomColor: isDark ? "#333" : "#e0e0e0",
              },
            ]}>
            {/* Menu Button */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setDrawerVisible(true)}
              activeOpacity={0.7}>
              <Ionicons
                name='menu'
                size={28}
                color={isDark ? "#fff" : "#000"}
              />
            </TouchableOpacity>

            {/* App Title */}
            <Text
              style={[styles.appTitle, { color: isDark ? "#fff" : "#000" }]}>
              MyApp
            </Text>

            {/* Notification Button */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setNotificationVisible(true)}
              activeOpacity={0.7}>
              <View>
                <Ionicons
                  name='notifications-outline'
                  size={26}
                  color={isDark ? "#fff" : "#000"}
                />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Drawer Modal */}
          <Modal
            visible={drawerVisible}
            transparent
            animationType='fade'
            onRequestClose={() => setDrawerVisible(false)}>
            <View style={styles.drawerOverlay}>
              <TouchableOpacity
                style={styles.drawerBackground}
                activeOpacity={1}
                onPress={() => setDrawerVisible(false)}
              />
              <View
                style={[
                  styles.drawer,
                  { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
                ]}>
                {/* Drawer Header */}
                <View
                  style={[
                    styles.drawerHeader,
                    { borderBottomColor: isDark ? "#333" : "#e0e0e0" },
                  ]}>
                  <View style={styles.userInfo}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: theme.iconColorFocused },
                      ]}>
                      <Text style={styles.avatarText}>
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text
                        style={[
                          styles.userName,
                          { color: isDark ? "#fff" : "#000" },
                        ]}>
                        {user?.name}
                      </Text>
                      <Text style={styles.userEmail}>{user?.email}</Text>
                    </View>
                  </View>
                </View>

                {/* Drawer Items */}
                <ScrollView style={styles.drawerContent}>
                  {drawerItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.drawerItem,
                        { borderBottomColor: isDark ? "#2a2a2a" : "#f0f0f0" },
                      ]}
                      onPress={() => {
                        setDrawerVisible(false);
                        // Handle navigation here
                        console.log(`Navigate to ${item.route}`);
                      }}
                      activeOpacity={0.7}>
                      <Ionicons
                        name={item.icon}
                        size={24}
                        color={
                          item.danger
                            ? "#ef4444"
                            : isDark
                            ? "#9ca3af"
                            : "#6b7280"
                        }
                      />
                      <Text
                        style={[
                          styles.drawerItemText,
                          {
                            color: item.danger
                              ? "#ef4444"
                              : isDark
                              ? "#d1d5db"
                              : "#374151",
                          },
                        ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {/* Logout Button */}
                  <TouchableOpacity
                    style={[
                      styles.drawerItem,
                      { borderBottomColor: isDark ? "#2a2a2a" : "#f0f0f0" },
                    ]}
                    onPress={handleLogout}
                    activeOpacity={0.7}>
                    <Ionicons
                      name='log-out-outline'
                      size={24}
                      color='#ef4444'
                    />
                    <Text style={[styles.drawerItemText, { color: "#ef4444" }]}>
                      Logout
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* App Version */}
                <View style={styles.drawerFooter}>
                  <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>
              </View>
            </View>
          </Modal>

          {/* Notification Modal */}
          <Modal
            visible={notificationVisible}
            transparent
            animationType='slide'
            onRequestClose={() => setNotificationVisible(false)}>
            <View style={styles.notificationOverlay}>
              <TouchableOpacity
                style={styles.notificationBackground}
                activeOpacity={1}
                onPress={() => setNotificationVisible(false)}
              />
              <View
                style={[
                  styles.notificationPanel,
                  { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
                ]}>
                {/* Notification Header */}
                <View
                  style={[
                    styles.notificationHeader,
                    { borderBottomColor: isDark ? "#333" : "#e0e0e0" },
                  ]}>
                  <Text
                    style={[
                      styles.notificationTitle,
                      { color: isDark ? "#fff" : "#000" },
                    ]}>
                    Notifications
                  </Text>
                  <TouchableOpacity
                    onPress={() => setNotificationVisible(false)}>
                    <Ionicons
                      name='close'
                      size={24}
                      color={isDark ? "#fff" : "#000"}
                    />
                  </TouchableOpacity>
                </View>

                {/* Notification List */}
                <ScrollView style={styles.notificationList}>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <TouchableOpacity
                        key={notification.id}
                        style={[
                          styles.notificationItem,
                          {
                            backgroundColor: notification.read
                              ? "transparent"
                              : isDark
                              ? "#2a2a2a"
                              : "#f3f4f6",
                            borderBottomColor: isDark ? "#2a2a2a" : "#e5e7eb",
                          },
                        ]}
                        activeOpacity={0.7}>
                        <View style={styles.notificationContent}>
                          <Text
                            style={[
                              styles.notificationItemTitle,
                              { color: isDark ? "#fff" : "#000" },
                            ]}>
                            {notification.title}
                          </Text>
                          <Text
                            style={[
                              styles.notificationDescription,
                              { color: isDark ? "#9ca3af" : "#6b7280" },
                            ]}>
                            {notification.description}
                          </Text>
                          <Text style={styles.notificationTime}>
                            {notification.time}
                          </Text>
                        </View>
                        {!notification.read && (
                          <View
                            style={[
                              styles.unreadDot,
                              { backgroundColor: theme.iconColorFocused },
                            ]}
                          />
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyNotifications}>
                      <Ionicons
                        name='notifications-off-outline'
                        size={64}
                        color={isDark ? "#4b5563" : "#d1d5db"}
                      />
                      <Text
                        style={[
                          styles.emptyText,
                          { color: isDark ? "#9ca3af" : "#6b7280" },
                        ]}>
                        No notifications yet
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Bottom Tabs */}
        </SafeAreaView>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
              borderTopWidth: 1,
              borderTopColor: isDark ? "#333" : "#e0e0e0",
              paddingTop: 8,
              paddingBottom: 8,
              height: 65,
              elevation: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            tabBarActiveTintColor: theme.iconColorFocused,
            tabBarInactiveTintColor: isDark ? "#6b7280" : "#9ca3af",
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
              marginTop: 4,
            },
          }}>
          <Tabs.Screen
            name='profile'
            options={{
              title: "Profile",
              tabBarIcon: ({ focused, color }) => (
                <View style={focused && styles.activeTabIcon}>
                  <Ionicons
                    name={focused ? "person" : "person-outline"}
                    size={24}
                    color={color}
                  />
                </View>
              ),
            }}
          />

          <Tabs.Screen
            name='map'
            options={{
              title: "Map",
              tabBarIcon: ({ focused, color }) => (
                <View style={focused && styles.activeTabIcon}>
                  <Ionicons
                    name={focused ? "map" : "map-outline"}
                    size={24}
                    color={color}
                  />
                </View>
              ),
            }}
          />

          <Tabs.Screen
            name='history'
            options={{
              title: "History",
              tabBarIcon: ({ focused, color }) => (
                <View style={focused && styles.activeTabIcon}>
                  {focused ? (
                    <FontAwesome5 name='history' size={22} color={color} />
                  ) : (
                    <AntDesign name='history' size={24} color={color} />
                  )}
                </View>
              ),
            }}
          />
        </Tabs>
      </View>
    </UserOnly>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: "transparent",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  drawerBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawer: {
    width: width * 0.75,
    maxWidth: 320,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: "#6b7280",
  },
  drawerContent: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
  },
  drawerItemText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: "500",
  },
  drawerFooter: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  versionText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  notificationOverlay: {
    flex: 1,
  },
  notificationBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  notificationPanel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: width * 0.85,
    maxWidth: 400,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
    marginTop: 8,
  },
  emptyNotifications: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  activeTabIcon: {
    transform: [{ scale: 1.1 }],
  },
});
