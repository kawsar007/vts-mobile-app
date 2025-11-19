import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ThemedText from './ThemedText';

const VehicleHistoryForm = ({ vehicles, onSubmit, loading, isDark }) => {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedTime, setSelectedTime] = useState('last_hour');
  const [startTime, setStartTime] = useState(new Date(Date.now() - 3600000)); // 1 hour ago
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const timeOptions = [
    { label: 'Last Hour', value: 'last_hour' },
    { label: 'Last 3 Hours', value: 'last_3_hours' },
    { label: 'Last 6 Hours', value: 'last_6_hours' },
    { label: 'Last 12 Hours', value: 'last_12_hours' },
    { label: 'Last 24 Hours', value: 'last_24_hours' },
    { label: 'Custom Range', value: 'custom' },
  ];

  const handleTimeChange = (value) => {
    setSelectedTime(value);
    const now = new Date();
    
    switch (value) {
      case 'last_hour':
        setStartTime(new Date(now.getTime() - 3600000));
        setEndTime(now);
        break;
      case 'last_3_hours':
        setStartTime(new Date(now.getTime() - 3 * 3600000));
        setEndTime(now);
        break;
      case 'last_6_hours':
        setStartTime(new Date(now.getTime() - 6 * 3600000));
        setEndTime(now);
        break;
      case 'last_12_hours':
        setStartTime(new Date(now.getTime() - 12 * 3600000));
        setEndTime(now);
        break;
      case 'last_24_hours':
        setStartTime(new Date(now.getTime() - 24 * 3600000));
        setEndTime(now);
        break;
    }
  };

  const handleSubmit = () => {
    if (!selectedVehicle) {
      alert('Please select a vehicle');
      return;
    }
    onSubmit(selectedVehicle, startTime, endTime);
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      {/* Vehicle Selection */}
      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Select Vehicle</ThemedText>
        <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6' }]}>
          <Picker
            selectedValue={selectedVehicle}
            onValueChange={setSelectedVehicle}
            style={[styles.picker, { color: isDark ? '#fff' : '#000' }]}
            dropdownIconColor={isDark ? '#fff' : '#000'}>
            <Picker.Item label="Choose a vehicle..." value="" />
            {vehicles.map((vehicle) => (
              <Picker.Item
                key={vehicle.id}
                label={`${vehicle.number_plate} - ${vehicle.model}`}
                value={vehicle.number_plate}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Time Range Selection */}
      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Select Time</ThemedText>
        <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6' }]}>
          <Picker
            selectedValue={selectedTime}
            onValueChange={handleTimeChange}
            style={[styles.picker, { color: isDark ? '#fff' : '#000' }]}
            dropdownIconColor={isDark ? '#fff' : '#000'}>
            {timeOptions.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Custom Date/Time Inputs */}
      {selectedTime === 'custom' && (
        <>
          {/* Start Time */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Start Time</ThemedText>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6' }]}
              onPress={() => setShowStartPicker(true)}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={20}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
              <Text style={[styles.dateText, { color: isDark ? '#fff' : '#000' }]}>
                {formatDateTime(startTime)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* End Time */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>End Time</ThemedText>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6' }]}
              onPress={() => setShowEndPicker(true)}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={20}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
              <Text style={[styles.dateText, { color: isDark ? '#fff' : '#000' }]}>
                {formatDateTime(endTime)}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}>
        {loading ? (
          <Text style={styles.submitText}>Loading...</Text>
        ) : (
          <>
            <MaterialCommunityIcons name="map-search" size={20} color="#fff" />
            <Text style={styles.submitText}>Show on Map</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartTime(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndTime(date);
          }}
        />
      )}
    </ScrollView>
  );
};

export default VehicleHistoryForm;

const styles = StyleSheet.create({
  formContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});