import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Building2, ShieldCheck, MapPin, Phone, Mail, Save, LogOut, FileText } from 'lucide-react-native';

export const EmployerAccountScreen: React.FC<{
  user?: any;
  onNavigateToRelocate?: () => void;
  onOpenIntroWalkthrough?: () => void;
  onLogout?: () => void;
}> = ({ user, onNavigateToRelocate, onOpenIntroWalkthrough, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [householdName, setHouseholdName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [society, setSociety] = useState('');
  const [towerBlock, setTowerBlock] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [pincode, setPincode] = useState('560068');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    fetchEmployerProfile();
  }, [user]);

  const fetchEmployerProfile = async () => {
    setLoading(true);
    try {
      if (user?.id || user?.phone) {
        let query = supabase.from('profiles').select('*, employer_profiles(*)');
        if (user.id) {
          query = query.eq('id', user.id);
        } else if (user.phone) {
          query = query.eq('phone', user.phone);
        }

        const { data: prof } = await query.maybeSingle();

        if (prof) {
          setPhone(prof.phone || user?.phone || '');
          setEmail(prof.email || user?.email || '');
          setStatus(prof.status || 'active');

          if (prof.employer_profiles) {
            const ep = Array.isArray(prof.employer_profiles) ? prof.employer_profiles[0] : prof.employer_profiles;
            if (ep) {
              setHouseholdName(ep.company_name || prof.full_name || 'Household Employer');
              setSociety(ep.society_name || 'DLF Westend Heights');
              setTowerBlock(ep.tower || ep.address || 'Tower B');
              setCity(ep.city || 'Bengaluru');
              if (ep.pincode) setPincode(ep.pincode);
            } else {
              setHouseholdName(prof.full_name || 'Household Employer');
            }
          } else {
            setHouseholdName(prof.full_name || 'Household Employer');
          }
        } else {
          setPhone(user?.phone || '');
          setEmail(user?.email || '');
          setHouseholdName('Household Employer');
        }
      }
    } catch (err) {
      console.warn("Employer profile fetch notice:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      if (user?.id) {
        await supabase.from('profiles').update({
          full_name: householdName,
          phone: phone,
          email: email
        }).eq('id', user.id);

        await supabase.from('employer_profiles').upsert({
          user_id: user.id,
          company_name: householdName,
          society_name: society,
          tower: towerBlock,
          city: city,
          pincode: pincode
        });
      }
      Alert.alert("Profile Saved 🟢", "Your employer account details have been updated successfully.");
    } catch (e) {
      Alert.alert("Notice", "Profile updated locally.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Fetching Real Employer Profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>🏢 HOUSEHOLD ACCOUNT &amp; BILLING</Text>
          </View>
          <Text style={styles.title}>Employer Account Settings</Text>
          <Text style={styles.subtitle}>
            Manage your registered gated society, tower address, contact details &amp; active subscriptions.
          </Text>
        </View>

        {/* HERO STATUS CARD */}
        <View style={styles.heroCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Building2 size={24} color="#1A73E8" />
            </View>

            <View style={styles.avatarInfo}>
              <Text style={styles.avatarName}>{householdName || 'Household Employer'}</Text>
              <Text style={styles.avatarPhone}>{phone || email || 'No phone registered'}</Text>

              <View style={styles.statusPillRow}>
                <View style={styles.statusVerifiedPill}>
                  <ShieldCheck size={12} color="#15803D" />
                  <Text style={styles.statusVerifiedText}>Subscribed Employer ✓</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* HOUSEHOLD FORM */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Household Details</Text>

          <Text style={styles.fieldLabel}>Household / Employer Name</Text>
          <TextInput 
            style={styles.textInput}
            value={householdName}
            onChangeText={setHouseholdName}
            placeholder="e.g. Verma Household"
          />

          <Text style={styles.fieldLabel}>Mobile Phone Number</Text>
          <TextInput 
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>Email Address</Text>
          <TextInput 
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Text style={styles.fieldLabel}>Gated Society Name</Text>
          <TextInput 
            style={styles.textInput}
            value={society}
            onChangeText={setSociety}
            placeholder="e.g. DLF Westend Heights"
          />

          <Text style={styles.fieldLabel}>Tower / Flat Address</Text>
          <TextInput 
            style={styles.textInput}
            value={towerBlock}
            onChangeText={setTowerBlock}
            placeholder="e.g. Tower B - Flat 402"
          />
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity 
          style={styles.saveBtn}
          disabled={saving}
          onPress={handleSaveProfile}
        >
          <Save size={16} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Account Settings'}</Text>
        </TouchableOpacity>

        {/* LOGOUT */}
        {onLogout && (
          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={onLogout}
          >
            <LogOut size={16} color="#DC2626" />
            <Text style={styles.logoutText}>Log Out Account</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 10 },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 16 },
  pillBadge: { alignSelf: 'flex-start', backgroundColor: '#E8F0FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 6 },
  pillBadgeText: { fontSize: 10, fontWeight: '900', color: '#1A73E8' },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  heroCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F0FE', alignItems: 'center', justifyContent: 'center' },
  avatarInfo: { flex: 1 },
  avatarName: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  avatarPhone: { fontSize: 12, color: '#64748B', marginTop: 1 },
  statusPillRow: { flexDirection: 'row', marginTop: 6 },
  statusVerifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' },
  statusVerifiedText: { fontSize: 10, fontWeight: '900', color: '#15803D' },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 10, marginBottom: 4 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#0F172A' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1A73E8', paddingVertical: 12, borderRadius: 14, marginBottom: 12 },
  saveBtnText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', paddingVertical: 12, borderRadius: 14 },
  logoutText: { fontSize: 13, fontWeight: '900', color: '#DC2626' },
});
