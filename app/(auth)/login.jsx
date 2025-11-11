import {
  Keyboard,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import Spacer from "../../components/Spacer";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ThemedButton from "../../components/ThemedButton";
import ThemedTextInput from "../../components/ThemedTextInput";
import { useUser } from "../../hooks/useUser";
import { Colors } from "../../constants/Colors";
import ThemedLoader from "../../components/ThemedLoader";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
const Login = () => {
  const { login } = useUser();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Clear error for specific field when user starts typing
  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleUsernameChange = (text) => {
    setUsername(text);
    clearFieldError("username");
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    clearFieldError("password");
  };

  const handleSubmit = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await login(username.trim(), password);
      // Navigation will be handled by your auth flow
    } catch (error) {
      // Handle different error types
      let errorMessage = error.message || "Login failed. Please try again.";

      if (errorMessage.includes("Access denied")) {
        Alert.alert(
          "Access Denied",
          "Your account does not have the required permissions to access this application. Only vehicle owners and managers can log in.",
          [{ text: "OK" }],
        );
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        Alert.alert(
          "Connection Error",
          "Unable to connect to the server. Please check your internet connection and try again.",
          [{ text: "OK" }],
        );
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.container}>
            <View style={styles.headerContainer}>
              <ThemedText title={true} style={styles.title}>
                Welcome Back
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Sign in to continue
              </ThemedText>
            </View>

            <View style={styles.formContainer}>
              {/* General Error Message */}
              {errors.general && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.general}</Text>
                </View>
              )}

              {/* Username Input */}
              <View style={styles.inputWrapper}>
                <ThemedText style={styles.label}>Username</ThemedText>
                <ThemedTextInput
                  style={[styles.input, errors.username && styles.inputError]}
                  placeholder='Enter your username'
                  autoCapitalize='none'
                  autoCorrect={false}
                  onChangeText={handleUsernameChange}
                  value={username}
                  editable={!isLoading}
                />
                {errors.username && (
                  <Text style={styles.fieldError}>{errors.username}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <View style={styles.passwordContainer}>
                  <ThemedTextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder='Enter your password'
                    onChangeText={handlePasswordChange}
                    value={password}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    autoCapitalize='none'
                  />
                  <TouchableOpacity
                    style={styles.eyeIconContainer}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}>
                    <Text style={styles.eyeIcon}>
                      {/* {showPassword ? "👁️" : "👁️‍🗨️"} */}
                      {showPassword ? (
                        <Ionicons name='eye' size={18} />
                      ) : (
                        <Entypo name='eye-with-line' size={18} color='black' />
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.fieldError}>{errors.password}</Text>
                )}
              </View>

              {/* Forgot Password Link */}
              <TouchableWithoutFeedback>
                <View style={styles.forgotPasswordContainer}>
                  <ThemedText style={styles.forgotPasswordText}>
                    Forgot Password?
                  </ThemedText>
                </View>
              </TouchableWithoutFeedback>

              <Spacer height={20} />

              {/* Login Button */}
              <ThemedButton
                onPress={handleSubmit}
                disabled={isLoading}
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}>
                {isLoading ? (
                  <ThemedLoader size='small' color='#f2f2f2' />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </ThemedButton>

              <Spacer height={30} />

              {/* Access Info */}
              <Spacer height={20} />
              <View style={styles.infoContainer}>
                <ThemedText style={styles.infoText}>
                  ℹ️ Access limited to vehicle owners and managers only
                </ThemedText>
              </View>
            </View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    width: "100%",
  },
  passwordContainer: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIconContainer: {
    position: "absolute",
    right: 12,
    top: "35%",
    transform: [{ translateY: -12 }],
    padding: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  inputError: {
    borderColor: Colors.warning,
    borderWidth: 1.5,
  },
  fieldError: {
    color: Colors.warning,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  errorContainer: {
    backgroundColor: "#f5c1c8",
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: Colors.warning,
    fontSize: 14,
    textAlign: "center",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
  loginButton: {
    width: "100%",
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#f2f2f2",
    fontSize: 16,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  infoContainer: {
    backgroundColor: Colors.primary + "15",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  infoText: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.8,
  },
});
