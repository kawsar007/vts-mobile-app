// app/(dashboard)/_components/FollowTopCard.js
import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";

export default function FollowTopCard({
  followingVehicle,
  followPath,
  isDark,
  theme,
  formatTime,
  onExpand,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!followPath || followPath.length === 0) return null;

  const latestData = followPath[followPath.length - 1];
  const isRunning = Number(latestData.engine) === 1;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getStatusColor = (value, type) => {
    if (type === "battery") {
      if (value >= 80) return "#22c55e";
      if (value >= 40) return "#f59e0b";
      return "#ef4444";
    }
    if (type === "network") {
      if (value >= 70) return "#22c55e";
      if (value >= 40) return "#f59e0b";
      return "#ef4444";
    }
    if (type === "satellite") {
      if (value >= 6) return "#22c55e";
      if (value >= 4) return "#f59e0b";
      return "#ef4444";
    }
    return theme.iconColorFocused;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? "rgba(26, 26, 26, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
        },
      ]}
      onPress={toggleExpand}
      activeOpacity={0.8}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="target-account"
            size={20}
            color="#6366f1"
          />
          <ThemedText style={styles.vehicleName}>
            {followingVehicle}
          </ThemedText>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isRunning ? "#22c55e" : "#ef4444" },
            ]}
          />
        </View>
        <MaterialCommunityIcons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={isDark ? "#fff" : "#000"}
        />
      </View>

      {/* Compact View - Always Visible */}
      <View style={styles.compactStats}>
        <View style={styles.compactStatItem}>
          <MaterialCommunityIcons
            name="speedometer"
            size={16}
            color={theme.iconColorFocused}
          />
          <ThemedText style={styles.compactValue}>
            {latestData.speed || 0}
          </ThemedText>
          <ThemedText style={styles.compactLabel}>km/h</ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={styles.compactStatItem}>
          <MaterialCommunityIcons
            name={isRunning ? "engine" : "engine-off"}
            size={16}
            color={isRunning ? "#22c55e" : "#ef4444"}
          />
          <ThemedText style={styles.compactValue}>
            {isRunning ? "Running" : "Stopped"}
          </ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={styles.compactStatItem}>
          <MaterialCommunityIcons
            name="map-marker-path"
            size={16}
            color={theme.iconColorFocused}
          />
          <ThemedText style={styles.compactValue}>
            {followPath.length}
          </ThemedText>
          <ThemedText style={styles.compactLabel}>pts</ThemedText>
        </View>
      </View>

      {/* Expanded View - Detailed Stats */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.separator} />

          {/* Device Health Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Device Health</ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.gridItem}>
                <MaterialCommunityIcons
                  name="battery-70"
                  size={18}
                  color={getStatusColor(latestData.batt_level, "battery")}
                />
                <ThemedText style={styles.gridValue}>
                  {latestData.batt_level || 0}%
                </ThemedText>
                <ThemedText style={styles.gridLabel}>Battery</ThemedText>
              </View>

              <View style={styles.gridItem}>
                <MaterialCommunityIcons
                  name="signal"
                  size={18}
                  color={getStatusColor(
                    latestData.network_strength,
                    "network"
                  )}
                />
                <ThemedText style={styles.gridValue}>
                  {latestData.network_strength || 0}%
                </ThemedText>
                <ThemedText style={styles.gridLabel}>Network</ThemedText>
              </View>

              <View style={styles.gridItem}>
                <MaterialCommunityIcons
                  name="satellite-variant"
                  size={18}
                  color={getStatusColor(latestData.satellite, "satellite")}
                />
                <ThemedText style={styles.gridValue}>
                  {latestData.satellite || 0}
                </ThemedText>
                <ThemedText style={styles.gridLabel}>Satellites</ThemedText>
              </View>
            </View>
          </View>

          {/* Vehicle Status Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Vehicle Status
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.gridItem}>
                <MaterialCommunityIcons
                  name="air-conditioner"
                  size={18}
                  color={
                    Number(latestData.ac) === 1 ? "#22c55e" : "#9ca3af"
                  }
                />
                <ThemedText style={styles.gridValue}>
                  {Number(latestData.ac) === 1 ? "On" : "Off"}
                </ThemedText>
                <ThemedText style={styles.gridLabel}>AC</ThemedText>
              </View>

              <View style={styles.gridItem}>
                <MaterialCommunityIcons
                  name="fuel"
                  size={18}
                  color={theme.iconColorFocused}
                />
                <ThemedText style={styles.gridValue}>
                  {latestData.fuel || 0}
                </ThemedText>
                <ThemedText style={styles.gridLabel}>Fuel</ThemedText>
              </View>

              <View style={styles.gridItem}>
                <MaterialCommunityIcons
                  name="thermometer"
                  size={18}
                  color={theme.iconColorFocused}
                />
                <ThemedText style={styles.gridValue}>
                  {latestData.temp || 0}°C
                </ThemedText>
                <ThemedText style={styles.gridLabel}>Temp</ThemedText>
              </View>
            </View>
          </View>

          {/* Location Info */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Location</ThemedText>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={14}
                color="#9ca3af"
              />
              <ThemedText style={styles.coordText}>
                {latestData.latitude.toFixed(6)}, {latestData.longitude.toFixed(6)}
              </ThemedText>
            </View>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color="#9ca3af"
              />
              <ThemedText style={styles.coordText}>
                {formatTime(latestData.time)}
              </ThemedText>
            </View>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="check-circle"
                size={14}
                color="#22c55e"
              />
              <ThemedText style={styles.coordText}>
                Signal: {latestData.data_status === "A" ? "Active" : "Inactive"}
              </ThemedText>
            </View>
          </View>

          {/* Tap Hint */}
          <View style={styles.hintContainer}>
            <ThemedText style={styles.hintText}>
              Tap to collapse
            </ThemedText>
          </View>
        </View>
      )}

      {/* Collapsed Hint */}
      {!isExpanded && (
        <View style={styles.collapsedHint}>
          <ThemedText style={styles.hintText}>
            Tap for details
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  compactStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  compactValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  compactLabel: {
    fontSize: 11,
    opacity: 0.7,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "#e5e7eb",
  },
  expandedContent: {
    marginTop: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  gridItem: {
    alignItems: "center",
    gap: 4,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  gridLabel: {
    fontSize: 10,
    opacity: 0.7,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  coordText: {
    fontSize: 12,
    opacity: 0.8,
  },
  collapsedHint: {
    alignItems: "center",
    marginTop: 8,
  },
  hintContainer: {
    alignItems: "center",
    marginTop: 4,
  },
  hintText: {
    fontSize: 10,
    opacity: 0.5,
  },
});