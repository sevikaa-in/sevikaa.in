import React from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert 
} from 'react-native';

interface ProfileScreenProps {
  role: 'employer' | 'worker';
  setRole: (r: 'employer' | 'worker') => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ role, setRole }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Account &amp; Verification Profile</Text>

      {/* PROFILE HEADER CARD */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>S</Text>
        </View>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.profileName}>Sharma Household</Text>
          <Text style={styles.profileMeta}>+91 98765 43210 &nbsp;|&nbsp; employer@sevikaa.in</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓ Aadhaar Verified 🟢</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓ Residency Verified 🟢</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ROLE SWITCHER SECTION */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>ACTIVE PLATFORM ROLE</Text>
        <Text style={styles.sectionCardSub}>Switch your active view on Sevikaa platform:</Text>

        <View style={styles.roleBtnRow}>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'employer' && styles.roleBtnActiveEmployer]}
            onPress={() => setRole('employer')}
          >
            <Text style={[styles.roleBtnText, role === 'employer' && styles.roleBtnTextActive]}>
              🏠 Household Employer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleBtn, role === 'worker' && styles.roleBtnActiveWorker]}
            onPress={() => setRole('worker')}
          >
            <Text style={[styles.roleBtnText, role === 'worker' && styles.roleBtnTextActive]}>
              🧹 Domestic Helper
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SUPPORT & LEGAL */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>SUPPORT &amp; HELPLINE</Text>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert("Contact Support", "Call helpline: +91 87577 28679 or email support@sevikaa.in")}
        >
          <Text style={styles.menuItemText}>📞 24/7 Sevikaa Helpline &amp; WhatsApp Support</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert("Language", "Selected Language: English (Indian)")}
        >
          <Text style={styles.menuItemText}>🌐 App Language: English / हिन्दी / বাংলা</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItemDanger}
          onPress={() => Alert.alert("Log Out", "Are you sure you want to log out?", [
            { text: "Cancel" },
            { text: "Log Out", style: "destructive" }
          ])}
        >
          <Text style={styles.menuItemDangerText}>🚪 Log Out Session</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerBrand}>Sevikaa Mobile v1.0.0 • Powered by YugaYatra Retail</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 16 },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  profileName: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  profileMeta: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  badge: { backgroundColor: '#E6F4EA', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: '#137333', fontSize: 10, fontWeight: '800' },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionCardTitle: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.8 },
  sectionCardSub: { fontSize: 12, fontWeight: '600', color: '#334155', marginVertical: 6 },
  roleBtnRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  roleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#F1F5F9' },
  roleBtnActiveEmployer: { backgroundColor: '#1A73E8' },
  roleBtnActiveWorker: { backgroundColor: '#34A853' },
  roleBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  roleBtnTextActive: { color: '#FFFFFF' },
  menuItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuItemText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  menuItemDanger: { paddingVertical: 12, marginTop: 4 },
  menuItemDangerText: { fontSize: 13, fontWeight: '800', color: '#DC2626' },
  footerBrand: { textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#94A3B8', marginTop: 12, marginBottom: 20 },
});
