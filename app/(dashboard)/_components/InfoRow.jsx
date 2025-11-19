import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function InfoRow({ icon, label, value, isDark }) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={isDark ? "#9ca3af" : "#6b7280"}
        />
        <Text style={[styles.label, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.value, { color: isDark ? "#fff" : "#000" }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: "600" },
});