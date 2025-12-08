// app/(dashboard)/_components/HistoryRoute.jsx
import React, { useEffect, useRef, useMemo, useState } from "react";
import { Polyline, Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { calculateBearing } from "../../../helper/calculateBearing";
import Svg, { Path } from "react-native-svg";

// Custom Arrow Component
const ArrowMarker = ({ bearing }) => (
  <View style={{ transform: [{ rotate: `${bearing}deg` }] }}>
    <View style={styles.proArrow}>
      <MaterialCommunityIcons 
        name="arrow-up-bold-hexagon-outline" 
        size={24} 
        color="#FFFFFF" 
      />
    </View>
  </View>
);

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
    return validPoints.map((p) => ({
      latitude: p.lat,
      longitude: p.lng,
    }));
  }, [validPoints]);

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
      {/* Blue route line */}
      <Polyline
        coordinates={coords}
        strokeColor='#3b82f6'
        strokeWidth={6}
        zIndex={10}
      />

      {/* Arrow points at each location - only render when ready */}
      {markersReady && pointsWithBearings.map((point, i) => (
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

      {/* Start flag */}
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

      {/* End flag */}
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