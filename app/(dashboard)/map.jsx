// app/(dashboard)/map.js
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Text,
  ScrollView,
  FlatList,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import { useVehicles } from "../../hooks/useVehicles";
import { useVehicleLocations } from "../../hooks/useVehicleLocations";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import VehicleListModal from "./_components/VehicleListModal";
import HistoryModal from "./_components/HistoryModal";
import { useVehicleHistory } from "../../hooks/useVehicleHistory";
import InfoRow from "./_components/InfoRow";
import { calculateBearing } from "../../helper/calculateBearing";
import HistoryRoute from "./_components/HistoryRoute";
import { useVehicleFollow } from "../../hooks/useVehicleFollow";
import FollowPath from "./_components/FollowPath";

const { height } = Dimensions.get("window");

export default function GoogleMap({
  showVehicles,
  onCloseVehicles,
  showHistory,
  onCloseHistory,
}) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const isDark = colorScheme === "dark";

  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [markersRendered, setMarkersRendered] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentRegion, setCurrentRegion] = useState(null);

  // History states
  const [selectedPlate, setSelectedPlate] = useState("");
  const [startDate, setStartDate] = useState(new Date(Date.now() - 86400000));
  const [endDate, setEndDate] = useState(new Date());

  const { vehicles, loading: vehiclesLoading, getNumberPlates } = useVehicles();
  const numberPlates = getNumberPlates();
  const {
    locations,
    loading: locationsLoading,
    error,
    refresh,
  } = useVehicleLocations(numberPlates);

  const {
    history,
    loading: loadingHistory,
    fetchHistory,
    clearHistory,
    isHistoryActive,
  } = useVehicleHistory();

  // Follow feature
  const {
    followingVehicle,
    followPath,
    isFollowing,
    startFollowing,
    stopFollowing,
  } = useVehicleFollow(mapRef);

  const initialRegion = useMemo(
    () => ({
      latitude: 23.8103,
      longitude: 90.4125,
      latitudeDelta: 5,
      longitudeDelta: 5,
    }),
    [],
  );

  // Safe number parsing helper
  const isEngineRunning = useCallback((engine) => {
    if (engine === null || engine === undefined) return false;
    return Number(engine) === 1;
  }, []);

  // FIX: Memoize valid coordinates
  const validLocations = useMemo(() => {
    return locations.filter((l) => {
      const lat = parseFloat(l.latitude);
      const lng = parseFloat(l.longitude);
      return !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);
    });
  }, [locations]);

  // Fit live vehicles
  useEffect(() => {
    if (
      !mapReady ||
      isHistoryActive ||
      isFollowing ||
      validLocations.length === 0
    )
      return;

    const coords = validLocations.map((l) => ({
      latitude: parseFloat(l.latitude),
      longitude: parseFloat(l.longitude),
    }));

    if (coords.length && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 150, left: 80, bottom: 150, right: 80 },
          animated: true,
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [validLocations, mapReady, isHistoryActive, isFollowing]);

  useEffect(() => {
    if (locations.length && mapReady) {
      const t = setTimeout(() => setMarkersRendered(true), 1000);
      return () => clearTimeout(t);
    }
  }, [locations, mapReady]);

  // Memoized helpers
  const getVehicleDetails = useCallback(
    (plate) => vehicles.find((v) => v.number_plate === plate),
    [vehicles],
  );

  const formatTime = useCallback((ts) => {
    if (!ts) return "N/A";
    try {
      return new Date(Number(ts) * 1000).toLocaleString();
    } catch {
      return "N/A";
    }
  }, []);

  const getMarkerColor = useCallback(
    (engine) => {
      return isEngineRunning(engine) ? "#22c55e" : "#ef4444";
    },
    [isEngineRunning],
  );

  const handleFetchHistory = useCallback(
    (plate, start, end) => {
      fetchHistory(plate, start, end);
    },
    [fetchHistory],
  );

  const handleToggleFollow = useCallback(
    (plate) => {
      startFollowing(plate);
    },
    [startFollowing],
  );

  // Memoized marker rendering
  const renderMarker = useCallback(
    (loc) => {
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;

      const running = isEngineRunning(loc.engine);

      return (
        <Marker
          key={loc.vehicle}
          coordinate={{ latitude: lat, longitude: lng }}
          onPress={() => {
            const details = getVehicleDetails(loc.vehicle) || {};
            setSelectedVehicle({ ...loc, ...details });
          }}
          tracksViewChanges={!markersRendered}>
          <View style={styles.markerContainer}>
            <View
              style={[
                styles.markerInner,
                { backgroundColor: running ? "#22c55e" : "#ef4444" },
              ]}>
              <MaterialCommunityIcons
                name={running ? "truck-fast" : "truck"}
                size={20}
                color='#fff'
              />
            </View>
            {!running && (
              <View style={styles.stopBadge}>
                <MaterialCommunityIcons name='stop' size={10} color='#fff' />
              </View>
            )}
          </View>
        </Marker>
      );
    },
    [markersRendered, getVehicleDetails, isEngineRunning],
  );

  // Handle region changes
  const handleRegionChangeComplete = useCallback((region) => {
    setCurrentRegion(region);
  }, []);

  // Memoized stats
  const stats = useMemo(() => {
    const running = validLocations.filter((l) =>
      isEngineRunning(l.engine),
    ).length;
    const stopped = validLocations.length - running;
    return { running, stopped };
  }, [validLocations, isEngineRunning]);

  if (vehiclesLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.iconColorFocused} />
          <ThemedText>Loading vehicles...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        loadingEnabled
        onRegionChangeComplete={handleRegionChangeComplete}>
        {!isHistoryActive && !isFollowing && locations.map(renderMarker)}
        <HistoryRoute
          history={history}
          mapRef={mapRef}
          isHistoryActive={isHistoryActive}
          currentRegion={currentRegion}
        />
        <FollowPath path={followPath} isActive={isFollowing} />
      </MapView>

      {/* Loading Overlay */}
      {locationsLoading && !locations.length && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='large' color={theme.iconColorFocused} />
          <ThemedText>Loading locations...</ThemedText>
        </View>
      )}

      {/* Top Card */}
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
              {validLocations.length}/{vehicles.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>On Map</ThemedText>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name='engine' size={20} color='#22c55e' />
            <ThemedText style={styles.statValue}>{stats.running}</ThemedText>
            <ThemedText style={styles.statLabel}>Running</ThemedText>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name='stop' size={20} color='#ef4444' />
            <ThemedText style={styles.statValue}>{stats.stopped}</ThemedText>
            <ThemedText style={styles.statLabel}>Stopped</ThemedText>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.refreshBtn, { backgroundColor: theme.iconColorFocused }]}
        onPress={refresh}
        disabled={locationsLoading}>
        {locationsLoading ? (
          <ActivityIndicator size='small' color='#fff' />
        ) : (
          <Ionicons name='refresh' size={24} color='#fff' />
        )}
      </TouchableOpacity>

      {isFollowing && (
        <TouchableOpacity
          style={[styles.stopFollowBtn, { backgroundColor: "#ef4444" }]}
          onPress={stopFollowing}>
          <MaterialCommunityIcons name='target-off' size={24} color='#fff' />
        </TouchableOpacity>
      )}

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name='alert-circle' size={20} color='#fff' />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Vehicle Modal */}
      <Modal
        visible={!!selectedVehicle}
        transparent={true}
        animationType='slide'
        onRequestClose={() => setSelectedVehicle(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setSelectedVehicle(null)}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
            ]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <MaterialCommunityIcons
                  name={
                    isEngineRunning(selectedVehicle?.engine)
                      ? "truck-fast"
                      : "truck"
                  }
                  size={24}
                  color={getMarkerColor(selectedVehicle?.engine)}
                />
                <ThemedText style={styles.modalTitle}>
                  {selectedVehicle?.vehicle}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setSelectedVehicle(null)}>
                <Ionicons
                  name='close'
                  size={24}
                  color={isDark ? "#fff" : "#000"}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isEngineRunning(selectedVehicle?.engine)
                      ? "#22c55e"
                      : "#ef4444",
                  },
                ]}>
                <Text style={styles.statusText}>
                  {isEngineRunning(selectedVehicle?.engine)
                    ? "Running"
                    : "Stopped"}
                </Text>
              </View>

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

      {/* Vehicles List Modal */}
      {/* Vehicles Modal */}
      <Modal
        visible={showVehicles}
        transparent
        animationType='slide'
        onRequestClose={onCloseVehicles}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={onCloseVehicles}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
            ]}>
            <VehicleListModal
              vehicles={vehicles}
              locations={validLocations}
              onClose={onCloseVehicles}
              mapRef={mapRef}
              isDark={isDark}
              followingVehicle={followingVehicle}
              onToggleFollow={handleToggleFollow}
            />
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        transparent
        animationType='slide'
        onRequestClose={onCloseHistory}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={onCloseHistory}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
            ]}>
            <HistoryModal
              vehicles={vehicles}
              selectedPlate={selectedPlate}
              setSelectedPlate={setSelectedPlate}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              loading={loadingHistory}
              onSubmit={handleFetchHistory}
              onClear={clearHistory}
              onClose={onCloseHistory}
              isDark={isDark}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
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
  topCardRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", marginTop: 4 },
  statLabel: { fontSize: 11, opacity: 0.7, marginTop: 2 },
  refreshBtn: {
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
  stopFollowBtn: {
    position: "absolute",
    bottom: 170,
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
  errorBanner: {
    position: "absolute",
    top: 120,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    zIndex: 100,
  },
  errorText: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
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
  modalTitleContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalScroll: { padding: 20 },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  infoSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  markerContainer: { position: "relative" },
  markerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
});
