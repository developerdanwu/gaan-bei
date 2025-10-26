import { Authenticated, Unauthenticated } from "convex/react";
import { Redirect, Tabs } from "expo-router";
import { Home } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <>
      <Authenticated>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "coral",
            tabBarShowLabel: false,
            headerShadowVisible: false,
            tabBarStyle: {
              borderTopWidth: 0,
              elevation: 0,
            },
            headerStyle: {
              borderBottomWidth: 0,
              elevation: 0,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Gaan Bei",
              headerTitleAlign: "left",
              tabBarIcon: ({ color, size }) => <Home color={color} size={48} />,
            }}
          />
        </Tabs>
      </Authenticated>
      <Unauthenticated>
        <Redirect href="/login" />
      </Unauthenticated>
    </>
  );
}
