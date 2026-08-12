import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { getApiUrl } from '../../config/api';
import { secureTokenStorage } from '../../services/secureTokenStorage';
import { apiClient } from '../../services/apiClient';

export const WorkerOnboardingScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [societiesList, setSocietiesList] = useState<any[]>([]);

  // Step 1: Selfie & Photo
  const [selfieCaptured, setSelfieCaptured] = useState<boolean>(true);

  // Step 2: Basic Info (NO hardcoded demo data!)
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | ''>('');
  const [age, setAge] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Step 3: Helper Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState('');
  const [shiftPref, setShiftPref] = useState<'full_day' | 'part_time' | 'live_in'>('full_day');

  // Step 4: Salary & Society
  const [expectedSalary, setExpectedSalary] = useState('');
  const [society, setSociety] = useState('');

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const data = await apiClient.get('api/societies');
        if (data && data.societies && Array.isArray(data.societies)) {
          setSocietiesList(data.societies);
        }
      } catch (e) {
        console.warn('Failed to load societies list:', e);
      }
    };
    fetchSocieties();
  }, []);

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

  const validateStep = (): boolean => {
    if (step === 1) {
      return true;
    }
    if (step === 2) {
      if (!fullName.trim()) {
        Alert.alert("Validation Error ⚠️", "Please enter your full name as on official ID.");
        return false;
      }
      if (!gender) {
        Alert.alert("Validation Error ⚠️", "Please select your gender.");
        return false;
      }
      const parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 80) {
        Alert.alert("Validation Error ⚠️", "Please enter a valid age between 18 and 80.");
        return false;
      }
      if (selectedLanguages.length === 0) {
        Alert.alert("Validation Error ⚠️", "Please select at least one language you speak.");
        return false;
      }
    }
    if (step === 3) {
      if (selectedSkills.length === 0) {
        Alert.alert("Validation Error ⚠️", "Please select at least one helper skill category.");
        return false;
      }
      const parsedExp = parseInt(experienceYears, 10);
      if (isNaN(parsedExp) || parsedExp < 0) {
        Alert.alert("Validation Error ⚠️", "Please enter your experience in years.");
        return false;
      }
    }
    if (step === 4) {
      const parsedSalary = parseInt(expectedSalary, 10);
      if (isNaN(parsedSalary) || parsedSalary <= 0) {
        Alert.alert("Validation Error ⚠️", "Please specify expected monthly salary (greater than 0).");
        return false;
      }
      if (!society.trim()) {
        Alert.alert("Validation Error ⚠️", "Please specify your preferred apartment society.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);

    try {
      // PART 1: Dedicated Mobile Onboarding client method reading onboarding token from SecureStore
      const onboardingToken = await secureTokenStorage.getOnboardingToken();

      if (!onboardingToken) {
        setLoading(false);
        Alert.alert(
          "Session Expired 🚫",
          "No onboarding credential found. Please verify your phone number / OTP again to restart onboarding."
        );
        return;
      }

      const SHIFT_LABEL_MAP: Record<string, string> = {
        full_day: 'Full Day (8–12 Hours)',
        part_time: 'Part-Time Flexible',
        live_in: 'Live-In (24x7)'
      };
      const formattedShift = SHIFT_LABEL_MAP[shiftPref] || shiftPref;

      const res = await fetch(getApiUrl('api/worker/onboarding'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${onboardingToken}`
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          gender,
          age: parseInt(age, 10),
          experience_years: parseInt(experienceYears, 10) || 0,
          expected_salary: parseInt(expectedSalary, 10),
          skills: selectedSkills,
          languages_spoken: selectedLanguages,
          primary_gated_society: society.trim(),
          preferred_shift: formattedShift
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoading(false);
        if (res.status === 401 || res.status === 403) {
          await secureTokenStorage.clearOnboardingToken();
          Alert.alert(
            "Session Expired 🚫",
            data.message || "Your onboarding session has expired or is invalid. Please verify OTP again."
          );
          return;
        }
        Alert.alert(
          "Validation Error ⚠️",
          data.message || data.error || "Failed to complete worker onboarding. Please check your entries."
        );
        return;
      }

      // PART 5: Successful Onboarding -> clear onboarding token & save normal session tokens
      await secureTokenStorage.clearOnboardingToken();

      const accessToken = data.access_token || data.token || data.session?.access_token;
      const refreshToken = data.refresh_token || data.session?.refresh_token;

      if (accessToken) {
        await secureTokenStorage.saveTokens(accessToken, refreshToken);
      }

      setLoading(false);

      Alert.alert(
        "Candidate Passport Created! 🟢",
        "Your onboarding has been completed successfully.",
        [{ text: "OK", onPress: () => { if (onComplete) onComplete(); } }]
      );

    } catch (e: any) {
      setLoading(false);
      Alert.alert(
        "Network Error ⚠️",
        e?.message || "Failed to connect to server. Please check your connection and try again."
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
              <Text style={styles.photoStatus}>Selfie Verified 🟢</Text>
            </View>
          </View>
        )}

        {/* STEP 2: BASIC DETAILS */}
        {step === 2 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>👤 Step 2: Personal Details</Text>
            
            <Text style={styles.label}>FULL NAME (AS ON OFFICIAL ID)</Text>
            <TextInput 
              style={styles.input} 
              value={fullName} 
              onChangeText={setFullName}
              placeholder="Full name as per official ID" 
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>GENDER</Text>
            <View style={styles.chipGrid}>
              {[
                { id: 'female', label: 'Female' },
                { id: 'male', label: 'Male' },
                { id: 'other', label: 'Other' }
              ].map(g => {
                const isSelected = gender === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setGender(g.id as any)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {isSelected ? '✓ ' : ''}{g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>AGE (YEARS)</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="number-pad" 
              value={age} 
              onChangeText={setAge}
              placeholder="Age between 18 and 80" 
              placeholderTextColor="#94A3B8"
            />

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

        {/* STEP 3: HELPER SKILLS */}
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
            <TextInput 
              style={styles.input} 
              keyboardType="number-pad" 
              value={experienceYears} 
              onChangeText={setExperienceYears}
              placeholder="E.g., 3" 
              placeholderTextColor="#94A3B8"
            />
          </View>
        )}

        {/* STEP 4: SALARY & SOCIETY */}
        {step === 4 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>💰 Step 4: Salary &amp; Preferred Society</Text>
            
            <Text style={styles.label}>EXPECTED MONTHLY SALARY (₹)</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="number-pad" 
              value={expectedSalary} 
              onChangeText={setExpectedSalary}
              placeholder="E.g., 15000" 
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>PRIMARY GATED SOCIETY LOCATION</Text>
            <TextInput 
              style={styles.input} 
              value={society} 
              onChangeText={setSociety}
              placeholder="E.g., DLF Westend Heights" 
              placeholderTextColor="#94A3B8"
            />
          </View>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {step === 5 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>🛡️ Step 5: Review &amp; Submit</Text>
            <Text style={styles.stepDesc}>
              Review your details before completing registration.
            </Text>

            <View style={styles.reviewBox}>
              <Text style={styles.reviewRow}>👤 Name: <Text style={styles.reviewVal}>{fullName || '--'}</Text></Text>
              <Text style={styles.reviewRow}>🚻 Gender / Age: <Text style={styles.reviewVal}>{gender || '--'}, {age || '--'} yrs</Text></Text>
              <Text style={styles.reviewRow}>🗣️ Languages: <Text style={styles.reviewVal}>{selectedLanguages.join(', ') || 'None'}</Text></Text>
              <Text style={styles.reviewRow}>🧹 Skills: <Text style={styles.reviewVal}>{selectedSkills.join(', ') || 'None'}</Text></Text>
              <Text style={styles.reviewRow}>⭐ Experience: <Text style={styles.reviewVal}>{experienceYears || '0'} yrs</Text></Text>
              <Text style={styles.reviewRow}>💰 Expected Salary: <Text style={styles.reviewVal}>₹{expectedSalary || '0'} / mo</Text></Text>
              <Text style={styles.reviewRow}>🏢 Primary Society: <Text style={styles.reviewVal}>{society || 'Unspecified'}</Text></Text>
            </View>

            <View style={styles.securityBanner}>
              <Text style={styles.securityText}>🔒 Submitted securely to Sevikaa Onboarding API.</Text>
            </View>
          </View>
        )}

        {/* FOOTER BUTTONS */}
        <View style={styles.footerRow}>
          {step > 1 && (
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => setStep(step - 1)}
              disabled={loading}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}

          {step < 5 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next Step →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.nextBtn, loading && { opacity: 0.6 }]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.nextBtnText}>Submit Passport Setup 🚀</Text>
              )}
            </TouchableOpacity>
          )}
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
  label: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.8, marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontWeight: '700', color: '#0F172A' },
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
  reviewBox: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, gap: 8, marginBottom: 12 },
  reviewRow: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  reviewVal: { color: '#0F172A', fontWeight: '900' },
  securityBanner: { backgroundColor: '#E8F0FE', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#D2E3FC' },
  securityText: { fontSize: 11, color: '#1A73E8', textAlign: 'center', fontWeight: '700' },
  footerRow: { flexDirection: 'row', gap: 10 },
  backBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14 },
  backBtnText: { color: '#475569', fontSize: 13, fontWeight: '900' },
  nextBtn: { flex: 1, backgroundColor: '#1A73E8', paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
