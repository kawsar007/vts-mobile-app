import { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
export const UserContext = createContext();
import { useRouter } from "expo-router";

const API_URL = "http://69.167.170.135/api/auth/signin";
const VALIDATE_TOKEN_URL = "http://69.167.170.135/api/auth/verify-token";

export function UserProvider({ children }) {
  const router = useRouter();
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

      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // Validate token with backend
  async function validateToken(showLog = false) {
    try {
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        if (showLog) console.log("No token found");
        return false;
      }

      const response = await fetch(VALIDATE_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (showLog) {
        console.log("Token validation response:", data);
      }

      // Check if token is valid based on API response
      if (!response.ok || !data.valid) {
        if (showLog) console.log("Token invalid - logging out");
        await logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Token validation error:", error);
      // On network error, don't logout - allow offline usage
      // Return null to indicate we couldn't validate (vs false = invalid)
      return null;
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

          // Validate token on app start (silent validation)
          validateToken(false).then((isValid) => {
            if (isValid === false) {
              console.log("Token invalid on app start - user logged out");
            }
          });
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

  // Enhanced fetch wrapper that handles auth errors
  async function authenticatedFetch(url, options = {}) {
    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error("No authentication token");
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Check for 401 Unauthorized
      if (response.status === 401) {
        console.log("401 Unauthorized - logging out");
        await logout();
        throw new Error("Session expired. Please login again.");
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    getInitialUserValue();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        authChecked,
        getAuthToken,
        validateToken,
        authenticatedFetch,
      }}>
      {children}
    </UserContext.Provider>
  );
}
