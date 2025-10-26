import { SocialConnections } from "@/components/social-connections";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { View } from "react-native";

export default function Login() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text variant={"h1"}>Welcome to Gaan Bei</Text>
      <Button
        onPress={async () => {
          await authClient.signIn.social({
            provider: "google",
            callbackURL: "/",
          });
        }}
      >
        <Text>Login</Text>
      </Button>
      <SocialConnections />
    </View>
  );
}
