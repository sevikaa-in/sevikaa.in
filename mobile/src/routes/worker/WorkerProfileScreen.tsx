import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Alert, Modal 
} from 'react-native';
import { 
  User, CheckCircle2, ShieldCheck, Clock, Save, Phone, 
  IndianRupee, Briefcase, Languages, ChevronDown, ChevronRight, 
  Camera, FileText, Sparkles, Lock, LogOut, Trash2, MapPin, X
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { getApiUrl } from '../../config/api';
import { useMobileLanguage } from '../../context/LanguageContext';

export const WorkerProfileScreen: React.FC<{ 
  user?: any; 
  onLogout?: () => void 
}> = ({ user, onLogout }) => {
  const { t } = useMobileLanguage();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Form State
  const [name, setName] = useState('testing');
  const [phone, setPhone] = useState('9876543210');
  const [email, setEmail] = useState('worker@sevikaa.in');
  const [society, setSociety] = useState('Prestige Shantiniketan, Whitefield');
  const [expectedSalary, setExpectedSalary] = useState('15000');
  const [experience, setExperience] = useState('3');
  const [gender, setGender] = useState('Female');
  const [age, setAge] = useState('28');
  const [preferredShift, setPreferredShift] = useState('Full Day (8–12 Hours)');
  const [emergencyContact, setEmergencyContact] = useState('9876500000');
  const [bio, setBio] = useState('Experienced household cook and housekeeping staff with 3 years experience.');

  const [selectedSkills, setSelectedSkills] = useState<string[]>(['cook', 'maid']);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['Hindi', 'English', 'Kannada']);

  // Dropdown States
  const [isExpDropdownOpen, setIsExpDropdownOpen] = useState(false);
  const [isShiftDropdownOpen, setIsShiftDropdownOpen] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      if (user?.id || user?.phone) {
        let query = supabase.from('profiles').select('*, worker_profiles(*)');
        if (user.id) {
          query = query.eq('id', user.id);
        } else if (user.phone) {
          query = query.eq('phone', user.phone);
        }
        const { data: prof } = await query.maybeSingle();

        if (prof) {
          setName(prof.worker_profiles?.full_name || prof.full_name || user?.full_name || 'testing');
          setPhone(prof.phone?.replace(/\D/g, '').slice(-10) || '9876543210');
          setEmail(prof.email || 'worker@sevikaa.in');

          if (prof.worker_profiles) {
            const wp = Array.isArray(prof.worker_profiles) ? prof.worker_profiles[0] : prof.worker_profiles;
            if (wp) {
              if (wp.expected_salary || wp.expectedSalary) setExpectedSalary(String(wp.expected_salary || wp.expectedSalary));
              if (wp.experience) setExperience(String(wp.experience));
              if (wp.preferred_society_name || wp.society) setSociety(wp.preferred_society_name || wp.society);
              if (wp.gender) setGender(wp.gender);
              if (wp.age) setAge(String(wp.age));
              if (wp.preferred_shift) setPreferredShift(wp.preferred_shift);
              if (wp.emergency_contact) setEmergencyContact(wp.emergency_contact);
              if (wp.bio) setBio(wp.bio);
              if (Array.isArray(wp.skills)) setSelectedSkills(wp.skills);
              if (Array.isArray(wp.languages)) setSelectedLangs(wp.languages);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Profile fetch notice:", err);
    }
    setLoading(false);
  };

  const handleToggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      if (selectedSkills.length <= 1) {
        Alert.alert("Notice", "Select at least 1 core role category.");
        return;
      }
      setSelectedSkills(prev => prev.filter(s => s !== skillId));
    } else {
      setSelectedSkills(prev => [...prev, skillId]);
    }
  };

  const handleToggleLang = (lang: string) => {
    if (selectedLangs.includes(lang)) {
      if (selectedLangs.length <= 1) return;
      setSelectedLangs(prev => prev.filter(l => l !== lang));
    } else {
      setSelectedLangs(prev => [...prev, lang]);
    }
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      if (user?.id) {
        await supabase.from('profiles').update({ full_name: name, updated_at: new Date().toISOString() }).eq('id', user.id);
        await supabase.from('worker_profiles').upsert({
          user_id: user.id,
          full_name: name,
          expected_salary: Number(expectedSalary) || 15000,
          experience: Number(experience) || 3,
          gender: gender,
          age: Number(age) || 28,
          preferred_shift: preferredShift,
          emergency_contact: emergencyContact,
          bio: bio,
          skills: selectedSkills,
          languages: selectedLangs,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn("Save profile notice:", err);
    }
    setSaveLoading(false);
    Alert.alert("Profile Updated 🟢", "Your Sevikaa Digital Worker Passport has been updated successfully.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* PAGE HEADER */}
      <View style={styles.pageHeader}>
        <View style={styles.eyebrowPill}>
          <ShieldCheck size={11} color="#1A73E8" />
          <Text style={styles.eyebrowText}>VERIFIED DIGITAL WORKER PASSPORT</Text>
        </View>

        <Text style={styles.pageTitle}>Worker Profile &amp; Verification</Text>
        <Text style={styles.pageSub}>
          Manage your candidate details, preferred shift hours, monthly salary expectations, and verification records.
        </Text>
      </View>

      {/* 💳 1. PASSPORT STATUS BOX (100% WEB MATCH) */}
      <View style={styles.passportBox}>
        <View style={styles.passportHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(name || 'T')[0].toUpperCase()}</Text>
          </View>

          <View style={styles.passportMainCol}>
            <Text style={styles.passportName}>{name}</Text>
            <Text style={styles.passportSociety}>📍 {society}</Text>

            <View style={styles.passportBadge}>
              <Clock size={11} color="#D97706" />
              <Text style={styles.passportBadgeText}>{t('pendingAdminAudit', 'PENDING ADMIN AUDIT')}</Text>
            </View>
          </View>
        </View>

        {/* 3 Verification Badges Row */}
        <View style={styles.verificationBadgesRow}>
          <View style={styles.badgePill}>
            <CheckCircle2 size={12} color="#16A34A" />
            <Text style={styles.badgeTextGreen}>Aadhaar Verified</Text>
          </View>
          <View style={styles.badgePill}>
            <Clock size={12} color="#D97706" />
            <Text style={styles.badgeTextAmber}>Police Audit Pending</Text>
          </View>
          <View style={styles.badgePill}>
            <CheckCircle2 size={12} color="#16A34A" />
            <Text style={styles.badgeTextGreen}>Gate Audit Passed</Text>
          </View>
        </View>
      </View>

      {/* 📝 2. EDITABLE PROFILE FORM */}
      <View style={styles.formCard}>
        
        {/* Full Name */}
        <Text style={styles.inputLabel}>Full Name (As on Aadhaar Card):</Text>
        <View style={styles.inputBox}>
          <User size={15} color="#64748B" />
          <TextInput 
            style={styles.textInput}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Mobile Number & Email */}
        <View style={styles.rowTwoCols}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Mobile Phone:</Text>
            <View style={styles.inputBoxDisabled}>
              <Phone size={14} color="#94A3B8" />
              <Text style={styles.textInputDisabled}>+91 {phone}</Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Age (Years):</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={styles.textInput}
                keyboardType="number-pad"
                value={age}
                onChangeText={setAge}
              />
            </View>
          </View>
        </View>

        {/* Monthly Expected Salary */}
        <Text style={styles.inputLabel}>Expected Monthly Salary (₹ / Mo):</Text>
        <View style={styles.inputBox}>
          <IndianRupee size={15} color="#15803D" />
          <TextInput 
            style={[styles.textInput, { color: '#15803D', fontWeight: '900' }]}
            keyboardType="number-pad"
            value={expectedSalary}
            onChangeText={setExpectedSalary}
          />
        </View>

        {/* Experience Dropdown Toggle */}
        <Text style={styles.inputLabel}>Work Experience:</Text>
        <TouchableOpacity 
          style={styles.dropdownBtn}
          onPress={() => setIsExpDropdownOpen(!isExpDropdownOpen)}
        >
          <View style={styles.dropdownLeft}>
            <Briefcase size={15} color="#1A73E8" />
            <Text style={styles.dropdownText}>{experience} Years Experience</Text>
          </View>
          <ChevronDown size={15} color="#64748B" />
        </TouchableOpacity>

        {isExpDropdownOpen && (
          <View style={styles.dropdownList}>
            {['1', '2', '3', '4', '5', '7', '10+'].map(exp => (
              <TouchableOpacity 
                key={exp}
                style={[styles.dropdownItem, experience === exp && styles.dropdownItemActive]}
                onPress={() => {
                  setExperience(exp);
                  setIsExpDropdownOpen(false);
                }}
              >
                <Text style={[styles.dropdownItemText, experience === exp && styles.dropdownItemTextActive]}>
                  {exp} {exp === '1' ? 'Year Experience' : 'Years Experience'}
                </Text>
                {experience === exp && <CheckCircle2 size={14} color="#1A73E8" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Preferred Shift Dropdown */}
        <Text style={styles.inputLabel}>Preferred Shift Slot:</Text>
        <TouchableOpacity 
          style={styles.dropdownBtn}
          onPress={() => setIsShiftDropdownOpen(!isShiftDropdownOpen)}
        >
          <View style={styles.dropdownLeft}>
            <Clock size={15} color="#1A73E8" />
            <Text style={styles.dropdownText}>{preferredShift}</Text>
          </View>
          <ChevronDown size={15} color="#64748B" />
        </TouchableOpacity>

        {isShiftDropdownOpen && (
          <View style={styles.dropdownList}>
            {[
              'Full Day (8–12 Hours)',
              'Early Morning (6 AM – 9 AM)',
              'Morning Shift (9 AM – 12 PM)',
              'Afternoon Shift (12 PM – 3 PM)',
              'Evening Shift (3 PM – 6 PM)',
              'Live-In (24x7 Residence)'
            ].map(shift => (
              <TouchableOpacity 
                key={shift}
                style={[styles.dropdownItem, preferredShift === shift && styles.dropdownItemActive]}
                onPress={() => {
                  setPreferredShift(shift);
                  setIsShiftDropdownOpen(false);
                }}
              >
                <Text style={[styles.dropdownItemText, preferredShift === shift && styles.dropdownItemTextActive]}>
                  {shift}
                </Text>
                {preferredShift === shift && <CheckCircle2 size={14} color="#1A73E8" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Core Categories / Skills */}
        <Text style={styles.inputLabel}>Core Role Categories:</Text>
        <View style={styles.skillsGrid}>
          {[
            { id: 'cook', label: '🍳 Cook / Chef' },
            { id: 'maid', label: '🧹 Maid / Housekeeping' },
            { id: 'nanny', label: '👶 Nanny / Childcare' }
          ].map(skill => {
            const isSelected = selectedSkills.includes(skill.id);
            return (
              <TouchableOpacity 
                key={skill.id}
                style={[styles.skillPill, isSelected && styles.skillPillActive]}
                onPress={() => handleToggleSkill(skill.id)}
              >
                <Text style={[styles.skillPillText, isSelected && styles.skillPillTextActive]}>
                  {skill.label}
                </Text>
                {isSelected && <CheckCircle2 size={13} color="#FFFFFF" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bio / Summary */}
        <Text style={styles.inputLabel}>Bio / Work Summary:</Text>
        <View style={[styles.inputBox, { height: 75, alignItems: 'flex-start', paddingTop: 8 }]}>
          <TextInput 
            style={[styles.textInput, { textAlignVertical: 'top' }]}
            multiline
            value={bio}
            onChangeText={setBio}
          />
        </View>

      </View>

      {/* 📄 3. VERIFICATION DOCUMENTS SECTION */}
      <View style={styles.docsCard}>
        <Text style={styles.docsSectionTitle}>Verification Documents &amp; Records</Text>
        
        <View style={styles.docItem}>
          <FileText size={18} color="#1A73E8" />
          <View style={styles.docTextCol}>
            <Text style={styles.docTitle}>Aadhaar Card (Front &amp; Back)</Text>
            <Text style={styles.docSub}>Government Identity Record</Text>
          </View>
          <View style={styles.docStatusVerified}>
            <CheckCircle2 size={12} color="#15803D" />
            <Text style={styles.docStatusVerifiedText}>Verified ✓</Text>
          </View>
        </View>

        <View style={styles.docItem}>
          <FileText size={18} color="#D97706" />
          <View style={styles.docTextCol}>
            <Text style={styles.docTitle}>Police Verification Certificate</Text>
            <Text style={styles.docSub}>Criminal &amp; Background Audit</Text>
          </View>
          <View style={styles.docStatusPending}>
            <Clock size={12} color="#D97706" />
            <Text style={styles.docStatusPendingText}>Audit Pending</Text>
          </View>
        </View>
      </View>

      {/* 💾 SAVE CHANGES BUTTON */}
      <TouchableOpacity 
        style={styles.saveBtn}
        onPress={handleSaveProfile}
        disabled={saveLoading}
      >
        <Save size={16} color="#FFFFFF" />
        <Text style={styles.saveBtnText}>
          {saveLoading ? 'Saving Changes...' : 'Save Profile Changes'}
        </Text>
      </TouchableOpacity>

      {/* 🚪 LOG OUT SESSION BUTTON */}
      {onLogout && (
        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={onLogout}
        >
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

  pageHeader: { marginBottom: 14 },
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

  // 1. Passport Box
  passportBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  passportHeader: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  passportMainCol: {
    flex: 1,
  },
  passportName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  passportSociety: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
    marginBottom: 6,
  },
  passportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  passportBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#92400E',
  },
  verificationBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
    paddingTop: 10,
  },
  badgePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeTextGreen: { fontSize: 9.5, fontWeight: '800', color: '#16A34A' },
  badgeTextAmber: { fontSize: 9.5, fontWeight: '800', color: '#D97706' },

  // 2. Form Card
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
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },

  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    marginTop: 4,
    padding: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: '#E8F0FE',
  },
  dropdownItemText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  dropdownItemTextActive: {
    color: '#1A73E8',
    fontWeight: '900',
  },

  skillsGrid: {
    gap: 6,
    marginTop: 2,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  skillPillActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  skillPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
  },
  skillPillTextActive: {
    color: '#FFFFFF',
  },

  // 3. Docs Card
  docsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  docsSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  docTextCol: {
    flex: 1,
  },
  docTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  docSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  docStatusVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  docStatusVerifiedText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#15803D',
  },
  docStatusPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  docStatusPendingText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#92400E',
  },

  // Actions
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 10,
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
