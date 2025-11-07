import { Text, useColorScheme } from "react-native";
import React from "react";
import { Colors } from "../constants/Colors";

const ThemedText = ({ style, title = false, ...props }) => {
  const colorSchema = useColorScheme();
  const theme = Colors[colorSchema] ?? Colors.light;

  const textColor = title ? theme.title : theme.text;

  return <Text style={[{ color: textColor }, style]} {...props} />;
};

export default ThemedText
