import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";
import { SafeAreaView, useColorScheme } from "react-native";
import React from "react";
import { Colors } from "../constants/Colors";

const ThemedView = ({ style, safe = false, ...props }) => {
  const insets = useSafeAreaInsets();
  const colorSchema = useColorScheme();
  const theme = Colors[colorSchema] ?? Colors.light;

  if (!safe)
    return (
      <View
        style={[
          {
            backgroundColor: theme.background,
          },
          style,
        ]}
        {...props}
      />
    );

  

  return (
    <View
      style={[
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        style,
      ]}
      {...props}
    />
  );
};

export default ThemedView;
