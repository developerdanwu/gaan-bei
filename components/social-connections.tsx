import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import * as WebBrowser from "expo-web-browser";
import * as React from "react";
import { useEffect } from "react";
import { Image, Platform, View, type ImageSourcePropType } from "react-native";

WebBrowser.maybeCompleteAuthSession();

type SocialProvider = "google";

const SOCIAL_CONNECTION_STRATEGIES: {
  provider: SocialProvider;
  source: ImageSourcePropType;
}[] = [
  {
    provider: "google",
    source: { uri: "https://img.clerk.com/static/google.png?width=160" },
  },
];

export function SocialConnections() {
  useWarmUpBrowser();

  function onSocialLoginPress(provider: SocialProvider) {
    return async () => {
      await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
    };
  }

  return (
    <View className="gap-2 sm:flex-row sm:gap-3">
      {SOCIAL_CONNECTION_STRATEGIES.map((strategy) => {
        return (
          <Button
            key={strategy.provider}
            variant="outline"
            size="sm"
            className="sm:flex-1"
            onPress={onSocialLoginPress(strategy.provider)}
          >
            <Image className="size-4" source={strategy.source} />
          </Button>
        );
      })}
    </View>
  );
}

const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS === "web") return;
    // Preloads the browser for Android/iOS devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};
