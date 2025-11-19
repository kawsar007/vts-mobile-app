// app/(dashboard)/map.js
import React, { useState, useEffect, useRef, useMemo } from "react";
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
  } = useVehicleHistory();

  const initialRegion = useMemo(
    () => ({
      latitude: 23.8103,
      longitude: 90.4125,
      latitudeDelta: 5,
      longitudeDelta: 5,
    }),
    [],
  );

  // Fit live vehicles
  useEffect(() => {
    if (!mapReady || locations.length === 0) return;
    const coords = locations
      .filter((l) => {
        const lat = parseFloat(l.latitude);
        const lng = parseFloat(l.longitude);
        return !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);
      })
      .map((l) => ({
        latitude: parseFloat(l.latitude),
        longitude: parseFloat(l.longitude),
      }));

    if (coords.length && mapRef.current) {
      setTimeout(
        () =>
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 150, left: 80, bottom: 150, right: 80 },
            animated: true,
          }),
        300,
      );
    }
  }, [locations, mapReady]);

  // Fit history route
  useEffect(() => {
    if (!mapReady || history.length === 0) return;
    const coords = history
      .filter(
        (p) =>
          !isNaN(parseFloat(p.latitude)) && !isNaN(parseFloat(p.longitude)),
      )
      .map((p) => ({
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude),
      }));

    if (coords.length && mapRef.current) {
      setTimeout(
        () =>
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 150, left: 80, bottom: 150, right: 80 },
            animated: true,
          }),
        300,
      );
    }
  }, [history, mapReady]);

  useEffect(() => {
    if (locations.length && mapReady) {
      const t = setTimeout(() => setMarkersRendered(true), 1000);
      return () => clearTimeout(t);
    }
  }, [locations, mapReady]);

  const getVehicleDetails = (plate) =>
    vehicles.find((v) => v.number_plate === plate);
  const formatTime = (ts) =>
    ts ? new Date(Number(ts) * 1000).toLocaleString() : "N/A";
  const getMarkerColor = (engine) =>
    Number(engine) === 1 ? "#22c55e" : "#ef4444";

  // const handleMarkerPress = (location) => {
  //   const details = getVehicleDetails(location.vehicle);
  //   setSelectedVehicle({ ...location, ...details });
  // };

  // const closeVehicleModal = () => setSelectedVehicle(null);

  // const handleRefresh = async () => await refresh();

  const fetchVehicleHistory = async () => {
    if (!selectedPlate) return Alert.alert("Error", "Select a vehicle");
    fetchHistory(selectedPlate, startDate, endDate);
  };

  const renderMarker = (loc) => {
    const lat = parseFloat(loc.latitude);
    const lng = parseFloat(loc.longitude);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
    // const isRunning = Number(loc.engine) === 1;

    return (
      <Marker
        key={loc.vehicle}
        coordinate={{ latitude: lat, longitude: lng }}
        onPress={() =>
          setSelectedVehicle({
            ...loc,
            ...(getVehicleDetails(loc.vehicle) || {}),
          })
        }
        tracksViewChanges={!markersRendered}>
        <View style={styles.markerContainer}>
          <View
            style={[
              styles.markerInner,
              { backgroundColor: getMarkerColor(loc.engine) },
            ]}>
            <MaterialCommunityIcons
              name={Number(loc.engine) === 1 ? "truck-fast" : "truck"}
              size={20}
              color='#fff'
            />
          </View>
          {Number(loc.engine) !== 1 && (
            <View style={styles.stopBadge}>
              <MaterialCommunityIcons name='stop' size={10} color='#fff' />
            </View>
          )}
        </View>
      </Marker>
    );
  };

  const renderHistoryRoute = () => {
    if (history.length === 0) return null;

    const coords = history.map((point) => ({
      latitude: parseFloat(point.latitude),
      longitude: parseFloat(point.longitude),
    }));
    return (
      <>
        <Polyline coordinates={coords} strokeColor='#3b82f6' strokeWidth={5} />
        <Marker coordinate={coords[0]} title='Start'>
          <MaterialCommunityIcons name='flag' size={30} color='#22c55e' />
        </Marker>
        {coords.length > 1 && (
          <Marker coordinate={coords[coords.length - 1]} title='End'>
            <MaterialCommunityIcons
              name='flag-checkered'
              size={30}
              color='#ef4444'
            />
          </Marker>
        )}
      </>
    );
  };

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
        loadingEnabled>
        {locations.map(renderMarker)}
        {renderHistoryRoute()}
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
              {locations.length}/{vehicles.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>On Map</ThemedText>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name='engine' size={20} color='#22c55e' />
            <ThemedText style={styles.statValue}>
              {locations.filter((l) => Number(l.engine) === 1).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Running</ThemedText>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name='stop' size={20} color='#ef4444' />
            <ThemedText style={styles.statValue}>
              {locations.filter((l) => Number(l.engine) !== 1).length}
            </ThemedText>
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
                  name={selectedVehicle?.engine === 1 ? "truck-fast" : "truck"}
                  size={24}
                  color={getMarkerColor(selectedVehicle?.engine)}
                />
                <ThemedText style={styles.modalTitle}>
                  {selectedVehicle?.vehicle}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setSelectedVehicle(null)}>
                <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
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
        animationType="slide"
        onRequestClose={onCloseVehicles}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onCloseVehicles} />
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#1a1a1a" : "#fff" }]}>
            <VehicleListModal
              vehicles={vehicles}
              locations={locations}
              onClose={onCloseVehicles}
              mapRef={mapRef}
              isDark={isDark}
            />
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        transparent
        animationType="slide"
        onRequestClose={onCloseHistory}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onCloseHistory} />
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#1a1a1a" : "#fff" }]}>
            <HistoryModal
              vehicles={vehicles}
              selectedPlate={selectedPlate}
              setSelectedPlate={setSelectedPlate}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              loading={loadingHistory}
              onSubmit={fetchHistory}
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
  errorContainer: {
    position: "absolute",
    top: 80,
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
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
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

// import React, { useState, useEffect, useRef } from "react";
// import {
//   StyleSheet,
//   View,
//   ActivityIndicator,
//   TouchableOpacity,
//   Modal,
//   Text,
//   ScrollView,
//   Dimensions,
//   FlatList,
//   Alert,
//   Platform,
// } from "react-native";
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
// import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import ThemedView from "../../components/ThemedView";
// import ThemedText from "../../components/ThemedText";
// import { useVehicles } from "../../hooks/useVehicles";
// import { useVehicleLocations } from "../../hooks/useVehicleLocations";
// import { useColorScheme } from "react-native";
// import { Colors } from "../../constants/Colors";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { Picker } from "@react-native-picker/picker";
// import ApiService from "../../services/api";
// import { useVehicleHistory } from "../../hooks/useVehicleHistory";

// const { height } = Dimensions.get("window");

// const GoogleMap = ({
//   activeTab,
//   showVehiclesModal,
//   onCloseVehiclesModal,
//   showHistoryModal,
//   onCloseHistoryModal,
//   // historyData,
//   // setHistoryData,
// }) => {
//   const colorScheme = useColorScheme();
//   const theme = Colors[colorScheme] ?? Colors.light;
//   const isDark = colorScheme === "dark";

//   const mapRef = useRef(null);
//   const [mapReady, setMapReady] = useState(false);
//   const [markersRendered, setMarkersRendered] = useState(false);
//   const [selectedVehicle, setSelectedVehicle] = useState(null);

//   // History Modal States
//   const [selectedPlate, setSelectedPlate] = useState("");
//   const [startDate, setStartDate] = useState(
//     new Date(Date.now() - 24 * 60 * 60 * 1000),
//   );
//   const [endDate, setEndDate] = useState(new Date());
//   const [showStartPicker, setShowStartPicker] = useState(false);
//   const [showEndPicker, setShowEndPicker] = useState(false);
//   // const [historyLoading, setHistoryLoading] = useState(false);

//   // Fetch vehicles
//   const { vehicles, loading: vehiclesLoading, getNumberPlates } = useVehicles();
//   const numberPlates = getNumberPlates();

//   // Fetch live locations
//   const {
//     locations,
//     loading: locationsLoading,
//     error,
//     refresh,
//   } = useVehicleLocations(numberPlates);

//   const {
//     history: historyData,
//     loading: historyLoading,
//     error: historyError,
//     fetchHistory,
//     clearHistory,
//   } = useVehicleHistory();

//   // Initial region
//   const initialRegion = {
//     latitude: 23.8103,
//     longitude: 90.4125,
//     latitudeDelta: 5,
//     longitudeDelta: 5,
//   };

//   // Fit map to live vehicles
//   useEffect(() => {
//     if (!mapReady || locations.length === 0) return;

//     const validCoords = locations
//       .filter((l) => {
//         const lat = parseFloat(l.latitude);
//         const lng = parseFloat(l.longitude);
//         return !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);
//       })
//       .map((l) => ({
//         latitude: parseFloat(l.latitude),
//         longitude: parseFloat(l.longitude),
//       }));

//     if (validCoords.length > 0 && mapRef.current) {
//       setTimeout(() => {
//         mapRef.current.fitToCoordinates(validCoords, {
//           edgePadding: { top: 150, left: 80, bottom: 150, right: 80 },
//           animated: true,
//         });
//       }, 500);
//     }
//   }, [locations, mapReady]);

//   // Fit map to history route
//   useEffect(() => {
//     if (!mapReady || historyData?.length === 0) return;

//     const coords = historyData
//       ?.filter((p) => {
//         const lat = parseFloat(p.latitude);
//         const lng = parseFloat(p.longitude);
//         return !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);
//       })
//       ?.map((p) => ({
//         latitude: parseFloat(p.latitude),
//         longitude: parseFloat(p.longitude),
//       }));

//     if (coords.length > 0 && mapRef.current) {
//       setTimeout(() => {
//         mapRef.current.fitToCoordinates(coords, {
//           edgePadding: { top: 150, left: 80, bottom: 150, right: 80 },
//           animated: true,
//         });
//       }, 500);
//     }
//   }, [historyData, mapReady]);

//   useEffect(() => {
//     if (locations.length > 0 && mapReady) {
//       const timer = setTimeout(() => setMarkersRendered(true), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [locations, mapReady]);

//   const getVehicleDetails = (numberPlate) => {
//     return vehicles.find((v) => v.number_plate === numberPlate);
//   };

//   const formatTime = (ts) => {
//     if (!ts) return "N/A";
//     return new Date(Number(ts) * 1000).toLocaleString();
//   };

//   const getMarkerColor = (engine) =>
//     Number(engine) === 1 ? "#22c55e" : "#ef4444";

//   const handleMarkerPress = (location) => {
//     const details = getVehicleDetails(location.vehicle);
//     setSelectedVehicle({ ...location, ...details });
//   };

//   const closeModal = () => setSelectedVehicle(null);

//   const handleRefresh = async () => {
//     await refresh();
//   };

//   // Fetch history (replace with your real API)
//   const fetchVehicleHistory = async () => {
//     fetchHistory(selectedPlate, startDate, endDate);
//   };

//   // Render live marker
//   const renderMarker = (location) => {
//     const lat = parseFloat(location.latitude);
//     const lng = parseFloat(location.longitude);
//     if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;

//     const isRunning = Number(location.engine) === 1;

//     return (
//       <Marker
//         key={location.vehicle}
//         coordinate={{ latitude: lat, longitude: lng }}
//         onPress={() => handleMarkerPress(location)}
//         tracksViewChanges={!markersRendered}>
//         <View style={styles.markerContainer}>
//           <View
//             style={[
//               styles.markerInner,
//               { backgroundColor: getMarkerColor(location.engine) },
//             ]}>
//             <MaterialCommunityIcons
//               name={isRunning ? "truck-fast" : "truck"}
//               size={20}
//               color='#fff'
//             />
//           </View>
//           {!isRunning && (
//             <View style={styles.stopBadge}>
//               <MaterialCommunityIcons name='stop' size={10} color='#fff' />
//             </View>
//           )}
//         </View>
//       </Marker>
//     );
//   };

//   // Render history route
//   const renderHistoryRoute = () => {
//     if (historyData?.length === 0) return null;

//     const coords = historyData?.map((p) => ({
//       latitude: parseFloat(p.latitude),
//       longitude: parseFloat(p.longitude),
//     }));

//     return (
//       <>
//         <Polyline coordinates={coords} strokeColor='#3b82f6' strokeWidth={5} />
//         <Marker coordinate={coords[0]} title='Start'>
//           <MaterialCommunityIcons name='flag' size={30} color='#22c55e' />
//         </Marker>
//         {coords.length > 1 && (
//           <Marker coordinate={coords[coords.length - 1]} title='End'>
//             <MaterialCommunityIcons
//               name='flag-checkered'
//               size={30}
//               color='#ef4444'
//             />
//           </Marker>
//         )}
//       </>
//     );
//   };

//   if (vehiclesLoading) {
//     return (
//       <ThemedView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size='large' color={theme.iconColorFocused} />
//           <ThemedText>Loading vehicles...</ThemedText>
//         </View>
//       </ThemedView>
//     );
//   }

//   return (
//     <ThemedView style={styles.container}>
//       {/* Map */}
//       <MapView
//         ref={mapRef}
//         provider={PROVIDER_GOOGLE}
//         style={StyleSheet.absoluteFillObject}
//         initialRegion={initialRegion}
//         onMapReady={() => setMapReady(true)}
//         showsUserLocation={true}
//         showsMyLocationButton={true}
//         showsCompass={true}
//         loadingEnabled={true}>
//         {locations.map(renderMarker)}
//         {renderHistoryRoute()}
//       </MapView>

//       {/* Loading Overlay */}
//       {locationsLoading && !locations.length && (
//         <View style={styles.loadingOverlay}>
//           <ActivityIndicator size='large' color={theme.iconColorFocused} />
//           <ThemedText>Loading locations...</ThemedText>
//         </View>
//       )}

//       {/* Top Info Card */}
//       <View
//         style={[
//           styles.topCard,
//           {
//             backgroundColor: isDark
//               ? "rgba(26,26,26,0.95)"
//               : "rgba(255,255,255,0.95)",
//           },
//         ]}>
//         <View style={styles.topCardRow}>
//           <View style={styles.statItem}>
//             <MaterialCommunityIcons
//               name='truck-check'
//               size={20}
//               color={theme.iconColorFocused}
//             />
//             <ThemedText style={styles.statValue}>
//               {locations.length}/{vehicles.length}
//             </ThemedText>
//             <ThemedText style={styles.statLabel}>On Map</ThemedText>
//           </View>
//           <View style={styles.statItem}>
//             <MaterialCommunityIcons name='engine' size={20} color='#22c55e' />
//             <ThemedText style={styles.statValue}>
//               {locations.filter((l) => Number(l.engine) === 1).length}
//             </ThemedText>
//             <ThemedText style={styles.statLabel}>Running</ThemedText>
//           </View>
//           <View style={styles.statItem}>
//             <MaterialCommunityIcons name='stop' size={20} color='#ef4444' />
//             <ThemedText style={styles.statValue}>
//               {locations.filter((l) => Number(l.engine) !== 1).length}
//             </ThemedText>
//             <ThemedText style={styles.statLabel}>Stopped</ThemedText>
//           </View>
//         </View>
//       </View>

//       {/* Refresh Button */}
//       <TouchableOpacity
//         style={[
//           styles.refreshButton,
//           { backgroundColor: theme.iconColorFocused },
//         ]}
//         onPress={handleRefresh}
//         disabled={locationsLoading}>
//         {locationsLoading ? (
//           <ActivityIndicator size='small' color='#fff' />
//         ) : (
//           <Ionicons name='refresh' size={24} color='#fff' />
//         )}
//       </TouchableOpacity>

//       {/* Error Banner */}
//       {error && (
//         <View style={styles.errorBanner}>
//           <Ionicons name='alert-circle' size={20} color='#fff' />
//           <Text style={styles.errorBannerText}>{error}</Text>
//         </View>
//       )}

//       {/* Vehicle Details Modal */}
//       <Modal
//         visible={!!selectedVehicle}
//         transparent
//         animationType='slide'
//         onRequestClose={closeModal}>
//         <View style={styles.modalOverlay}>
//           <TouchableOpacity
//             style={styles.modalBackground}
//             activeOpacity={1}
//             onPress={closeModal}
//           />
//           <View
//             style={[
//               styles.modalContent,
//               { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
//             ]}>
//             <View style={styles.modalHeader}>
//               <View style={styles.modalTitleContainer}>
//                 <MaterialCommunityIcons
//                   name={selectedVehicle?.engine === 1 ? "truck-fast" : "truck"}
//                   size={24}
//                   color={getMarkerColor(selectedVehicle?.engine)}
//                 />
//                 <ThemedText style={styles.modalTitle}>
//                   {selectedVehicle?.vehicle}
//                 </ThemedText>
//               </View>
//               <TouchableOpacity onPress={closeModal}>
//                 <Ionicons
//                   name='close'
//                   size={24}
//                   color={isDark ? "#fff" : "#000"}
//                 />
//               </TouchableOpacity>
//             </View>
//             <ScrollView style={styles.modalScroll}>
//               <View
//                 style={[
//                   styles.statusBadge,
//                   { backgroundColor: getMarkerColor(selectedVehicle?.engine) },
//                 ]}>
//                 <Text style={styles.statusText}>
//                   {selectedVehicle?.engine === 1 ? "Running" : "Stopped"}
//                 </Text>
//               </View>

//               {/* Reuse InfoRow from original */}
//               <View style={styles.infoSection}>
//                 <ThemedText style={styles.sectionTitle}>
//                   Vehicle Information
//                 </ThemedText>
//                 <InfoRow
//                   icon='car-info'
//                   label='Model'
//                   value={selectedVehicle?.model || "N/A"}
//                   isDark={isDark}
//                 />
//                 <InfoRow
//                   icon='car-cog'
//                   label='Type'
//                   value={selectedVehicle?.vehicle_type || "N/A"}
//                   isDark={isDark}
//                 />
//                 <InfoRow
//                   icon='account'
//                   label='Driver'
//                   value={selectedVehicle?.driver_name || "Not Assigned"}
//                   isDark={isDark}
//                 />
//                 <InfoRow
//                   icon='account-tie'
//                   label='Owner'
//                   value={selectedVehicle?.owner_name || "N/A"}
//                   isDark={isDark}
//                 />
//               </View>

//               <View style={styles.infoSection}>
//                 <ThemedText style={styles.sectionTitle}>
//                   Location Details
//                 </ThemedText>
//                 <InfoRow
//                   icon='map-marker'
//                   label='Latitude'
//                   value={selectedVehicle?.latitude || "N/A"}
//                   isDark={isDark}
//                 />
//                 <InfoRow
//                   icon='map-marker'
//                   label='Longitude'
//                   value={selectedVehicle?.longitude || "N/A"}
//                   isDark={isDark}
//                 />
//                 <InfoRow
//                   icon='speedometer'
//                   label='Speed'
//                   value={`${selectedVehicle?.speed || 0} km/h`}
//                   isDark={isDark}
//                 />
//                 <InfoRow
//                   icon='clock-outline'
//                   label='Last Update'
//                   value={formatTime(selectedVehicle?.time)}
//                   isDark={isDark}
//                 />
//               </View>

//               <View style={styles.infoSection}>
//                 <ThemedText style={styles.sectionTitle}>
//                   Device Status
//                 </ThemedText>
//                 <InfoRow
//                   icon='battery'
//                   label='Battery'
//                   value={`${selectedVehicle?.batt_level || 0}%`}
//                   isDark={isDark}
//                 />
//                 <InfoRow
//                   icon='signal'
//                   label='Network'
//                   value={`${selectedVehicle?.network_strength || 0}%`}
//                   isDark={isDark}
//                 />
//                 <InfoRow
//                   icon='satellite-variant'
//                   label='Satellites'
//                   value={selectedVehicle?.satellite || 0}
//                   isDark={isDark}
//                 />
//                 <InfoRow
//                   icon='air-conditioner'
//                   label='AC Status'
//                   value={selectedVehicle?.ac === 1 ? "On" : "Off"}
//                   isDark={isDark}
//                 />
//               </View>
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* VEHICLES LIST MODAL */}
//       <Modal visible={showVehiclesModal} transparent animationType='slide'>
//         <View style={styles.modalOverlay}>
//           <TouchableOpacity
//             style={styles.modalBackground}
//             activeOpacity={1}
//             onPress={onCloseVehiclesModal}
//           />
//           <View
//             style={[
//               styles.modalContent,
//               { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
//             ]}>
//             <View style={styles.modalHeader}>
//               <ThemedText style={styles.modalTitle}>
//                 All Vehicles ({vehicles.length})
//               </ThemedText>
//               <TouchableOpacity onPress={onCloseVehiclesModal}>
//                 <Ionicons
//                   name='close'
//                   size={28}
//                   color={isDark ? "#fff" : "#000"}
//                 />
//               </TouchableOpacity>
//             </View>
//             <FlatList
//               data={vehicles}
//               keyExtractor={(item) => item.number_plate}
//               renderItem={({ item }) => {
//                 const loc = locations.find(
//                   (l) => l.vehicle === item.number_plate,
//                 );
//                 const isRunning = loc && Number(loc.engine) === 1;
//                 return (
//                   <TouchableOpacity
//                     style={styles.vehicleItem}
//                     onPress={() => {
//                       onCloseVehiclesModal();
//                       if (loc) {
//                         mapRef.current?.animateToRegion(
//                           {
//                             latitude: parseFloat(loc.latitude),
//                             longitude: parseFloat(loc.longitude),
//                             latitudeDelta: 0.01,
//                             longitudeDelta: 0.01,
//                           },
//                           1000,
//                         );
//                       }
//                     }}>
//                     <View style={styles.vehicleInfo}>
//                       <MaterialCommunityIcons
//                         name={isRunning ? "truck-fast" : "truck"}
//                         size={24}
//                         color={isRunning ? "#22c55e" : "#ef4444"}
//                       />
//                       <View style={{ marginLeft: 12 }}>
//                         <Text
//                           style={[
//                             styles.vehiclePlate,
//                             { color: isDark ? "#fff" : "#000" },
//                           ]}>
//                           {item.number_plate}
//                         </Text>
//                         <Text style={{ color: "#9ca3af", fontSize: 12 }}>
//                           {item.model} •{" "}
//                           {loc ? `${loc.speed || 0} km/h` : "Offline"}
//                         </Text>
//                       </View>
//                     </View>
//                     <Ionicons
//                       name='chevron-forward'
//                       size={20}
//                       color='#9ca3af'
//                     />
//                   </TouchableOpacity>
//                 );
//               }}
//             />
//           </View>
//         </View>
//       </Modal>

