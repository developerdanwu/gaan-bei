import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as WebBrowser from "expo-web-browser";
import { useColorScheme } from "nativewind";
import * as React from "react";
import { useEffect } from "react";
import { Image, Platform, View, type ImageSourcePropType } from "react-native";

WebBrowser.maybeCompleteAuthSession();

type SocialConnectionStrategy = Extract<
  StartSSOFlowParams["strategy"],
  "oauth_google" | "oauth_github" | "oauth_apple"
>;

const SOCIAL_CONNECTION_STRATEGIES: {
  type: SocialConnectionStrategy;
  source: ImageSourcePropType;
  useTint?: boolean;
}[] = [
  {
    type: "oauth_apple",
    source: { uri: "https://img.clerk.com/static/apple.png?width=160" },
    useTint: true,
  },
  {
    type: "oauth_google",
    source: { uri: "https://img.clerk.com/static/google.png?width=160" },
    useTint: false,
  },
  {
    type: "oauth_github",
    source: { uri: "https://img.clerk.com/static/github.png?width=160" },
    useTint: true,
  },
];

export function SocialConnections() {
  useWarmUpBrowser();
  const { colorScheme } = useColorScheme();

  function onSocialLoginPress(strategy: SocialConnectionStrategy) {
    return async () => {};
  }

  return (
    <View className="gap-2 sm:flex-row sm:gap-3">
      {SOCIAL_CONNECTION_STRATEGIES.map((strategy) => {
        return (
          <Button
            key={strategy.type}
            variant="outline"
            size="sm"
            className="sm:flex-1"
            onPress={onSocialLoginPress(strategy.type)}
          >
            <Image
              className={cn(
                "size-4",
                strategy.useTint && Platform.select({ web: "dark:invert" })
              )}
              tintColor={Platform.select({
                native: strategy.useTint
                  ? colorScheme === "dark"
                    ? "white"
                    : "black"
                  : undefined,
              })}
              source={strategy.source}
            />
          </Button>
        );
      })}
    </View>
  );
}

const useWarmUpBrowser = Platform.select({
  web: () => {},
  default: () => {
    useEffect(() => {
      // Preloads the browser for Android devices to reduce authentication load time
      // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
      void WebBrowser.warmUpAsync();
      return () => {
        // Cleanup: closes browser when component unmounts
        void WebBrowser.coolDownAsync();
      };
    }, []);
  },
});
