// app/(dashboard)/_components/HistoryRoute.jsx
import React, { useEffect, useRef, useMemo, useState } from "react";
import { Polyline, Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { calculateBearing } from "../../../helper/calculateBearing";
// import simplify from 'simplify-js'; // Optional: Install via `expo install simplify-js` for path reduction

// Custom Arrow Component
const ArrowMarker = ({ bearing }) => (
  <View style={{ transform: [{ rotate: `${bearing}deg` }] }}>
    <View style={styles.proArrow}>
      <MaterialCommunityIcons
        name='arrow-up-bold-hexagon-outline'
        size={24}
        color='#FFFFFF'
      />
      {/* <MaterialCommunityIcons name='arrow-up-bold' size={20} color='#22c55e' /> */}
    </View>
  </View>
);

const ZOOM_THRESHOLD_SPARSE = 0.5; // Wide view: very sparse arrows (e.g., every 100th)
const ZOOM_THRESHOLD_MEDIUM = 0.1; // Medium: moderately sparse (e.g., every 20th)
const ZOOM_THRESHOLD_DENSE = 0.02; // Close: all in view (every 1st)
const POLYLINE_CHUNK_SIZE = 1000; // Max points per Polyline to prevent crashes

const isPointInRegion = (point, region) => {
  if (!region) return false;
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
  const latMin = latitude - latitudeDelta / 2;
  const latMax = latitude + latitudeDelta / 2;
  const lngMin = longitude - longitudeDelta / 2;
  const lngMax = longitude + longitudeDelta / 2;
  return (
    point.lat >= latMin &&
    point.lat <= latMax &&
    point.lng >= lngMin &&
    point.lng <= lngMax
  );
};

const HistoryRoute = ({ history, mapRef, isHistoryActive, currentRegion }) => {
  const hasFittedRef = useRef(false);
  const [markersReady, setMarkersReady] = useState(false);

  const validPoints = useMemo(() => {
    if (!isHistoryActive || history.length === 0) return [];

    return history
      .map((p, i) => ({
        ...p,
        index: i,
        lat: parseFloat(p.latitude),
        lng: parseFloat(p.longitude),
      }))
      .filter(
        (p) => !isNaN(p.lat) && !isNaN(p.lng) && !(p.lat === 0 && p.lng === 0),
      );
  }, [history, isHistoryActive]);

  const coords = useMemo(() => {
    let points = validPoints.map((p) => ({
      latitude: p.lat,
      longitude: p.lng,
    }));

    // Optional: Simplify the path to reduce points (uncomment after installing simplify-js)
    // const simplified = simplify(points.map(p => ({ x: p.longitude, y: p.latitude })), 0.0001, true);
    // points = simplified.map(p => ({ latitude: p.y, longitude: p.x }));

    return points;
  }, [validPoints]);

  // Split coords into chunks for multiple polylines
  const polylineChunks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < coords.length; i += POLYLINE_CHUNK_SIZE) {
      chunks.push(coords.slice(i, i + POLYLINE_CHUNK_SIZE));
    }
    return chunks;
  }, [coords]);

  // Prepare point data with bearings
  const pointsWithBearings = useMemo(() => {
    return validPoints.map((point, i) => {
      const next = validPoints[i + 1];
      const prev = validPoints[i - 1];

      let bearing = 0;
      if (next) {
        bearing = calculateBearing(point.lat, point.lng, next.lat, next.lng);
      } else if (prev) {
        bearing = calculateBearing(prev.lat, prev.lng, point.lat, point.lng);
      }

      return {
        ...point,
        bearing,
      };
    });
  }, [validPoints]);

  const zoomLevel = currentRegion?.latitudeDelta;

  // Compute visible arrows dynamically with zoom-based subsampling
  const visibleArrows = useMemo(() => {
    if (!markersReady || !currentRegion || !zoomLevel) return [];

    const delta = zoomLevel;

    let step = 1;
    if (delta > 0.5) step = 100; // Very zoomed out → ~10–30 arrows total
    else if (delta > 0.1) step = 25; // Medium zoom
    else if (delta > 0.03) step = 8; // Getting close
    else if (delta > 0.01) step = 3; // Street level
    else step = 1; // Max zoom → every point (if in view)

    const visible: typeof pointsWithBearings = [];

    for (let i = 0; i < pointsWithBearings.length; i += step) {
      const point = pointsWithBearings[i];
      if (isPointInRegion(point, currentRegion)) {
        visible.push(point);
      }
    }

    console.log(
      `Zoom: ${delta.toFixed(4)} → Step: ${step} → Arrows: ${visible.length}`,
    );
    return visible;
  }, [
    markersReady,
    currentRegion, // Full region for bounds checking
    zoomLevel, // This forces recompute on any zoom change
    pointsWithBearings, // Only changes when history changes
  ]);

  useEffect(() => {
    if (!isHistoryActive || !mapRef.current || coords.length < 2) {
      hasFittedRef.current = false;
      setMarkersReady(false);
      return;
    }

    if (!hasFittedRef.current) {
      hasFittedRef.current = true;

      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 120, right: 120, bottom: 120, left: 120 },
          animated: true,
        });

        // Delay marker rendering to prevent crash
        setTimeout(() => setMarkersReady(true), 500);
      }, 400);

      return () => clearTimeout(timer);
    } else {
      setMarkersReady(true);
    }
  }, [coords, isHistoryActive, mapRef]);

  if (!isHistoryActive || validPoints.length < 2) {
    console.log("❌ HistoryRoute NOT rendering:", {
      isHistoryActive,
      pointCount: validPoints.length,
    });
    return null;
  }

  console.log("✅ HistoryRoute rendering:", validPoints.length, "points");

  return (
    <>
      {/* Blue route lines - split into chunks */}
      {polylineChunks.map((chunk, chunkIndex) => (
        <Polyline
          key={`polyline-chunk-${chunkIndex}`}
          coordinates={chunk}
          strokeColor='#3b82f6'
          strokeWidth={6}
          zIndex={10}
        />
      ))}

      {/* Arrow points at each visible location - dynamic with subsampling */}
      {visibleArrows.map((point) => (
        <Marker
          key={`point-${point.index}`}
          coordinate={{ latitude: point.lat, longitude: point.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          flat={true}
          zIndex={15}
          tracksViewChanges={true}>
          <ArrowMarker bearing={point.bearing} />
        </Marker>
      ))}

      {/* Start flag - always render when ready (minimal impact) */}
      {markersReady && (
        <Marker
          coordinate={coords[0]}
          anchor={{ x: 0.5, y: 1 }}
          zIndex={30}
          tracksViewChanges={true}>
          <View style={styles.flagContainer}>
            <MaterialCommunityIcons name='flag' size={40} color='#22c55e' />
          </View>
        </Marker>
      )}

      {/* End flag - always render when ready (minimal impact) */}
      {markersReady && (
        <Marker
          coordinate={coords[coords.length - 1]}
          anchor={{ x: 0.5, y: 1 }}
          zIndex={30}
          tracksViewChanges={true}>
          <View style={styles.flagContainer}>
            <MaterialCommunityIcons
              name='flag-checkered'
              size={40}
              color='#ef4444'
            />
          </View>
        </Marker>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  proArrow: {
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
  },
  flagContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 6,
  },
});

export default React.memo(HistoryRoute);
