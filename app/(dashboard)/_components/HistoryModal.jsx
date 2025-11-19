// app/(dashboard)/_components/HistoryModal.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";

export default function HistoryModal({
  vehicles,
  selectedPlate,
  setSelectedPlate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  loading,
  onSubmit,
  onClear,
  onClose,
  isDark,
}) {
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const onStartChange = useCallback((event, selected) => {
    setShowStart(Platform.OS === "ios"); // iOS keeps picker open
    if (selected) setStartDate(selected);
  }, []);

  const onEndChange = useCallback((event, selected) => {
    setShowEnd(Platform.OS === "ios");
    if (selected) setEndDate(selected);
  }, []);

  return (
    <>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Vehicle History</ThemedText>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name='close' size={28} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
            Select Vehicle
          </Text>
          <View style={styles.picker}>
            <Picker
              selectedValue={selectedPlate}
              onValueChange={setSelectedPlate}
              dropdownIconColor={isDark ? "#fff" : "#000"}>
              <Picker.Item label='Choose a vehicle' value='' />
              {vehicles.map((v) => (
                <Picker.Item
                  key={v.number_plate}
                  label={v.number_plate}
                  value={v.number_plate}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
            Start Time
          </Text>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowStart(true)}>
            <Text style={{ color: isDark ? "#fff" : "#000" }}>
              {startDate.toLocaleString()}
            </Text>
          </TouchableOpacity>
          {showStart && (
            <DateTimePicker
              value={startDate}
              mode='datetime'
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onStartChange}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
            End Time
          </Text>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowEnd(true)}>
            <Text style={{ color: isDark ? "#fff" : "#000" }}>
              {endDate.toLocaleString()}
            </Text>
          </TouchableOpacity>
          {showEnd && (
            <DateTimePicker
              value={endDate}
              mode='datetime'
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onEndChange}
            />
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#3b82f6" }]}
            onPress={onSubmit(selectedPlate, startDate, endDate)}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.btnText}>Load History</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#ef4444" }]}
            onPress={onClear}>
            <Text style={styles.btnText}>Clear Route</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scroll: { padding: 16 },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  picker: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  dateBtn: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    justifyContent: "center",
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 10 },
  btn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