//       {/* HISTORY FORM MODAL */}
//       <Modal visible={showHistoryModal} transparent animationType='slide'>
//         <View style={styles.modalOverlay}>
//           <TouchableOpacity
//             style={styles.modalBackground}
//             activeOpacity={1}
//             onPress={onCloseHistoryModal}
//           />
//           <View
//             style={[
//               styles.modalContent,
//               { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
//             ]}>
//             <View style={styles.modalHeader}>
//               <ThemedText style={styles.modalTitle}>Vehicle History</ThemedText>
//               <TouchableOpacity onPress={onCloseHistoryModal}>
//                 <Ionicons
//                   name='close'
//                   size={28}
//                   color={isDark ? "#fff" : "#000"}
//                 />
//               </TouchableOpacity>
//             </View>

//             <ScrollView style={styles.modalScroll}>
//               <View style={{ padding: 16 }}>
//                 <Text
//                   style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
//                   Select Vehicle
//                 </Text>
//                 <View style={styles.pickerContainer}>
//                   <Picker
//                     selectedValue={selectedPlate}
//                     onValueChange={setSelectedPlate}
//                     style={{ color: isDark ? "#fff" : "#000" }}>
//                     <Picker.Item label='Choose a vehicle' value='' />
//                     {vehicles.map((v) => (
//                       <Picker.Item
//                         key={v.number_plate}
//                         label={v.number_plate}
//                         value={v.number_plate}
//                       />
//                     ))}
//                   </Picker>
//                 </View>

