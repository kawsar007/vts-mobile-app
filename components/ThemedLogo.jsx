import { Image, useColorScheme } from "react-native";
import { default as DarkLogo, default as LightLogo } from "../assets/img/logo.png";

const ThemedLogo = ({ ...props }) => {
  const colorScheme = useColorScheme();
  const logo = colorScheme === "dark" ? LightLogo : DarkLogo;
  return <Image source={logo} style={props.stl} />
};

export default ThemedLogo
