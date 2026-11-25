// app/(dashboard)/map.js
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import { Colors } from "../../constants/Colors";
import { useVehicleFollow } from "../../hooks/useVehicleFollow";
import { useVehicleHistory } from "../../hooks/useVehicleHistory";
import { useVehicleLocations } from "../../hooks/useVehicleLocations";
import { useVehicles } from "../../hooks/useVehicles";
import FollowPath from "./_components/FollowPath";
import FollowTopCard from "./_components/FollowTopCard";
import HistoryModal from "./_components/HistoryModal";
import HistoryRoute from "./_components/HistoryRoute";
import InfoRow from "./_components/InfoRow";
import VehicleListModal from "./_components/VehicleListModal";

const { height } = Dimensions.get("window");

// Module-level (outside the component, so it survives re-renders and
// remounts of this screen) cache for reverse-geocoding results. Keyed by
// coordinates rounded to ~11m precision so nearby re-reads of the same
// vehicle don't re-hit the geocoder, and so re-opening the same vehicle's
// modal is instant on the second look.
const addressCache = new Map();
const addressCacheKey = (lat, lng) =>
  `${lat.toFixed(4)},${lng.toFixed(4)}`;

// Builds a soft, low-opacity tint behind a stat icon. Only tries to append
// an alpha suffix when `color` is a plain 6-digit hex (the normal case for
// theme/icon colors here); anything else (named color, rgba(...), etc.)
// falls back to a neutral tint so the chip never ends up fully opaque.
const tint = (color, hexAlpha = "1F", fallback = "rgba(100,116,139,0.12)") =>
  typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color)
    ? `${color}${hexAlpha}`
    : fallback;

const formatAddress = (result) => {
  if (!result) return null;
  const { name, street, district, city, subregion, region, country } =
    result;
  // Build a short, readable address from whichever parts the platform
  // geocoder actually returned (coverage varies by area/country).
  const parts = [
    street || name,
    district,
    city || subregion,
    region,
    country,
  ].filter(Boolean);
  // De-dupe consecutive identical parts (e.g. city === subregion)
  const deduped = parts.filter((p, i) => p !== parts[i - 1]);
  return deduped.length ? deduped.join(", ") : null;
};

