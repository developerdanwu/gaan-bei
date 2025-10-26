import { authClient } from "@/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { Stack } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL as string
);

function BaseApp() {
  const { isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="small" />
      </SafeAreaView>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          title: "Login",
          headerTitleAlign: "left",
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, title: "Home" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ConvexBetterAuthProvider authClient={authClient} client={convex}>
      <SafeAreaProvider>
        <BaseApp />
      </SafeAreaProvider>
    </ConvexBetterAuthProvider>
  );
}
