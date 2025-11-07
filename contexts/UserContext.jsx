import { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
export const UserContext = createContext();

const API_URL = "http://45.33.50.13/api/auth/signin";

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Allowed roles for login
  const ALLOWED_ROLES = ["vehicle_owner", "manager"];

  async function login(username, password) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      console.log("Login Data:--->", data);

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Check if user has allowed roles
      const userRoles = data.user.roles || [];
      const hasAllowedRole = userRoles.some((role) =>
        ALLOWED_ROLES.includes(role),
      );
      if (!hasAllowedRole) {
        throw new Error(
          "Access denied. Only vehicle owners and managers can log in.",
        );
      }

      // Store token and user data
      await AsyncStorage.setItem("authToken", data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(data.user));

      setUser(data.user);

      return {
        success: true,
        // message: "Login successful",
        data: data.user,
      };
    } catch (error) {
      throw Error(error.message);
    }
  }

  async function logout() {
    try {
      // Clear stored data
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  async function getInitialUserValue() {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userData = await AsyncStorage.getItem("userData");

      if (token && userData) {
        const parsedUser = JSON.parse(userData);

        // Verify user still has allowed role
        const userRoles = parsedUser.roles || [];
        const hasAllowedRole = userRoles.some((role) =>
          ALLOWED_ROLES.includes(role),
        );

        if (hasAllowedRole) {
          setUser(parsedUser);
        } else {
          // Clear invalid session
          await logout();
        }
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  }

  // Get stored auth token for API requests
  async function getAuthToken() {
    try {
      return await AsyncStorage.getItem("authToken");
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  useEffect(() => {
    getInitialUserValue();
  }, []);

  return (
    <UserContext.Provider
      value={{ user, login, logout, authChecked, getAuthToken }}>
      {children}
    </UserContext.Provider>
  );
}