// Memoized marker visual so a poll tick that doesn't change a vehicle's
// position/engine state does not force react-native-maps to tear down and
// re-create that marker's native view. This is what keeps a large fleet
// (hundreds of markers) from hammering the native bridge on every refresh.
const VehicleMarkerIcon = React.memo(function VehicleMarkerIcon({ running }) {
  return (
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
  );
});

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

  // Reverse geocoding for the Location Details section of the vehicle
  // modal: { address, loading, error }. Resolved from the selected
  // vehicle's own coordinates, not from all vehicles on the map, so this
  // never scales with fleet size.
  const [addressState, setAddressState] = useState({
    address: null,
    loading: false,
    error: false,
  });
  const locationPermissionRef = useRef(null); // caches the permission check across opens

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

  console.log("History:--->", history);
  console.log("Fetching History:--->", fetchHistory)
  

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

  // ROOT CAUSE FIX #1
  // `locations` can contain more than one record for the same vehicle
  // (e.g. an in-flight poll result overlapping a new one, or the backend
  // emitting a stale + fresh row for the same plate before the hook settles).
  // Rendering two <Marker> siblings with the IDENTICAL `key` inside a
  // react-native-maps <MapView> is what crashes the native layer once the
  // fleet is large enough for this to actually happen during a render pass:
  // the native view manager (especially on Android) throws trying to
  // add/update a marker view it believes already exists under that key/tag,
  // producing a hard native crash rather than a JS warning.
  // De-duplicating by vehicle id BEFORE anything downstream touches the
  // data guarantees every <Marker key=...> in this tree is unique.
  const dedupedLocations = useMemo(() => {
    const byVehicle = new Map();
    for (const loc of locations) {
      if (!loc || loc.vehicle === undefined || loc.vehicle === null) continue;
      // last value wins, so the freshest record for a plate is kept
      byVehicle.set(loc.vehicle, loc);
    }
    return Array.from(byVehicle.values());
  }, [locations]);

  // FIX: Memoize valid coordinates (now sourced from the deduped list so
  // the marker list, the "on map" stats, and fitToCoordinates all agree)
  const validLocations = useMemo(() => {
    return dedupedLocations.filter((l) => {
      const lat = parseFloat(l.latitude);
      const lng = parseFloat(l.longitude);
      return !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);
    });
  }, [dedupedLocations]);

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

  // Re-render markers when follow mode ends
  useEffect(() => {
    if (!isFollowing && !isHistoryActive && locations.length > 0) {
      setMarkersRendered(false);
      const timer = setTimeout(() => {
        setMarkersRendered(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isFollowing, isHistoryActive, locations.length]);

  // Settle markers after the initial batch mounts.
  // (Depends on validLocations.length rather than the whole `locations`
  // array reference, so this effect doesn't re-run on every single poll
  // tick just because the hook handed back a new array instance with the
  // same vehicles in it — one more source of needless marker churn removed.)
  useEffect(() => {
    if (validLocations.length && mapReady) {
      const t = setTimeout(() => setMarkersRendered(true), 1000);
      return () => clearTimeout(t);
    }
  }, [validLocations.length, mapReady]);

  // Reverse geocode the selected vehicle's coordinates into a readable
  // address whenever the vehicle modal opens (or the vehicle picked changes).
  // Cancellation-safe via `cancelled` so a fast close/reopen can't let a
  // stale response overwrite a newer one.
  useEffect(() => {
    if (!selectedVehicle) {
      setAddressState({ address: null, loading: false, error: false });
      return;
    }

    const lat = parseFloat(selectedVehicle.latitude);
    const lng = parseFloat(selectedVehicle.longitude);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      setAddressState({ address: null, loading: false, error: false });
      return;
    }

    const key = addressCacheKey(lat, lng);
    const cached = addressCache.get(key);
    if (cached) {
      setAddressState({ address: cached, loading: false, error: false });
      return;
    }

    let cancelled = false;
    setAddressState({ address: null, loading: true, error: false });

    (async () => {
      try {
        if (locationPermissionRef.current === null) {
          const { status } =
            await Location.requestForegroundPermissionsAsync();
          locationPermissionRef.current = status === "granted";
        }
        if (!locationPermissionRef.current) {
          if (!cancelled)
            setAddressState({ address: null, loading: false, error: true });
          return;
        }

        const results = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        const formatted = formatAddress(results?.[0]);

        if (formatted) addressCache.set(key, formatted);
        if (!cancelled)
          setAddressState({
            address: formatted,
            loading: false,
            error: !formatted,
          });
      } catch {
        if (!cancelled)
          setAddressState({ address: null, loading: false, error: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedVehicle?.vehicle, selectedVehicle?.latitude, selectedVehicle?.longitude]);

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

  // Memoized marker rendering (now reads from the de-duplicated,
  // already-validated list, so there is no second parseFloat/NaN check
  // disagreeing with validLocations)
  const renderMarker = useCallback(
    (loc) => {
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
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
          <VehicleMarkerIcon running={running} />
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

  // ROOT CAUSE FIX #2
  // `followPath` (and `history`) are only safe to hand to native map
  // children (<FollowPath>/<Polyline>, <HistoryRoute>) and to `.length`
  // checks once they're guaranteed to be arrays. If useVehicleFollow /
  // useVehicleHistory ever initialize these as `null`/`undefined` (e.g.
  // before the first path point arrives after `startFollowing` is called),
  // `followPath.length` or handing `undefined` coordinates to a native
  // Polyline throws and crashes the screen. Defaulting defensively here
  // costs nothing and can't change behavior when the hooks already return
  // arrays.
  const safeFollowPath = Array.isArray(followPath) ? followPath : [];
  const safeHistory = Array.isArray(history) ? history : [];

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
        {!isHistoryActive && !isFollowing && validLocations.map(renderMarker)}
        <HistoryRoute
          history={safeHistory}
          mapRef={mapRef}
          isHistoryActive={isHistoryActive}
          currentRegion={currentRegion}
        />
        <FollowPath path={safeFollowPath} isActive={isFollowing} />
      </MapView>

      {/* Loading Overlay */}
      {locationsLoading && !locations.length && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='large' color={theme.iconColorFocused} />
          <ThemedText>Loading locations...</ThemedText>
        </View>
      )}

      {isFollowing && safeFollowPath.length > 0 ? (
        <FollowTopCard
          followingVehicle={followingVehicle}
          followPath={safeFollowPath}
          isDark={isDark}
          theme={theme}
          formatTime={formatTime}
        />
      ) : (
        <View
          style={[
            styles.topCard,
            {
              backgroundColor: isDark
                ? "rgba(23, 23, 26, 0.72)"
                : "rgba(255, 255, 255, 0.78)",
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(15,23,42,0.06)",
            },
          ]}>
          <View style={styles.topCardRow}>
            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconWrap,
                  { backgroundColor: tint(theme.iconColorFocused) },
                ]}>
                <MaterialCommunityIcons
                  name='truck-check'
                  size={15}
                  color={theme.iconColorFocused}
                />
              </View>
              <ThemedText style={styles.statValue}>
                {validLocations.length}/{vehicles.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>ON MAP</ThemedText>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconWrap,
                  { backgroundColor: tint("#22c55e") },
                ]}>
                <MaterialCommunityIcons
                  name='engine'
                  size={15}
                  color='#22c55e'
                />
              </View>
              <ThemedText style={styles.statValue}>{stats.running}</ThemedText>
              <ThemedText style={styles.statLabel}>RUNNING</ThemedText>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconWrap,
                  { backgroundColor: tint("#ef4444") },
                ]}>
                <MaterialCommunityIcons name='stop' size={15} color='#ef4444' />
              </View>
              <ThemedText style={styles.statValue}>{stats.stopped}</ThemedText>
              <ThemedText style={styles.statLabel}>STOPPED</ThemedText>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.refreshBtn, { backgroundColor: theme.iconColorFocused }]}
        onPress={refresh}
        disabled={locationsLoading}
        >
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

                {/* Reverse-geocoded, human-readable address. Loading and
                    failure states are shown inline rather than blocking the
                    rest of the modal, since the raw coordinates below still
                    work regardless of geocoder availability. */}
                <View style={styles.addressRow}>
                  <View
                    style={[
                      styles.addressIconWrap,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(15,23,42,0.06)",
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name='map-marker-radius'
                      size={16}
                      color={theme.iconColorFocused}
                    />
                  </View>
                  <View style={styles.addressTextWrap}>
                    <ThemedText style={styles.addressLabel}>
                      Address
                    </ThemedText>
                    {addressState.loading ? (
                      <View style={styles.addressLoadingRow}>
                        <ActivityIndicator
                          size='small'
                          color={theme.iconColorFocused}
                        />
                        <ThemedText style={styles.addressLoadingText}>
                          Resolving location…
                        </ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={styles.addressValue} numberOfLines={3}>
                        {addressState.address ||
                          (addressState.error
                            ? "Address unavailable"
                            : "N/A")}
                      </ThemedText>
                    )}
                  </View>
                </View>

                <InfoRow
                  icon='crosshairs-gps'
                  label='Coordinates'
                  value={
                    selectedVehicle?.latitude && selectedVehicle?.longitude
                      ? `${Number(selectedVehicle.latitude).toFixed(5)}, ${Number(
                          selectedVehicle.longitude,
                        ).toFixed(5)}`
                      : "N/A"
                  }
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
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
    // A subtle shadow instead of the previous heavy one keeps the card
    // feeling like a light overlay rather than a solid panel sitting on
    // top of the map.
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  topCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  statValue: { fontSize: 15, fontWeight: "700", lineHeight: 18 },
  statLabel: {
    fontSize: 9.5,
    fontWeight: "600",
    opacity: 0.55,
    letterSpacing: 0.4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    backgroundColor: "rgba(128,128,128,0.25)",
    marginHorizontal: 4,
  },
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
  infoSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
    marginBottom: 2,
  },
  addressIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  addressTextWrap: { flex: 1 },
  addressLabel: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.55,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  addressValue: { fontSize: 14, fontWeight: "500", lineHeight: 19 },
  addressLoadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addressLoadingText: { fontSize: 13, opacity: 0.6 },
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