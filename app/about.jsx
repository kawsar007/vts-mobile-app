import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useVehicles } from "../hooks/useVehicles";
const About = () => {
  const {
    vehicles,
    loading,
    error,
    refresh,
    getNumberPlatesQuery,
    getNumberPlates,
    meta,
  } = useVehicles();

  console.log("Get Vehicles Number Plates:--->", getNumberPlates());

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: {error}</Text>
        <TouchableOpacity onPress={refresh}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Text>Total Vehicles: {meta?.total}</Text>
      <Text>User Role: {meta?.user_role}</Text>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={refresh}
        refreshing={loading}
        renderItem={({ item }) => (
          <View style={{ padding: 16, borderBottomWidth: 1 }}>
            <Text style={{ fontWeight: "bold" }}>{item.number_plate}</Text>
            <Text>
              {item.model} - {item.vehicle_type}
            </Text>
            <Text>Driver: {item.driver_name}</Text>
            <Text>Owner: {item.owner_name}</Text>
            <Text>Status: {item.is_active ? "Active" : "Inactive"}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default About;

// import { View, Text } from 'react-native';
// import { useVehicles } from '../hooks/useVehicles';
// const About = () => {
//     const {
//     vehicles,
//     loading,
//     error,
//     refresh,
//     getNumberPlatesQuery,
//     getNumberPlates,
//     meta
//   } = useVehicles();

//   console.log("Get Vehicles Number Plates:--->", getNumberPlates());

//     return (
//         <View>
//             <Text>About</Text>
//             <Text>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.</Text>
//         </View>
//     )
// }

// export default About;
