module.exports = {
  expo: {
    scheme: "vtsapp",
    name: "oton_gps",
    slug: "oton_gps",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      },
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.kawsar007.oton_gps"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow app to use your location."
        }
      ],
      "expo-router",
      "@react-native-community/datetimepicker",
      "expo-font"
    ],
    extra: {
      router: {},
      eas: {
        projectId: "4722e8d6-3ef3-4651-9bb8-ffa3fcbcddb3"
      }
    },
    experiments: {
      autolinkingModuleResolution: true
    }
  }
};