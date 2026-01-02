// app/(dashboard)/layout.js
import React, { useState, useEffect } from "react";
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
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import UserOnly from "../../components/auth/UserOnly";
import { useUser } from "../../hooks/useUser";
import GoogleMap from "./map";
import { NotificationDrawer } from "../../components/layout/NotificationDrawer";
import { SideNavigationDrawer } from "../../components/layout/SideNavDrawer";
import { useNotifications } from "../../hooks/useNotification";

const { width, height } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.75;

export default function DashboardLayout() {
  const { logout, user, validateToken, getAuthToken } = useUser();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const isDark = colorScheme === "dark";
  const [authToken, setAuthToken] = useState(null);

  const {
    notifications,
    counts,
    loading,
    loadingAction,
    fetchNotifications,
    markAsSeen,
    markAllAsSeen,
  } = useNotifications(authToken);

  //   useEffect(() => {
  // logout()
  //   }, []);

  const [activeTab, setActiveTab] = useState("map");
  const [showVehicles, setShowVehicles] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // Drawer states
  const [showSideNav, setShowSideNav] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sideNavAnim] = useState(new Animated.Value(-DRAWER_WIDTH));
  const [notifAnim] = useState(new Animated.Value(width));

  const inactiveColor = isDark ? "#6b7280" : "#9ca3af";

  useEffect(() => {
    async function loadToken() {
      const token = await getAuthToken();
      setAuthToken(token);
    }

    loadToken();
  }, []);

  // Token validation on app state change (when app comes to foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // App came to foreground - validate token
        validateToken(true).then((isValid) => {
          if (isValid === false) {
            console.log("Session expired - redirecting to login");
          }
        });
      }
    });

    return () => subscription.remove();
  }, [validateToken]);

  // Side Navigation Animation
  useEffect(() => {
    Animated.timing(sideNavAnim, {
      toValue: showSideNav ? 0 : -DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSideNav]);

  // Notification Drawer Animation
  useEffect(() => {
    Animated.timing(notifAnim, {
      toValue: showNotifications ? 0 : width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showNotifications]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const toggleSideNav = () => setShowSideNav(!showSideNav);
  const toggleNotifications = () => setShowNotifications(!showNotifications);

  console.log("Auth Token:=====---===>", authToken);

  return (
    <UserOnly>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        {/* Top Bar */}
        <View
          style={[
            styles.topNav,
            { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
          ]}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleSideNav}>
            <Ionicons name='menu' size={28} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.appTitle, { color: isDark ? "#fff" : "#000" }]}>
            GeonVTS
          </Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={toggleNotifications}>
            <Ionicons
              name='notifications-outline'
              size={26}
              color={isDark ? "#fff" : "#000"}
            />
            {counts.unseen > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {counts.unseen > 99 ? "99+" : counts.unseen}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* MAP + MODALS */}
        <GoogleMap
          showVehicles={showVehicles}
          onCloseVehicles={() => {
            setShowVehicles(false);
            setActiveTab("map");
          }}
          showHistory={showHistory}
          onCloseHistory={() => {
            setShowHistory(false);
            setActiveTab("map");
          }}
          historyData={historyData}
          setHistoryData={setHistoryData}
        />

        {/* Custom Bottom Tab */}
        <View
          style={[
            styles.tabBar,
            { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
          ]}>
          <TabButton
            icon='map'
            label='Map'
            active={activeTab === "map"}
            onPress={() => {
              setShowVehicles(false);
              setShowHistory(false);
              setActiveTab("map");
            }}
            theme={theme}
            inactiveColor={inactiveColor}
          />
          <TabButton
            icon='history'
            label='History'
            active={activeTab === "history"}
            onPress={() => {
              setShowHistory(true);
              setActiveTab("history");
            }}
            theme={theme}
            inactiveColor={inactiveColor}
            isFontAwesome
          />
          <TabButton
            icon='car'
            label='Vehicles'
            active={activeTab === "vehicles"}
            onPress={() => {
              setShowVehicles(true);
              setActiveTab("vehicles");
            }}
            theme={theme}
            inactiveColor={inactiveColor}
          />
        </View>

        {/* Side Navigation Drawer */}
        <SideNavigationDrawer
          visible={showSideNav}
          onClose={() => setShowSideNav(false)}
          animValue={sideNavAnim}
          isDark={isDark}
          user={user}
          onLogout={handleLogout}
        />

        {/* Notification Drawer */}
        <NotificationDrawer
          visible={showNotifications}
          onClose={() => setShowNotifications(false)}
          animValue={notifAnim}
          isDark={isDark}
          authToken={authToken}
        />
      </SafeAreaView>
    </UserOnly>
  );
}

// Reusable Tab Button
const TabButton = ({
  icon,
  label,
  active,
  onPress,
  theme,
  inactiveColor,
  isFontAwesome,
}) => (
  <TouchableOpacity style={styles.tabButton} onPress={onPress}>
    {isFontAwesome ? (
      <FontAwesome5
        name={icon}
        size={24}
        color={active ? theme.iconColorFocused : inactiveColor}
      />
    ) : (
      <Ionicons
        name={active ? icon : `${icon}-outline`}
        size={26}
        color={active ? theme.iconColorFocused : inactiveColor}
      />
    )}
    <Text
      style={[
        styles.tabLabel,
        { color: active ? theme.iconColorFocused : inactiveColor },
      ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  iconButton: { padding: 8 },
  appTitle: { fontSize: 20, fontWeight: "700" },
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  tabBar: {
    flexDirection: "row",
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#333",
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  tabLabel: { fontSize: 12, fontWeight: "600" },
});


// // app/(dashboard)/layout.js
// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Modal,
//   Dimensions,
//   StatusBar,
//   Alert,
//   Platform,
//   Animated,
//   TouchableWithoutFeedback,
//   ScrollView,
//   AppState,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useColorScheme } from "react-native";
// import { Colors } from "../../constants/Colors";
// import { Ionicons } from "@expo/vector-icons";
// import AntDesign from "@expo/vector-icons/AntDesign";
// import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
// import UserOnly from "../../components/auth/UserOnly";
// import { useUser } from "../../hooks/useUser";
// import GoogleMap from "./map";
// import { NotificationDrawer } from "../../components/layout/NotificationDrawer";
// import { SideNavigationDrawer } from "../../components/layout/SideNavDrawer";
// import { useNotifications } from "../../hooks/useNotification";

// const { width, height } = Dimensions.get("window");
// const DRAWER_WIDTH = width * 0.75;

// export default function DashboardLayout() {
//   const { logout, user, validateToken, getAuthToken } = useUser();
//   const colorScheme = useColorScheme();
//   const theme = Colors[colorScheme] ?? Colors.light;
//   const isDark = colorScheme === "dark";
//   const [authToken, setAuthToken] = useState(null);

//   const {
//     notifications,
//     counts,
//     loading,
//     loadingAction,
//     fetchNotifications,
//     markAsSeen,
//     markAllAsSeen,
//   } = useNotifications(authToken);

//   //   useEffect(() => {
//   // logout()
//   //   }, []);

//   const [activeTab, setActiveTab] = useState("map");
//   const [showVehicles, setShowVehicles] = useState(false);
//   const [showHistory, setShowHistory] = useState(false);
//   const [historyData, setHistoryData] = useState([]);

//   // Drawer states
//   const [showSideNav, setShowSideNav] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [sideNavAnim] = useState(new Animated.Value(-DRAWER_WIDTH));
//   const [notifAnim] = useState(new Animated.Value(width));

//   const inactiveColor = isDark ? "#6b7280" : "#9ca3af";

//   useEffect(() => {
//     async function loadToken() {
//       const token = await getAuthToken();
//       setAuthToken(token);
//     }

//     loadToken();
//   }, []);

//   // Token validation on app state change (when app comes to foreground)
//   useEffect(() => {
//     const subscription = AppState.addEventListener("change", (nextAppState) => {
//       if (nextAppState === "active") {
//         // App came to foreground - validate token
//         validateToken(true).then((isValid) => {
//           if (isValid === false) {
//             console.log("Session expired - redirecting to login");
//           }
//         });
//       }
//     });

//     return () => subscription.remove();
//   }, [validateToken]);

//   // Side Navigation Animation
//   useEffect(() => {
//     Animated.timing(sideNavAnim, {
//       toValue: showSideNav ? 0 : -DRAWER_WIDTH,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();
//   }, [showSideNav]);

//   // Notification Drawer Animation
//   useEffect(() => {
//     Animated.timing(notifAnim, {
//       toValue: showNotifications ? 0 : width,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();
//   }, [showNotifications]);

//   const handleLogout = () => {
//     Alert.alert("Logout", "Are you sure?", [
//       { text: "Cancel", style: "cancel" },
//       { text: "Logout", style: "destructive", onPress: logout },
//     ]);
//   };

//   const toggleSideNav = () => setShowSideNav(!showSideNav);
//   const toggleNotifications = () => setShowNotifications(!showNotifications);

//   console.log("Auth Token:=====---===>", authToken);

//   return (
//     <UserOnly>
//       <SafeAreaView
//         style={[
//           styles.container,
//           { backgroundColor: isDark ? "#000" : "#fff" },
//         ]}>
//         <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

//         {/* Top Bar */}
//         <View
//           style={[
//             styles.topNav,
//             { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
//           ]}>
//           <TouchableOpacity style={styles.iconButton} onPress={toggleSideNav}>
//             <Ionicons name='menu' size={28} color={isDark ? "#fff" : "#000"} />
//           </TouchableOpacity>
//           <Text style={[styles.appTitle, { color: isDark ? "#fff" : "#000" }]}>
//             GeonVTS
//           </Text>
//           <TouchableOpacity
//             style={styles.iconButton}
//             onPress={toggleNotifications}>
//             <Ionicons
//               name='notifications-outline'
//               size={26}
//               color={isDark ? "#fff" : "#000"}
//             />
//           </TouchableOpacity>
//         </View>

//         {/* MAP + MODALS */}
//         <GoogleMap
//           showVehicles={showVehicles}
//           onCloseVehicles={() => {
//             setShowVehicles(false);
//             setActiveTab("map");
//           }}
//           showHistory={showHistory}
//           onCloseHistory={() => {
//             setShowHistory(false);
//             setActiveTab("map");
//           }}
//           historyData={historyData}
//           setHistoryData={setHistoryData}
//         />

//         {/* Custom Bottom Tab */}
//         <View
//           style={[
//             styles.tabBar,
//             { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
//           ]}>
//           <TabButton
//             icon='map'
//             label='Map'
//             active={activeTab === "map"}
//             onPress={() => {
//               setShowVehicles(false);
//               setShowHistory(false);
//               setActiveTab("map");
//             }}
//             theme={theme}
//             inactiveColor={inactiveColor}
//           />
//           <TabButton
//             icon='history'
//             label='History'
//             active={activeTab === "history"}
//             onPress={() => {
//               setShowHistory(true);
//               setActiveTab("history");
//             }}
//             theme={theme}
//             inactiveColor={inactiveColor}
//             isFontAwesome
//           />
//           <TabButton
//             icon='car'
//             label='Vehicles'
//             active={activeTab === "vehicles"}
//             onPress={() => {
//               setShowVehicles(true);
//               setActiveTab("vehicles");
//             }}
//             theme={theme}
//             inactiveColor={inactiveColor}
//           />
//         </View>

//         {/* Side Navigation Drawer */}
//         <SideNavigationDrawer
//           visible={showSideNav}
//           onClose={() => setShowSideNav(false)}
//           animValue={sideNavAnim}
//           isDark={isDark}
//           user={user}
//           onLogout={handleLogout}
//         />

//         {/* Notification Drawer */}
//         <NotificationDrawer
//           visible={showNotifications}
//           onClose={() => setShowNotifications(false)}
//           animValue={notifAnim}
//           isDark={isDark}
//           authToken={authToken}
//         />
//       </SafeAreaView>
//     </UserOnly>
//   );
// }

// // Reusable Tab Button
// const TabButton = ({
//   icon,
//   label,
//   active,
//   onPress,
//   theme,
//   inactiveColor,
//   isFontAwesome,
// }) => (
//   <TouchableOpacity style={styles.tabButton} onPress={onPress}>
//     {isFontAwesome ? (
//       <FontAwesome5
//         name={icon}
//         size={24}
//         color={active ? theme.iconColorFocused : inactiveColor}
//       />
//     ) : (
//       <Ionicons
//         name={active ? icon : `${icon}-outline`}
//         size={26}
//         color={active ? theme.iconColorFocused : inactiveColor}
//       />
//     )}
//     <Text
//       style={[
//         styles.tabLabel,
//         { color: active ? theme.iconColorFocused : inactiveColor },
//       ]}>
//       {label}
//     </Text>
//   </TouchableOpacity>
// );

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   topNav: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#333",
//   },
//   iconButton: { padding: 8 },
//   appTitle: { fontSize: 20, fontWeight: "700" },
//   tabBar: {
//     flexDirection: "row",
//     height: 70,
//     borderTopWidth: 1,
//     borderTopColor: "#333",
//     elevation: 8,
//   },
//   tabButton: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 4,
//   },
//   tabLabel: { fontSize: 12, fontWeight: "600" },
// });
