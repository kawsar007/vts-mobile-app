import { ActivityIndicator } from "react-native";
import {
  Keyboard,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState } from "react";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import Spacer from "../../components/Spacer";
import { Link } from "expo-router";
import ThemedButton from "../../components/ThemedButton";
import ThemedTextInput from "../../components/ThemedTextInput";
import { useUser } from "../../hooks/useUser";
import { Colors } from "../../constants/Colors";
import ThemedLoader from "../../components/ThemedLoader";

const Login = () => {
  const { user, login } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  console.log("Error:->", error);

  const handleSubmit = async () => {
    setError(null);
    try {
      await login(email, password);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={styles.container}>
        <Spacer />
        <ThemedText title={true} style={styles.title}>
          Login to Your Account.
        </ThemedText>

        <ThemedTextInput
          style={{ width: "80%", marginBottom: 20 }}
          placeholder='Enter yiur email'
          keyboardType='email-address'
          onChangeText={setEmail}
          value={email}
        />

        <ThemedTextInput
          style={{ width: "80%", marginBottom: 20 }}
          placeholder='Enter yiur password'
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />

        <ThemedButton onPress={handleSubmit}>
          <Text style={{ color: "#f2f2f2" }}>Login</Text>
        </ThemedButton>

        <Spacer />
        {error && <Text style={styles.error}>{error}</Text>}

        <Spacer height={100} />
        <Link href='/register'>
          <ThemedText style={{ textAlign: "center" }}>
            Don't have an account? Register here.
          </ThemedText>
        </Link>
        {/* <ThemedLoader /> */}
        {/* <ActivityIndicator size="large" color={Colors.primary} /> */}
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 30,
  },
  error: {
    color: Colors.warning,
    padding: 10,
    backgroundColor: "#f5c1c8",
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 10,
  },
});
