import { Unauthenticated } from "convex/react";
import { Redirect } from "expo-router";

export default function HomeScreen() {
  return (
    <Unauthenticated>
      <Redirect href="/sign-in" />
    </Unauthenticated>
  );
}
