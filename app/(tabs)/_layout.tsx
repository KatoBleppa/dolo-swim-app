import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, View } from "react-native";

const PlaceholderImage = require("@/assets/images/LogoSportProNew_Transparent.png");

export default function TabLayout() {
  const HeaderLogo = () => (
    <View style={{ marginLeft: 15 }}>
      <Image
        source={PlaceholderImage}
        style={{
          width: 60,
          height: 60,
          resizeMode: 'contain',
        }}
      />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF", // Blue color for active tabs
        tabBarInactiveTintColor: "#666666", // Dark gray for inactive tabs
        headerStyle: {
          backgroundColor: "#ffffff", // White header background
        },
        headerShadowVisible: true, // Add subtle shadow for definition
        headerTintColor: "#333333", // Dark text in header
        headerLeft: () => <HeaderLogo />,
        tabBarStyle: {
          backgroundColor: "#ffffff", // White tab bar background
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0", // Light gray border for definition
        },
      }}
    >
      
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home-sharp" : "home-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="athletes"
        options={{
          title: "Athletes",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "people-sharp" : "people-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trainings"
        options={{
          title: "Trainings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "barbell" : "barbell-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "stats-chart" : "stats-chart-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trend"
        options={{
          title: "Trend",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "trending-up" : "trending-up-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
