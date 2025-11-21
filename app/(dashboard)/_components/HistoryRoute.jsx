// app/(dashboard)/_components/HistoryRoute.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Polyline, Marker } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { calculateBearing } from "../../../helper/calculateBearing";

const HistoryRoute = ({ history, mapRef, isHistoryActive, currentRegion }) => {
  const hasFittedRef = useRef(false);
  // const [region, setRegion] = useState(null);

  // const handleRegionChange = useCallback((newRegion) => {
  //   setRegion(newRegion);
  // }, []);

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

  // Memoize coordinates
  const coords = useMemo(() => {
    return validPoints.map((p) => ({
      latitude: p.lat,
      longitude: p.lng,
    }));
  }, [validPoints]);

  const { zoomLevel, showArrows } = useMemo(() => {
    if (!currentRegion) return { zoomLevel: 3, showArrows: false };

    const zoom = Math.log2(360 / currentRegion.latitudeDelta);
    return {
      zoomLevel: zoom,
      showArrows: zoom > 12, // Show arrows at higher zoom levels
    };
  }, [currentRegion]);

  // Calculate arrow interval based on zoom level
  const arrowInterval = useMemo(() => {
    if (zoomLevel > 15) return 1; // Show all arrows when very zoomed in
    if (zoomLevel > 13) return 3; // Show every 3rd arrow
    return 5; // Show every 5th arrow
  }, [zoomLevel]);

  // Auto-fit route when history loads - SINGLE useEffect
  useEffect(() => {
    if (!isHistoryActive || !mapRef.current || coords.length < 2) {
      hasFittedRef.current = false;
      return;
    }

    // Only fit once when new history loads
    if (!hasFittedRef.current) {
      hasFittedRef.current = true;

      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 120, right: 120, bottom: 120, left: 120 },
          animated: true,
        });
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [coords, isHistoryActive, mapRef]);

  if (!isHistoryActive || validPoints.length < 2) return null;
  console.log("Zoom:", zoomLevel.toFixed(2), "Show Arrows:", showArrows);

  return (
    <>
      <Polyline
        coordinates={coords}
        strokeColor='#3b82f6'
        strokeWidth={6}
        zIndex={10}
      />

      {/* Arrows appear when zoomed in */}
      {showArrows &&
        validPoints.slice(0, -1).map((point, i) => {
          // Skip arrows based on interval
          if (i % arrowInterval !== 0) return null;

          const next = validPoints[i + 1];
          if (!next) return null;
          const bearing = calculateBearing(
            point.lat,
            point.lng,
            next.lat,
            next.lng,
          );

          return (
            <Marker
              key={`arrow-${point.index}`}
              coordinate={{ latitude: point.lat, longitude: point.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true}
              rotation={bearing}
              zIndex={20}
              tracksViewChanges={false}>
              <View style={styles.arrow}>
                <Ionicons name='play' size={18} color='#1e40af' />
              </View>
            </Marker>
          );
        })}

      <Marker
        coordinate={coords[0]}
        anchor={{ x: 0.5, y: 1 }}>
        <MaterialCommunityIcons name='flag' size={36} color='#22c55e' />
      </Marker>
      <Marker
        coordinate={coords[coords.length - 1]}
        anchor={{ x: 0.5, y: 1 }}>
        <MaterialCommunityIcons
          name='flag-checkered'
          size={36}
          color='#ef4444'
        />
      </Marker>
    </>
  );
};

// ← MOVED INSIDE THE FILE (critical!)
const styles = StyleSheet.create({
  arrow: {
    backgroundColor: "white",
    padding: 5,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: "#1e40af",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default React.memo(HistoryRoute);