//                 <Text
//                   style={[
//                     styles.label,
//                     { color: isDark ? "#fff" : "#000", marginTop: 16 },
//                   ]}>
//                   Start Time
//                 </Text>
//                 <TouchableOpacity
//                   style={styles.dateButton}
//                   onPress={() => setShowStartPicker(true)}>
//                   <Text style={{ color: isDark ? "#fff" : "#000" }}>
//                     {startDate.toLocaleString()}
//                   </Text>
//                 </TouchableOpacity>
//                 {showStartPicker && (
//                   <DateTimePicker
//                     value={startDate}
//                     mode='datetime'
//                     onChange={(e, date) => {
//                       setShowStartPicker(false);
//                       if (date) setStartDate(date);
//                     }}
//                   />
//                 )}

//                 <Text
//                   style={[
//                     styles.label,
//                     { color: isDark ? "#fff" : "#000", marginTop: 16 },
//                   ]}>
//                   End Time
//                 </Text>
//                 <TouchableOpacity
//                   style={styles.dateButton}
//                   onPress={() => setShowEndPicker(true)}>
//                   <Text style={{ color: isDark ? "#fff" : "#000" }}>
//                     {endDate.toLocaleString()}
//                   </Text>
//                 </TouchableOpacity>
//                 {showEndPicker && (
//                   <DateTimePicker
//                     value={endDate}
//                     mode='datetime'
//                     onChange={(e, date) => {
//                       setShowEndPicker(false);
//                       if (date) setEndDate(date);
//                     }}
//                   />
//                 )}

