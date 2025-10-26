import { Authenticated, Unauthenticated } from "convex/react";
import { Redirect, Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <>
      <Authenticated>
        <Tabs screenOptions={{ tabBarActiveTintColor: "coral" }}>
          <Tabs.Screen name="index" options={{ title: "Home" }} />
          <Tabs.Screen name="login" options={{ title: "Login" }} />
        </Tabs>
      </Authenticated>
      <Unauthenticated>
        <Redirect href="/login" />
      </Unauthenticated>
    </>
  );
}
