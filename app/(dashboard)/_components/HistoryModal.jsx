import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import DateTimePickerModal from "react-native-modal-datetime-picker";

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
  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);

  const showStartPicker = () => setStartPickerVisible(true);
  const hideStartPicker = () => setStartPickerVisible(false);

  const showEndPicker = () => setEndPickerVisible(true);
  const hideEndPicker = () => setEndPickerVisible(false);

  const handleStartConfirm = useCallback(
    (date) => {
      setStartDate(date);
      hideStartPicker();
    },
    [setStartDate],
  );

  const handleEndConfirm = useCallback(
    (date) => {
      setEndDate(date);
      hideEndPicker();
    },
    [setEndDate],
  );

  const handleSubmit = useCallback(() => {
    if (!selectedPlate) {
      Alert.alert("Error", "Please select a vehicle");
      return;
    }
    if (startDate >= endDate) {
      Alert.alert("Error", "Start time must be before end time");
      return;
    }
    onSubmit(selectedPlate, startDate, endDate);
  }, [selectedPlate, startDate, endDate, onSubmit]);

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
          <View
            style={[
              styles.picker,
              { backgroundColor: isDark ? "#2a2a2a" : "#f9fafb" },
            ]}>
            <Picker
              selectedValue={selectedPlate}
              onValueChange={setSelectedPlate}
              dropdownIconColor={isDark ? "#fff" : "#000"}
              style={{ color: isDark ? "#fff" : "#000" }}>
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
            style={[
              styles.dateBtn,
              {
                borderColor: isDark ? "#444" : "#e5e7eb",
                backgroundColor: isDark ? "#2a2a2a" : "#f9fafb",
              },
            ]}
            onPress={showStartPicker}>
            <Ionicons
              name='calendar-outline'
              size={20}
              color='#3b82f6'
              style={styles.dateIcon}
            />
            <Text style={{ color: isDark ? "#fff" : "#000", flex: 1 }}>
              {startDate.toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
            End Time
          </Text>
          <TouchableOpacity
            style={[
              styles.dateBtn,
              {
                borderColor: isDark ? "#444" : "#e5e7eb",
                backgroundColor: isDark ? "#2a2a2a" : "#f9fafb",
              },
            ]}
            onPress={showEndPicker}>
            <Ionicons
              name='calendar-outline'
              size={20}
              color='#3b82f6'
              style={styles.dateIcon}
            />
            <Text style={{ color: isDark ? "#fff" : "#000", flex: 1 }}>
              {endDate.toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: "#3b82f6" },
              loading && styles.btnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <>
                <Ionicons
                  name='search'
                  size={18}
                  color='#fff'
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.btnText}>Load History</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#ef4444" }]}
            onPress={onClear}
            disabled={loading}>
            <Ionicons
              name='trash-outline'
              size={18}
              color='#fff'
              style={{ marginRight: 8 }}
            />
            <Text style={styles.btnText}>Clear Route</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Time Pickers */}
      <DateTimePickerModal
        isVisible={isStartPickerVisible}
        mode='datetime'
        onConfirm={handleStartConfirm}
        onCancel={hideStartPicker}
        date={startDate}
        maximumDate={new Date()}
        isDarkModeEnabled={isDark}
      />

      <DateTimePickerModal
        isVisible={isEndPickerVisible}
        mode='datetime'
        onConfirm={handleEndConfirm}
        onCancel={hideEndPicker}
        date={endDate}
        maximumDate={new Date()}
        isDarkModeEnabled={isDark}
      />
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
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  dateIcon: {
    marginRight: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  btn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