//                 <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
//                   <TouchableOpacity
//                     style={[
//                       styles.actionButton,
//                       { backgroundColor: theme.iconColorFocused },
//                     ]}
//                     onPress={fetchVehicleHistory}
//                     disabled={historyLoading}>
//                     {historyLoading ? (
//                       <ActivityIndicator color='#fff' />
//                     ) : (
//                       <Text style={styles.actionButtonText}>Load History</Text>
//                     )}
//                   </TouchableOpacity>
//                   <TouchableOpacity
//                     style={[
//                       styles.actionButton,
//                       { backgroundColor: "#ef4444" },
//                     ]}
//                     onPress={clearHistory}>
//                     <Text style={styles.actionButtonText}>Clear Route</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>
//     </ThemedView>
//   );
// };

// // InfoRow & Styles (unchanged from your original)
// const InfoRow = ({ icon, label, value, isDark }) => (
//   <View style={styles.infoRow}>
//     <View style={styles.infoLeft}>
//       <MaterialCommunityIcons
//         name={icon}
//         size={18}
//         color={isDark ? "#9ca3af" : "#6b7280"}
//       />
//       <Text
//         style={[styles.infoLabel, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
//         {label}
//       </Text>
//     </View>
//     <Text style={[styles.infoValue, { color: isDark ? "#fff" : "#000" }]}>
//       {value}
//     </Text>
//   </View>
// );

