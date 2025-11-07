import { useColorScheme } from "react-native";
import { View, Text, Image } from "react-native";
import React from "react";
import DarkLogo from "../assets/img/light-logo.jpg";
import LightLogo from "../assets/img/dark-logo.jpg";

const ThemedLogo = ({ ...props }) => {
  const colorScheme = useColorScheme();
  const logo = colorScheme === "dark" ? LightLogo : DarkLogo;
  return <Image source={logo} style={props.stl} />
};

export default ThemedLogo
