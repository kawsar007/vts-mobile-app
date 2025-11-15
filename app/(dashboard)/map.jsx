import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Text,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import { useVehicles } from "../../hooks/useVehicles";
import { useVehicleLocations } from "../../hooks/useVehicleLocations";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";

const { width, height } = Dimensions.get("window");

const GoogleMap = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const isDark = colorScheme === "dark";
  const [markersRendered, setMarkersRendered] = useState(false);
  const mapRef = useRef(null);

  // Fetch vehicles
  const { vehicles, loading: vehiclesLoading, getNumberPlates } = useVehicles();

  // Get number plates as array
  const numberPlates = getNumberPlates();

  console.log("Number plates:", numberPlates);
  console.log("Total vehicles:", vehicles.length);

  // Fetch vehicle locations
  const {
    locations,
    loading: locationsLoading,
    error,
    refresh,
  } = useVehicleLocations(numberPlates);

  console.log("Locations data:", locations.length);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Initial region (Bangladesh center)
  const [region, setRegion] = useState({
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 5,
    longitudeDelta: 5,
  });

  useEffect(() => {
    if (locations.length > 0 && mapReady) {
      const timer = setTimeout(() => setMarkersRendered(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [locations, mapReady]);

  // Fit map to show all markers
  useEffect(() => {
    if (mapReady && locations.length > 0 && mapRef.current) {
      const coordinates = locations
        .filter((loc) => {
          const lat = parseFloat(loc.latitude);
          const lng = parseFloat(loc.longitude);
          return !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);
        })
        .map((loc) => ({
          latitude: parseFloat(loc.latitude),
          longitude: parseFloat(loc.longitude),
        }));

      console.log("Valid coordinates for fitting:", coordinates.length);

      if (coordinates.length > 0) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: {
              top: 150,
              right: 50,
              bottom: 150,
              left: 50,
            },
            animated: true,
          });
        }, 1500);
      }
    }
  }, [mapReady, locations]);

  // Get vehicle details by number plate
  const getVehicleDetails = (numberPlate) => {
    return vehicles.find((v) => v.number_plate === numberPlate);
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  // Handle marker press
  const handleMarkerPress = (location) => {
    const vehicleDetails = getVehicleDetails(location.vehicle);
    setSelectedVehicle({ ...location, ...vehicleDetails });
  };

  // Close modal
  const closeModal = () => {
    setSelectedVehicle(null);
  };

  // Get marker color based on engine status
  const getMarkerColor = (engine) => {
    return engine === 1 ? "#22c55e" : "#ef4444"; // Green for running, Red for stopped
  };

  // Render vehicle marker
  const renderMarker = (location, index) => {
    const lat = parseFloat(location.latitude);
    const lng = parseFloat(location.longitude);

    console.log(`Marker ${index}:`, location.vehicle, "Lat:", lat, "Lng:", lng);

    // Validate coordinates
    // if (!lat || !lng || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
    //   console.log(`Invalid coordinates for ${location.vehicle}`);
    //   return null;
    // }

    // Only filter out truly invalid or (0,0)
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      console.log(`Invalid coordinates for ${location.vehicle}:`, lat, lng);
      return null;
    }

    const isEngineOn = location.engine === 1;

    return (
      <Marker
        key={`${location.vehicle}-${index}`}
        coordinate={{
          latitude: lat,
          longitude: lng,
        }}
        onPress={() => handleMarkerPress(location)}
        title={location.vehicle}
        description={isEngineOn ? "Running" : "Stopped"}
        // tracksViewChanges={false}
        tracksViewChanges={!markersRendered}>
        <View style={styles.markerContainer}>
          <View
            style={[
              styles.markerInner,
              {
                backgroundColor: getMarkerColor(location.engine),
                shadowColor: getMarkerColor(location.engine),
              },
            ]}>
            <MaterialCommunityIcons
              name={isEngineOn ? "truck-fast" : "truck"}
              size={20}
              color='#fff'
            />
          </View>
          {!isEngineOn && (
            <View style={styles.stopBadge}>
              <MaterialCommunityIcons name='stop' size={10} color='#fff' />
            </View>
          )}
        </View>
      </Marker>
    );
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    console.log("Manual refresh triggered");
    await refresh();
  };

  if (vehiclesLoading) {
    return (
      <ThemedView style={styles.container} safe={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.iconColorFocused} />
          <ThemedText style={styles.loadingText}>
            Loading vehicles...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container} safe={true}>
        <View style={styles.errorContainer}>
          <Ionicons name='alert-circle' size={48} color='#ef4444' />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} safe={true}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onMapReady={() => {
          console.log("Map is ready");
          setMapReady(true);
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}>
        {locations.map((location, index) => renderMarker(location, index))}
      </MapView>

      {/* Loading Overlay */}
      {locationsLoading && !locations.length && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='large' color={theme.iconColorFocused} />
          <ThemedText style={styles.loadingText}>
            Loading locations...
          </ThemedText>
        </View>
      )}

      {/* Top Info Card */}
      <View
        style={[
          styles.topCard,
          {
            backgroundColor: isDark
              ? "rgba(26, 26, 26, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          },
        ]}>
        <View style={styles.topCardRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name='truck-check'
              size={20}
              color={theme.iconColorFocused}
            />
            <ThemedText style={styles.statValue}>
              {locations.length}/{vehicles.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>On Map</ThemedText>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name='engine' size={20} color='#22c55e' />
            <ThemedText style={styles.statValue}>
              {locations.filter((l) => l.engine === 1).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Running</ThemedText>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name='stop' size={20} color='#ef4444' />
            <ThemedText style={styles.statValue}>
              {locations.filter((l) => l.engine === 0).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Stopped</ThemedText>
          </View>
        </View>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity
        style={[
          styles.refreshButton,
          { backgroundColor: theme.iconColorFocused },
        ]}
        onPress={handleRefresh}
        disabled={locationsLoading}>
        {locationsLoading ? (
          <ActivityIndicator size='small' color='#fff' />
        ) : (
          <Ionicons name='refresh' size={24} color='#fff' />
        )}
      </TouchableOpacity>

      {/* Vehicle Details Modal */}
      <Modal
        visible={selectedVehicle !== null}
        transparent={true}
        animationType='slide'
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeModal}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1a1a1a" : "#fff",
              },
            ]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <MaterialCommunityIcons
                  name={selectedVehicle?.engine === 1 ? "truck-fast" : "truck"}
                  size={24}
                  color={getMarkerColor(selectedVehicle?.engine)}
                />
                <ThemedText style={styles.modalTitle}>
                  {selectedVehicle?.vehicle}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons
                  name='close'
                  size={24}
                  color={isDark ? "#fff" : "#000"}
                />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView style={styles.modalScroll}>
              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      selectedVehicle?.engine === 1 ? "#22c55e" : "#ef4444",
                  },
                ]}>
                <Text style={styles.statusText}>
                  {selectedVehicle?.engine === 1 ? "Running" : "Stopped"}
                </Text>
              </View>

              {/* Vehicle Info */}
              <View style={styles.infoSection}>
                <ThemedText style={styles.sectionTitle}>
                  Vehicle Information
                </ThemedText>

                <InfoRow
                  icon='car-info'
                  label='Model'
                  value={selectedVehicle?.model || "N/A"}
                  isDark={isDark}
                />
                <InfoRow
                  icon='car-cog'
                  label='Type'
                  value={selectedVehicle?.vehicle_type || "N/A"}
                  isDark={isDark}
                />
                <InfoRow
                  icon='account'
                  label='Driver'
                  value={selectedVehicle?.driver_name || "Not Assigned"}
                  isDark={isDark}
                />
                <InfoRow
                  icon='account-tie'
                  label='Owner'
                  value={selectedVehicle?.owner_name || "N/A"}
                  isDark={isDark}
                />
              </View>

              {/* Location Info */}
              <View style={styles.infoSection}>
                <ThemedText style={styles.sectionTitle}>
                  Location Details
                </ThemedText>

                <InfoRow
                  icon='map-marker'
                  label='Latitude'
                  value={selectedVehicle?.latitude || "N/A"}
                  isDark={isDark}
                />
                <InfoRow
                  icon='map-marker'
                  label='Longitude'
                  value={selectedVehicle?.longitude || "N/A"}
                  isDark={isDark}
                />
                <InfoRow
                  icon='speedometer'
                  label='Speed'
                  value={`${selectedVehicle?.speed || 0} km/h`}
                  isDark={isDark}
                />
                <InfoRow
                  icon='clock-outline'
                  label='Last Update'
                  value={formatTime(selectedVehicle?.time)}
                  isDark={isDark}
                />
              </View>

              {/* Device Info */}
              <View style={styles.infoSection}>
                <ThemedText style={styles.sectionTitle}>
                  Device Status
                </ThemedText>

                <InfoRow
                  icon='battery'
                  label='Battery'
                  value={`${selectedVehicle?.batt_level || 0}%`}
                  isDark={isDark}
                />
                <InfoRow
                  icon='signal'
                  label='Network'
                  value={`${selectedVehicle?.network_strength || 0}%`}
                  isDark={isDark}
                />
                <InfoRow
                  icon='satellite-variant'
                  label='Satellites'
                  value={selectedVehicle?.satellite || 0}
                  isDark={isDark}
                />
                <InfoRow
                  icon='air-conditioner'
                  label='AC Status'
                  value={selectedVehicle?.ac === 1 ? "On" : "Off"}
                  isDark={isDark}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

// Info Row Component
const InfoRow = ({ icon, label, value, isDark }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={isDark ? "#9ca3af" : "#6b7280"}
      />
      <Text
        style={[styles.infoLabel, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
        {label}
      </Text>
    </View>
    <Text style={[styles.infoValue, { color: isDark ? "#fff" : "#000" }]}>
      {value}
    </Text>
  </View>
);

export default GoogleMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    color: "#ef4444",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  markerContainer: {
    position: "relative",
  },
  markerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 3,
    borderColor: "#fff",
  },
  stopBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  topCard: {
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
  topCardRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
  },
  refreshButton: {
    position: "absolute",
    bottom: 100,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalScroll: {
    padding: 20,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