// export default GoogleMap;

// // Styles (add these new ones)
// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
//   loadingOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(0,0,0,0.3)",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 1000,
//   },
//   topCard: {
//     position: "absolute",
//     top: 16,
//     left: 16,
//     right: 16,
//     borderRadius: 16,
//     padding: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   topCardRow: { flexDirection: "row", justifyContent: "space-around" },
//   statItem: { alignItems: "center" },
//   statValue: { fontSize: 20, fontWeight: "700", marginTop: 4 },
//   statLabel: { fontSize: 11, opacity: 0.7, marginTop: 2 },
//   refreshButton: {
//     position: "absolute",
//     bottom: 100,
//     right: 16,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   errorBanner: {
//     position: "absolute",
//     top: 80,
//     left: 16,
//     right: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#ef4444",
//     padding: 12,
//     borderRadius: 12,
//     gap: 8,
//     zIndex: 100,
//   },
//   errorBannerText: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },
//   modalOverlay: { flex: 1, justifyContent: "flex-end" },
//   modalBackground: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(0,0,0,0.5)",
//   },
//   modalContent: {
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     maxHeight: height * 0.85,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: -4 },
//     shadowOpacity: 0.25,
//     shadowRadius: 12,
//     elevation: 16,
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: "#e5e7eb",
//   },
//   modalTitleContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
//   modalTitle: { fontSize: 20, fontWeight: "700" },
//   modalScroll: { padding: 0 },
//   statusBadge: {
//     alignSelf: "flex-start",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     marginBottom: 20,
//   },
//   statusText: { color: "#fff", fontSize: 14, fontWeight: "700" },
//   infoSection: { marginBottom: 24 },
//   sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
//   infoRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f3f4f6",
//   },
//   infoLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
//   infoLabel: { fontSize: 14 },
//   infoValue: { fontSize: 14, fontWeight: "600" },
//   markerContainer: { position: "relative" },
//   markerInner: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//     borderWidth: 3,
//     borderColor: "#fff",
//   },
//   stopBadge: {
//     position: "absolute",
//     top: -4,
//     right: -4,
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: "#ef4444",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 2,
//     borderColor: "#fff",
//   },
//   // New styles
//   vehicleItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#e5e7eb",
//   },
//   vehicleInfo: { flexDirection: "row", alignItems: "center" },
//   vehiclePlate: { fontSize: 16, fontWeight: "600" },
//   pickerContainer: {
//     borderWidth: 1,
//     borderColor: "#e5e7eb",
//     borderRadius: 8,
//     marginTop: 8,
//   },
//   label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
//   dateButton: {
//     padding: 12,
//     borderWidth: 1,
//     borderColor: "#e5e7eb",
//     borderRadius: 8,
//     justifyContent: "center",
//   },
//   actionButton: {
//     flex: 1,
//     padding: 14,
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   actionButtonText: { color: "#fff", fontWeight: "600" },
// });
