import { View, Text } from "react-native";
import React from "react";
import { ActivityIndicator } from "react-native";

export default function Wrapper() {
  return (
    <View className="flex-1 justify-center">
      {/* TODO: add custom splash or loadingscreen */}
      <ActivityIndicator size="large" color="gray" /> 
    </View>
  );
}
