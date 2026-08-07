import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView 
} from 'react-native';

export const EmployerPostJobScreen: React.FC<{ onPostSuccess?: () => void }> = ({ onPostSuccess }) => {
  // Category Selection (Only 3 Allowed Roles)
  const [category, setCategory] = useState<'cook' | 'maid' | 'nanny'>('cook');
  
  // Requisition Details
  const [title, setTitle] = useState('');
  const [societyName, setSocietyName] = useState('DLF Westend Heights');
  const [salary, setSalary] = useState('15000');
  const [flatType, setFlatType] = useState('3BHK Apartment');
  const [familyMembers, setFamilyMembers] = useState('4 Members (2 Adults, 2 Kids)');
  const [dietaryPref, setDietaryPref] = useState('Both Veg & Non-Veg');
  const [shiftPreset, setShiftPreset] = useState<'morning' | 'fullday' | 'livein'>('fullday');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Perks & Requirements
  const [selectedPerks, setSelectedPerks] = useState<string[]>([
    'Meals Included on Duty', 'Tea & Morning Snacks', 'Sunday Off'
  ]);
  const [selectedReqs, setSelectedReqs] = useState<string[]>([
    'Aadhaar Verification Mandatory', '2+ Years Gated Society Experience'
  ]);

  const togglePerk = (perk: string) => {
    setSelectedPerks(prev => 
      prev.includes(perk) ? prev.filter(p => p !== perk) : [...prev, perk]
    );
  };

  const toggleReq = (req: string) => {
    setSelectedReqs(prev => 
      prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req]
    );
  };

  const handleCreateRequisition = () => {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a title for your job requisition.");
      return;
    }
    if (!salary.trim()) {
      Alert.alert("Missing Salary", "Please enter the offered monthly salary in INR ₹.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Job Requisition Posted! ⚡",
        `Your job "${title}" has been published to DLF Westend Heights society feed and submitted for admin verification.`
      );
      if (onPostSuccess) {
        onPostSuccess();
      }
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER BRANDING */}
        <View style={styles.header}>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>⚡ POST NEW JOB REQUISITION</Text>
          </View>
          <Text style={styles.title}>Post Household Requisition</Text>
          <Text style={styles.subtitle}>
            Publish a verified job posting to your gated society feed &amp; match with candidate Cooks, Maids &amp; Nannies.
          </Text>
        </View>

        {/* 1. ROLE CATEGORY SELECTOR (COOK, MAID, NANNY ONLY) */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>SELECT HELPER CATEGORY</Text>
          <View style={styles.roleGrid}>
            {[
              { id: 'cook', label: 'Cook', emoji: '🍳', sub: 'North/South Indian Meals' },
              { id: 'maid', label: 'Maid', emoji: '🧹', sub: 'House Cleaning & Dusting' },
              { id: 'nanny', label: 'Nanny', emoji: '👶', sub: 'Baby Care & Sitting' },
            ].map((roleObj) => {
              const isSelected = category === roleObj.id;
              return (
                <TouchableOpacity
                  key={roleObj.id}
                  activeOpacity={0.8}
                  style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                  onPress={() => {
                    setCategory(roleObj.id as any);
                    if (!title) {
                      setTitle(`Experienced ${roleObj.label} Required`);
                    }
                  }}
                >
                  <Text style={styles.roleEmoji}>{roleObj.emoji}</Text>
                  <Text style={[styles.roleLabel, isSelected && styles.roleLabelSelected]}>
                    {roleObj.label}
                  </Text>
                  <Text style={styles.roleSub}>{roleObj.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. REQUISITION DETAILS FORM */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>📝 Requisition Details</Text>

          <Text style={styles.label}>REQUISITION TITLE</Text>
          <TextInput 
            style={styles.input}
            placeholder="e.g. Experienced North Indian Cook Needed"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>PRIMARY GATED SOCIETY</Text>
          <TextInput 
            style={styles.input}
            value={societyName}
            onChangeText={setSocietyName}
          />

          <Text style={styles.label}>OFFERED MONTHLY SALARY (INR ₹)</Text>
          <TextInput 
            style={styles.input}
            placeholder="15000"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            value={salary}
            onChangeText={setSalary}
          />

          <View style={styles.rowTwo}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>FLAT TYPE / SIZE</Text>
              <TextInput style={styles.input} value={flatType} onChangeText={setFlatType} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>FAMILY MEMBERS</Text>
              <TextInput style={styles.input} value={familyMembers} onChangeText={setFamilyMembers} />
            </View>
          </View>

          <Text style={styles.label}>DIETARY PREFERENCE</Text>
          <View style={styles.chipRow}>
            {['Both Veg & Non-Veg', 'Pure Veg Only'].map((pref) => (
              <TouchableOpacity
                key={pref}
                style={[styles.chip, dietaryPref === pref && styles.chipActive]}
                onPress={() => setDietaryPref(pref)}
              >
                <Text style={[styles.chipText, dietaryPref === pref && styles.chipTextActive]}>
                  {dietaryPref === pref ? '✓ ' : ''}{pref}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SHIFT SLOTS PRESET */}
          <Text style={styles.label}>SHIFT HOURS PRESET</Text>
          <View style={styles.shiftPresetRow}>
            {[
              { id: 'morning', label: '🌅 Morning (6 AM - 12 PM)' },
              { id: 'fullday', label: '☀️ Full Day (9 AM - 6 PM)' },
              { id: 'livein', label: '🏡 24x7 Live-In Help' },
            ].map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.shiftBtn, shiftPreset === p.id && styles.shiftBtnActive]}
                onPress={() => setShiftPreset(p.id as any)}
              >
                <Text style={[styles.shiftBtnText, shiftPreset === p.id && styles.shiftBtnTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>JOB DESCRIPTION &amp; REQUIREMENTS</Text>
          <TextInput 
            style={[styles.input, { height: 80 }]}
            multiline
            placeholder="Specify daily tasks, timing, and household requirements..."
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* 3. PERKS & MANDATORY REQUIREMENTS */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>🎁 Perks &amp; Verification Mandates</Text>

          <Text style={styles.label}>HOUSEHOLD PERKS OFFERED</Text>
          <View style={styles.chipRow}>
            {[
              'Meals Included on Duty', 'Tea & Morning Snacks', 'Sunday Off', 'Diwali Bonus'
            ].map((perk) => {
              const isSelected = selectedPerks.includes(perk);
              return (
                <TouchableOpacity
                  key={perk}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => togglePerk(perk)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {isSelected ? '✓ ' : ''}{perk}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>MANDATORY WORKER AUDIT MANDATES</Text>
          <View style={styles.chipRow}>
            {[
              'Aadhaar Verification Mandatory', 
              '2+ Years Gated Society Experience', 
              'Local Reference & Police Clearance'
            ].map((req) => {
              const isSelected = selectedReqs.includes(req);
              return (
                <TouchableOpacity
                  key={req}
                  style={[styles.chip, isSelected && styles.chipActiveBlue]}
                  onPress={() => toggleReq(req)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActiveBlue]}>
                    {isSelected ? '✓ ' : ''}{req}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SUBMIT ACTION BUTTON */}
        <TouchableOpacity 
          activeOpacity={0.85}
          disabled={loading}
          style={[styles.submitCtaBtn, loading && styles.submitCtaBtnDisabled]}
          onPress={handleCreateRequisition}
        >
          <Text style={styles.submitCtaBtnText}>
            {loading ? 'Publishing Requisition...' : 'Post Requisition to Society Feed ⚡'}
          </Text>
        </TouchableOpacity>

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
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 18, marginBottom: 14 },
  cardHeader: { fontSize: 13, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5, marginBottom: 12 },
  roleGrid: { flexDirection: 'row', gap: 10 },
  roleCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1.5, borderColor: '#CBD5E1', padding: 12, alignItems: 'center' },
  roleCardSelected: { backgroundColor: '#E8F0FE', borderColor: '#1A73E8' },
  roleEmoji: { fontSize: 24, marginBottom: 4 },
  roleLabel: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  roleLabelSelected: { color: '#1A73E8' },
  roleSub: { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 2 },
  label: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.8, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontWeight: '700', color: '#0F172A' },
  rowTwo: { flexDirection: 'row', gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: '#E6F4EA', borderColor: '#34A853' },
  chipActiveBlue: { backgroundColor: '#E8F0FE', borderColor: '#1A73E8' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: '#137333', fontWeight: '900' },
  chipTextActiveBlue: { color: '#1A73E8', fontWeight: '900' },
  shiftPresetRow: { gap: 8 },
  shiftBtn: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  shiftBtnActive: { backgroundColor: '#E8F0FE', borderColor: '#1A73E8' },
  shiftBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  shiftBtnTextActive: { color: '#1A73E8', fontWeight: '900' },
  submitCtaBtn: { backgroundColor: '#1A73E8', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 4, shadowColor: '#1A73E8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  submitCtaBtnDisabled: { backgroundColor: '#94A3B8' },
  submitCtaBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
