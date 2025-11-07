import { View, useColorScheme } from "react-native";
import React from "react";
import { Colors } from "../constants/Colors";

const ThemedCard = ({ style, ...props }) => {
  const colorSchema = useColorScheme();
  const theme = Colors[colorSchema] ?? Colors.light;
  return (
    <View
      style={[{ backgroundColor: theme.background }, styles.card, style]}
      {...props}
    />
  );
};

export default ThemedCard

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 20,
  },
});
