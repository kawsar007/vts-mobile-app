import { useColorScheme } from "react-native";
import { Tabs } from "expo-router";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import UserOnly from "../../components/auth/UserOnly";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
export default function DashboardLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  return (
    <UserOnly>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.navBackground,
            paddingTop: 10,
            height: 90,
          },
          tabBarActiveTintColor: theme.iconColorFocused,
          tabBarInactiveTintColor: theme.iconColor,
        }}>
        <Tabs.Screen
          name='profile'
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={24}
                color={focused ? theme.iconColorFocused : theme.iconColor}
              />
            ),
          }}
        />

        <Tabs.Screen
          name='map'
          options={{
            title: "G Map",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                size={24}
                name={focused ? "map" : "map-outline"}
                color={focused ? theme.iconColorFocused : theme.iconColor}
              />
            ),
          }}
        />
        <Tabs.Screen
          name='history'
          options={{
            title: "History",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                size={24}
                name={
                  focused ? (
                    <FontAwesome5
                      name='history'
                      size={24}
                      color={focused ? theme.iconColorFocused : theme.iconColor}
                    />
                  ) : (
                    <AntDesign
                      name='history'
                      size={24}
                      color={focused ? theme.iconColorFocused : theme.iconColor}
                    />
                  )
                }
                color={focused ? theme.iconColorFocused : theme.iconColor}
              />
            ),
          }}
        />
      </Tabs>
    </UserOnly>
  );
}
