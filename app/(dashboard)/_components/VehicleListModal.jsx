// app/(dashboard)/_components/VehicleListModal.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";

export default function VehicleListModal({
  vehicles,
  locations,
  onClose,
  mapRef,
  isDark,
  followingVehicle,
  onToggleFollow,
}) {
  const handleVehiclePress = (plate) => {
    const loc = locations.find((l) => l.vehicle === plate);
    if (!loc || !mapRef.current) return;

    const lat = parseFloat(loc.latitude);
    const lng = parseFloat(loc.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    mapRef.current.animateToRegion(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      800,
    );
    onClose();
  };

  const handleFollowPress = (plate, e) => {
    e.stopPropagation();
    onToggleFollow(plate);
  };

  const renderItem = ({ item }) => {
    const loc = locations.find((l) => l.vehicle === item.number_plate);
    const isRunning = loc && Number(loc.engine) === 1;
    const isFollowing = followingVehicle === item.number_plate;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleVehiclePress(item.number_plate)}>
        <View style={styles.info}>
          <MaterialCommunityIcons
            name={isRunning ? "truck-fast" : "truck"}
            size={26}
            color={isRunning ? "#22c55e" : "#ef4444"}
          />
          <View style={styles.texts}>
            <Text style={[styles.plate, { color: isDark ? "#fff" : "#000" }]}>
              {item.number_plate}
            </Text>
            <Text style={styles.subtitle}>
              {item.model} • {loc ? `${loc.speed || 0} km/h` : "Offline"}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={(e) => handleFollowPress(item.number_plate, e)}>
            <MaterialCommunityIcons
              name={isFollowing ? "target-account" : "target"}
              size={20}
              color={isFollowing ? "#fff" : "#6366f1"}
            />
          </TouchableOpacity>
          <Ionicons name='chevron-forward' size={22} color='#9ca3af' />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.title}>
            All Vehicles ({vehicles.length})
          </ThemedText>
          {followingVehicle && (
            <Text style={styles.followingText}>
              Following: {followingVehicle}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name='close' size={28} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.number_plate}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: { fontSize: 20, fontWeight: "700" },
  followingText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "600",
    marginTop: 4,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  info: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  texts: { justifyContent: "center", flex: 1 },
  plate: { fontSize: 16, fontWeight: "600" },
  subtitle: { fontSize: 13, color: "#9ca3af" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  followBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  followBtnActive: {
    backgroundColor: "#6366f1",
  },
});
