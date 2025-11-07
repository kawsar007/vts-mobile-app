import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from "react-native";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import Spacer from "../../components/Spacer";
import { useUser } from "../../hooks/useUser";
import ThemedButton from "../../components/ThemedButton";
import { Colors } from "../../constants/Colors";

const Profile = () => {
  const { logout, user } = useUser();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: logout
        }
      ]
    );
  };

  // Helper function to format roles
  const formatRole = (role) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>●</Text>
            </View>
          </View>
          
          <ThemedText style={styles.name}>{user?.name}</ThemedText>
          <ThemedText style={styles.username}>@{user?.username}</ThemedText>
          
          {/* Role Badges */}
          <View style={styles.rolesContainer}>
            {user?.roles?.map((role, index) => (
              <View key={index} style={styles.roleBadge}>
                <Text style={styles.roleText}>{formatRole(role)}</Text>
              </View>
            ))}
          </View>
        </View>

        <Spacer height={30} />

        {/* Information Cards */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Contact Information</ThemedText>
          
          <View style={styles.card}>
            <InfoRow icon="📧" label="Email" value={user?.email} />
            <View style={styles.divider} />
            <InfoRow icon="📱" label="Phone" value={user?.phone} />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Address Details</ThemedText>
          
          <View style={styles.card}>
            <InfoRow icon="📍" label="Address" value={user?.address} multiline />
            <View style={styles.divider} />
            <InfoRow icon="🏙️" label="Division" value={user?.division} />
            <View style={styles.divider} />
            <InfoRow icon="🗺️" label="District" value={user?.district} />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account Status</ThemedText>
          
          <View style={styles.card}>
            <InfoRow 
              icon={user?.is_active ? "✅" : "❌"} 
              label="Status" 
              value={user?.is_active ? "Active" : "Inactive"}
              valueStyle={user?.is_active ? styles.activeStatus : styles.inactiveStatus}
            />
            <View style={styles.divider} />
            <InfoRow icon="🆔" label="User ID" value={`#${user?.id}`} />
          </View>
        </View>

        <Spacer height={20} />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
          </TouchableOpacity>

          <ThemedButton onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>🚪 Logout</Text>
          </ThemedButton>
        </View>

        <Spacer height={40} />
      </ScrollView>
    </ThemedView>
  );
};

// Reusable Info Row Component
const InfoRow = ({ icon, label, value, multiline, valueStyle }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
    </View>
    <ThemedText 
      style={[
        styles.infoValue, 
        multiline && styles.infoValueMultiline,
        valueStyle
      ]}
      numberOfLines={multiline ? undefined : 1}
    >
      {value || 'N/A'}
    </ThemedText>
  </View>
);

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  statusBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    color: "#4CAF50",
    fontSize: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 12,
  },
  rolesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  roleBadge: {
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  roleText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
    opacity: 0.8,
  },
  card: {
    backgroundColor: "rgba(241, 238, 238, 1)",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1.5,
  },
  infoValueMultiline: {
    textAlign: "right",
  },
  activeStatus: {
    color: "#4CAF50",
  },
  inactiveStatus: {
    color: "#f44336",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 4,
  },
  actionButtons: {
    gap: 12,
  },
  editButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f44336",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});


// import { StyleSheet, Text } from "react-native";
// import ThemedView from "../../components/ThemedView";
// import ThemedText from "../../components/ThemedText";
// import Spacer from "../../components/Spacer";
// import { useUser } from "../../hooks/useUser";
// import ThemedButton from "../../components/ThemedButton";

// const Profile = () => {
//   const { logout, user } = useUser();
//   return (
//     <ThemedView style={styles.container}>
//       <ThemedText title={true} style={styles.heading}>
//         {user.email}
//       </ThemedText>
//       <Spacer />

//       <ThemedText>Time to start reading some books...</ThemedText>
//       <Spacer />

//       <ThemedButton onPress={logout} style={styles.button}>
//         <Text style={{ color: "#f2f2f2" }}>Logout</Text>
//       </ThemedButton>
//     </ThemedView>
//   );
// };

// export default Profile;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   heading: {
//     fontWeight: "bold",
//     fontSize: 18,
//     textAlign: "center",
//   },
// });
