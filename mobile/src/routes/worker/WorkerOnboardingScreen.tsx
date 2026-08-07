import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView 
} from 'react-native';

export const WorkerOnboardingScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);

  // Step 1: Selfie & Photo
  const [selfieCaptured, setSelfieCaptured] = useState<boolean>(true);

  // Step 2: Basic Info
  const [fullName, setFullName] = useState('Sunita Devi');
  const [phone, setPhone] = useState('9876543210');
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);
  const [age, setAge] = useState('32');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Hindi', 'English', 'Kannada']);

  // Step 3: Skills (Cook, Maid, Nanny only)
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['cook', 'maid']);
  const [experienceYears, setExperienceYears] = useState('5');
  const [shiftPref, setShiftPref] = useState<'full_day' | 'part_time' | 'live_in'>('full_day');

  // Step 4: Salary & Society
  const [expectedSalary, setExpectedSalary] = useState('15000');
  const [society, setSociety] = useState('DLF Westend Heights - Akshayanagar');

  // Step 5: Verification Documents
  const [aadhaarUploaded, setAadhaarUploaded] = useState(true);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleLang = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      Alert.alert(
        "Candidate Passport Created! 🟢",
        "Your Aadhaar verification document & candidate passport have been submitted for admin audit.",
        [{ text: "OK", onPress: () => { if (onComplete) onComplete(); } }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER BRANDING */}
        <View style={styles.header}>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>🆔 WORKER PASSPORT REGISTRATION</Text>
          </View>
          <Text style={styles.title}>Candidate Passport Setup</Text>
          <Text style={styles.subtitle}>
            Step {step} of 5 • Complete your background check &amp; skill profile to start getting gated society calls.
          </Text>
        </View>

        {/* 5-STEP WIZARD PROGRESS BAR */}
        <View style={styles.stepBar}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View 
              key={s} 
              style={[
                styles.stepSegment, 
                s <= step && styles.stepSegmentActive
              ]} 
            />
          ))}
        </View>

        {/* STEP 1: SELFIE CAPTURE */}
        {step === 1 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>📷 Step 1: Capture Candidate Selfie</Text>
            <Text style={styles.stepDesc}>
              Take a clear front-facing photo for your verified Worker Passport ID badge.
            </Text>

            <View style={styles.photoPreviewBox}>
              <Text style={styles.photoEmoji}>📷</Text>
              <Text style={styles.photoStatus}>Selfie Captured &amp; Verified 🟢</Text>
            </View>

            <TouchableOpacity style={styles.reTakeBtn} onPress={() => setSelfieCaptured(true)}>
              <Text style={styles.reTakeBtnText}>🔄 Retake Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: BASIC DETAILS */}
        {step === 2 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>👤 Step 2: Personal Details &amp; Contact</Text>
            
            <Text style={styles.label}>FULL NAME (AS ON AADHAAR)</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

            <Text style={styles.label}>MOBILE PHONE (DLT SMS VERIFIED)</Text>
            <View style={styles.verifiedInputRow}>
              <TextInput style={[styles.input, { flex: 1 }]} value={phone} editable={false} />
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓ Verified 🟢</Text>
              </View>
            </View>

            <Text style={styles.label}>AGE (YEARS)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={age} onChangeText={setAge} />

            <Text style={styles.label}>LANGUAGES SPOKEN</Text>
            <View style={styles.chipGrid}>
              {['Hindi', 'English', 'Kannada', 'Tamil', 'Telugu', 'Bengali', 'Marathi'].map(lang => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => toggleLang(lang)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {isSelected ? '✓ ' : ''}{lang}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 3: HELPER SKILLS (COOK, MAID, NANNY ONLY) */}
        {step === 3 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>🧹 Step 3: Household Helper Skills</Text>
            <Text style={styles.stepDesc}>
              Select the primary roles you are qualified to perform in gated societies:
            </Text>

            <View style={styles.roleGrid}>
              {[
                { id: 'cook', title: '🍳 Home Cook', desc: 'North & South Indian Thali, Jain Meals' },
                { id: 'maid', title: '🧹 Housekeeper / Maid', desc: 'Mopping, Dusting, Utensils & Laundry' },
                { id: 'nanny', title: '👶 Baby Nanny', desc: 'Infant Feeding, Hygiene & Toddler Care' },
              ].map(role => {
                const isSelected = selectedSkills.includes(role.id);
                return (
                  <TouchableOpacity
                    key={role.id}
                    style={[styles.roleCard, isSelected && styles.roleCardActive]}
                    onPress={() => toggleSkill(role.id)}
                  >
                    <View style={styles.roleHeader}>
                      <Text style={styles.roleTitle}>{role.title}</Text>
                      {isSelected && <Text style={styles.roleCheck}>✓ Selected</Text>}
                    </View>
                    <Text style={styles.roleDesc}>{role.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>TOTAL EXPERIENCE (YEARS)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={experienceYears} onChangeText={setExperienceYears} />
          </View>
        )}

        {/* STEP 4: SALARY & SOCIETY */}
        {step === 4 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>💰 Step 4: Salary &amp; Preferred Society</Text>
            
            <Text style={styles.label}>EXPECTED MONTHLY SALARY (₹)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={expectedSalary} onChangeText={setExpectedSalary} />

            <Text style={styles.label}>PRIMARY GATED SOCIETY LOCATION</Text>
            <TextInput style={styles.input} value={society} onChangeText={setSociety} />
          </View>
        )}

        {/* STEP 5: AADHAAR VERIFICATION */}
        {step === 5 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>🛡️ Step 5: Aadhaar Verification Upload</Text>
            <Text style={styles.stepDesc}>
              Upload your 12-digit Aadhaar Card front photo to activate your verified candidate badge.
            </Text>

            <View style={styles.uploadBox}>
              <Text style={styles.uploadEmoji}>📄</Text>
              <Text style={styles.uploadStatus}>Aadhaar Card Front Photo Uploaded 🟢</Text>
            </View>

            <View style={styles.securityBanner}>
              <Text style={styles.securityText}>🔒 100% Encrypted &amp; Stored securely under IT Act 2000 guidelines.</Text>
            </View>
          </View>
        )}

        {/* FOOTER BUTTONS */}
        <View style={styles.footerRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {step === 5 ? 'Submit Passport Setup 🚀' : 'Next Step →'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 28 },
  header: { marginBottom: 14 },
  pillBadge: { backgroundColor: '#E8F0FE', borderWidth: 1, borderColor: '#D2E3FC', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  pillBadgeText: { color: '#1A73E8', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 12 },
  stepBar: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  stepSegment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  stepSegmentActive: { backgroundColor: '#1A73E8' },
  stepBox: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 16, marginBottom: 16 },
  stepTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  stepDesc: { fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 18 },
  photoPreviewBox: { backgroundColor: '#E8F0FE', borderWidth: 2, borderColor: '#1A73E8', borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 12 },
  photoEmoji: { fontSize: 36, marginBottom: 8 },
  photoStatus: { color: '#1A73E8', fontSize: 13, fontWeight: '900' },
  reTakeBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  reTakeBtnText: { color: '#475569', fontSize: 12, fontWeight: '800' },
  label: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.8, marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontWeight: '700', color: '#0F172A' },
  verifiedInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifiedBadge: { backgroundColor: '#E6F4EA', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#CEEAD6' },
  verifiedBadgeText: { color: '#137333', fontSize: 11, fontWeight: '900' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  chipActive: { backgroundColor: '#E8F0FE', borderColor: '#1A73E8' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: '#1A73E8', fontWeight: '900' },
  roleGrid: { gap: 10, marginBottom: 12 },
  roleCard: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 12 },
  roleCardActive: { borderColor: '#1A73E8', backgroundColor: '#F0F6FF' },
  roleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  roleCheck: { fontSize: 11, fontWeight: '900', color: '#1A73E8' },
  roleDesc: { fontSize: 11, color: '#64748B', marginTop: 2 },
  uploadBox: { backgroundColor: '#E6F4EA', borderWidth: 2, borderColor: '#34A853', borderStyle: 'dashed', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12 },
  uploadEmoji: { fontSize: 32, marginBottom: 6 },
  uploadStatus: { color: '#137333', fontSize: 13, fontWeight: '900' },
  securityBanner: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  securityText: { fontSize: 11, color: '#64748B', textAlign: 'center' },
  footerRow: { flexDirection: 'row', gap: 10 },
  backBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14 },
  backBtnText: { color: '#475569', fontSize: 13, fontWeight: '900' },
  nextBtn: { flex: 1, backgroundColor: '#1A73E8', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  nextBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
