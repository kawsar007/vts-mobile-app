// app/(dashboard)/_components/HistoryRoute.jsx
import React, { useEffect, useRef, useMemo } from "react";
import { Polyline, Marker, Circle } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { calculateBearing } from "../../../helper/calculateBearing";

const HistoryRoute = ({ history, mapRef, isHistoryActive, currentRegion }) => {
  const hasFittedRef = useRef(false);

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

  useEffect(() => {
    if (!isHistoryActive || !mapRef.current || coords.length < 2) {
      hasFittedRef.current = false;
      return;
    }

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

      {/* DEBUG: Big colored circles at each point */}
      {validPoints.map((point, i) => (
        <Circle
          key={`circle-${i}`}
          center={{ latitude: point.lat, longitude: point.lng }}
          radius={20}
          fillColor='rgba(255, 165, 0, 0.6)'
          strokeColor='#FF8C00'
          strokeWidth={2}
          zIndex={15}
        />
      ))}

      {/* Direction arrows */}
      {validPoints.slice(0, -1).map((point, i) => {
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
            key={`arrow-${i}`}
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

      {/* Start flag */}
      <Marker coordinate={coords[0]} anchor={{ x: 0.5, y: 1 }} zIndex={30}>
        <MaterialCommunityIcons name='flag' size={40} color='#22c55e' />
      </Marker>

      {/* End flag */}
      <Marker
        coordinate={coords[coords.length - 1]}
        anchor={{ x: 0.5, y: 1 }}
        zIndex={30}>
        <MaterialCommunityIcons
          name='flag-checkered'
          size={40}
          color='#ef4444'
        />
      </Marker>
    </>
  );
};

const styles = StyleSheet.create({
  arrow: {
    backgroundColor: "white",
    padding: 6,
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
