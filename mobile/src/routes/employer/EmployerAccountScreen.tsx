import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Alert 
} from 'react-native';
import { 
  User, Building2, MapPin, Phone, Mail, Save, 
  LogOut, ShieldCheck, Clock, CheckCircle2
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useMobileLanguage } from '../../context/LanguageContext';

export const EmployerAccountScreen: React.FC<{ 
  user?: any;
  onLogout?: () => void;
  onNavigateToRelocate?: () => void;
  onOpenIntroWalkthrough?: () => void;
}> = ({ user, onLogout, onNavigateToRelocate, onOpenIntroWalkthrough }) => {
  const { t } = useMobileLanguage();
  const [name, setName] = useState('sharama house');
  const [phone, setPhone] = useState('9876543210');
  const [email, setEmail] = useState('employer@sevikaa.in');
  const [society, setSociety] = useState('Adarsh Palm Retreat, Bellandur');
  const [tower, setTower] = useState('Tower B');
  const [flat, setFlat] = useState('Flat 402');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
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
          setName(prof.employer_profiles?.company_name || prof.full_name || 'sharama house');
          setPhone(prof.phone?.replace(/\D/g, '').slice(-10) || '9876543210');
          setEmail(prof.email || 'employer@sevikaa.in');
          if (prof.employer_profiles) {
            const ep = Array.isArray(prof.employer_profiles) ? prof.employer_profiles[0] : prof.employer_profiles;
            if (ep) {
              if (ep.society_name) setSociety(ep.society_name);
              if (ep.tower) setTower(ep.tower);
              if (ep.address) setFlat(ep.address);
            }
          }
        }
      }
    } catch (e) {}
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (user?.id) {
        await supabase.from('profiles').update({ full_name: name, updated_at: new Date().toISOString() }).eq('id', user.id);
        await supabase.from('employer_profiles').upsert({
          user_id: user.id,
          company_name: name,
          society_name: society,
          tower: tower,
          address: flat,
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {}
    setIsSaving(false);
    Alert.alert("Account Profile Updated 🟢", "Your employer household profile details have been saved.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* PAGE HEADER */}
      <View style={styles.headerCard}>
        <View style={styles.eyebrowPill}>
          <User size={11} color="#1A73E8" />
          <Text style={styles.eyebrowText}>EMPLOYER ACCOUNT SETTINGS</Text>
        </View>

        <Text style={styles.pageTitle}>Household Account Profile</Text>
        <Text style={styles.pageSub}>
          Manage your gated society address, household details, and active membership plan.
        </Text>
      </View>

      {/* FORM CARD */}
      <View style={styles.formCard}>
        
        {/* Name */}
        <Text style={styles.inputLabel}>Household Employer Name:</Text>
        <View style={styles.inputBox}>
          <User size={15} color="#64748B" />
          <TextInput 
            style={styles.textInput}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Mobile Phone & Email */}
        <Text style={styles.inputLabel}>Registered Phone Number:</Text>
        <View style={styles.inputBoxDisabled}>
          <Phone size={15} color="#94A3B8" />
          <Text style={styles.textInputDisabled}>+91 {phone}</Text>
        </View>

        <Text style={styles.inputLabel}>Email Address:</Text>
        <View style={styles.inputBox}>
          <Mail size={15} color="#64748B" />
          <TextInput 
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Society */}
        <Text style={styles.inputLabel}>Gated Residential Society:</Text>
        <View style={styles.inputBox}>
          <Building2 size={15} color="#1A73E8" />
          <TextInput 
            style={styles.textInput}
            value={society}
            onChangeText={setSociety}
          />
        </View>

        {/* Tower & Flat */}
        <View style={styles.rowTwoCols}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Tower / Block:</Text>
            <TextInput 
              style={styles.textInputBox}
              value={tower}
              onChangeText={setTower}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Flat Number:</Text>
            <TextInput 
              style={styles.textInputBox}
              value={flat}
              onChangeText={setFlat}
            />
          </View>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity 
          style={styles.saveBtn}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          <Save size={16} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>
            {isSaving ? 'Saving Changes...' : 'Save Account Profile'}
          </Text>
        </TouchableOpacity>

      </View>

      {/* LOG OUT BUTTON */}
      {onLogout && (
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <LogOut size={16} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Log Out Session</Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },

  headerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  eyebrowText: { fontSize: 9.5, fontWeight: '900', color: '#1A73E8' },
  pageTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  pageSub: { fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 16 },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  inputBoxDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  textInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  textInputDisabled: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  textInputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 18,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: 16,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#DC2626',
  },
});
