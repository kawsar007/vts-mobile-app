import { StyleSheet, Text, View, Image } from "react-native";
import Logo from "../assets/splash-icon.png";
import { Link } from "expo-router";
import ThemedView from "../components/ThemedView";
import ThemedLogo from "../components/ThemedLogo";
import Spacer from "../components/Spacer";
import ThemedText from "../components/ThemedText";

const Home = () => {
  return (
     <ThemedView style={styles.container}>
      <ThemedLogo stl={styles.img}/>
      <Spacer />

      <ThemedText style={styles.title} title={true}>The Number 1</ThemedText>

      <ThemedText style={{ marginTop: 10, marginBottom: 30 }}>
        Reading List App
      </ThemedText>

      <Link href="/login" style={styles.link}>
        <ThemedText>Login Page</ThemedText>
      </Link>

      <Link href="/register" style={styles.link}>
        <ThemedText>Register Page</ThemedText>
      </Link>

      <Link href="/profile" style={styles.link}>
        <ThemedText>Profile Page</ThemedText>
      </Link>
    </ThemedView>
  );
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  img: {
    marginVertical: 20,
    width: 128,
    height: 128,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    marginVertical: 10,
    borderBottomWidth: 1,
  },
});
