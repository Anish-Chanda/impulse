import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { Slot, useSegments, useRouter } from "expo-router";
import "../global.css";
import { AuthContextProvider, useAuth } from "@/context/authContext";

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // TODO

    if (isAuthenticated == undefined) return;

    const inApp = segments[0] === "(app)";
    if (isAuthenticated && !inApp) {
      // redirect to home
      console.log("isAuthenticated", isAuthenticated);
      console.log("redirect to home");

      router.replace("home");
    } else if (isAuthenticated == false) {
      // redirect to signin
      router.replace("signIn");
    }
  }, [isAuthenticated]);

  return <Slot />;
};

export default function RootLayout() {
  return <AuthContextProvider Children={<MainLayout />} />;
}
