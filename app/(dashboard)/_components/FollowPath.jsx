import React from "react";
import { View } from "react-native";
import { Marker, Polyline } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function FollowPath({ path, isActive }) {
  if (!isActive || path.length === 0) return null;

  // get coordinates for path
  const coordinates = path.map((point) => ({
    latitude: parseFloat(point.latitude),
    longitude: parseFloat(point.longitude),
  }));

  // Render arrow markers at intervals
  const renderArrows = () => {
    const arrows = [];
    const arrowInterval = Math.max(1, Math.floor(path.length / 10)); // Show ~10 arrows max

    for (let i = arrowInterval; i < path.length; i += arrowInterval) {
      const point = path[i];
      if (point.bearing !== undefined) {
        arrows.push(
          <Marker
            key={`arrow-${i}`}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={point.bearing}>
            <View
              style={{
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center",
              }}>
              <MaterialCommunityIcons
                name='arrow-up-bold'
                size={20}
                color='#6366f1'
              />
            </View>
          </Marker>,
        );
      }
    }
    return arrows;
  };

  const currentPosition = path[path.length - 1];

  return (
    <>
      <Polyline
        coordinates={coordinates}
        strokeColor='#6366f1'
        strokeWidth={4}
        lineDashPattern={[1]}
      />

      {renderArrows()}

      {/* Current position marker */}
      <Marker
        coordinate={{
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        flat
        rotation={currentPosition.bearing || 0}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#6366f1",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 3,
            borderColor: "#fff",
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}>
          <MaterialCommunityIcons name='truck-fast' size={24} color='#fff' />
        </View>
      </Marker>

      {/* Start position marker */}
      {path.length > 1 && (
        <Marker
          coordinate={{
            latitude: path[0].latitude,
            longitude: path[0].longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}>
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#10b981",
              borderWidth: 3,
              borderColor: "#fff",
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          />
        </Marker>
      )}
    </>
  );
}
