import { authClient } from "@/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { Stack } from "expo-router";
import { Text } from "react-native";
import "../global.css";

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL as string
);

function BaseApp() {
  const { data: session } = authClient.useSession();
  const { isLoading, isAuthenticated } = useConvexAuth();
  console.log("isAuthenticated", isAuthenticated, session);

  if (isLoading) {
    return <Text> loading...</Text>;
  }

  return (
    <Stack>
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
      <BaseApp />
    </ConvexBetterAuthProvider>
  );
}
