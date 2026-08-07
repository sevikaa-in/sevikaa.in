import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView 
} from 'react-native';
import { DocumentUploadCard } from '../../components/DocumentUploadCard';

interface EmployerRelocateProps {
  onBack?: () => void;
  onRelocateSuccess?: (newSociety: string) => void;
}

export const EmployerRelocateScreen: React.FC<EmployerRelocateProps> = ({ onBack, onRelocateSuccess }) => {
  const [currentSociety, setCurrentSociety] = useState('DLF Westend Heights - Akshayanagar, Bengaluru');
  const [targetSociety, setTargetSociety] = useState('');
  const [relocationReason, setRelocationReason] = useState('Moved to new residential gated society');
  const [relocationProofUrl, setRelocationProofUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const VERIFIED_SOCIETIES = [
    'Prestige Song of the South - Begur, Bengaluru',
    'SNN Raj Serenity - Yelenahalli, Bengaluru',
    'Purva Westend - Kudlu Gate, Bengaluru',
    'Sobha Royal Pavilion - Sarjapur Road, Bengaluru',
    'Godrej Eternity - Kanakapura Road, Bengaluru',
    'Prestige Falcon City - Kanakapura Road, Bengaluru',
    'Brigade Lakefront - Whitefield, Bengaluru',
    'Hiranandani Meadows - Thane, Mumbai',
    'DLF Pinnacle - Phase 5, Gurgaon',
  ];

  const handleSubmit = () => {
    if (!targetSociety.trim()) {
      Alert.alert("Missing Society", "Please select or type your target new gated society name.");
      return;
    }
    if (!relocationProofUrl) {
      Alert.alert("Missing Proof Document", "Please upload a proof of residence document (RWA maintenance bill or society entry pass) for your new society.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Relocation Request Submitted ⏳",
        `Your society relocation request to "${targetSociety}" has been submitted to Sevikaa admin for audit. Verification usually takes 2-4 hours.`
      );
      if (onRelocateSuccess) {
        onRelocateSuccess(targetSociety);
      } else if (onBack) {
        onBack();
      }
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER BRANDING */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backLink} onPress={onBack}>
            <Text style={styles.backLinkText}>← Back to Account</Text>
          </TouchableOpacity>

          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>🏛️ GATED SOCIETY RELOCATION</Text>
          </View>
          <Text style={styles.title}>Request Society Transfer</Text>
          <Text style={styles.subtitle}>
            Moving to a new residential society? Request an official society transfer to retain your verified household status &amp; staff history.
          </Text>
        </View>

        {/* CURRENT SOCIETY BADGE CARD */}
        <View style={styles.currentCard}>
          <Text style={styles.cardHeader}>CURRENT REGISTERED SOCIETY</Text>
          <Text style={styles.currentSocietyText}>📍 {currentSociety}</Text>
          <Text style={styles.currentStatusText}>✓ Active Verified Resident</Text>
        </View>

        {/* RELOCATION FORM CARD */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>🏛️ New Gated Society Details</Text>

          <Text style={styles.label}>REASON FOR RELOCATION</Text>
          <TextInput 
            style={styles.input}
            value={relocationReason}
            onChangeText={setRelocationReason}
          />

          <Text style={styles.label}>TARGET NEW GATED SOCIETY</Text>
          <TextInput 
            style={styles.input}
            placeholder="Type or select new society name..."
            placeholderTextColor="#94A3B8"
            value={targetSociety}
            onChangeText={setTargetSociety}
          />

          {/* VERIFIED SOCIETIES CHIPS */}
          <Text style={styles.label}>POPULAR VERIFIED SOCIETIES</Text>
          <View style={styles.chipRow}>
            {VERIFIED_SOCIETIES.map((soc) => (
              <TouchableOpacity
                key={soc}
                style={[styles.chip, targetSociety === soc && styles.chipActive]}
                onPress={() => setTargetSociety(soc)}
              >
                <Text style={[styles.chipText, targetSociety === soc && styles.chipTextActive]}>
                  {targetSociety === soc ? '✓ ' : ''}{soc.split(' - ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* DOCUMENT UPLOAD */}
          <Text style={styles.label}>RESIDENCE PROOF DOCUMENT</Text>
          <DocumentUploadCard 
            title="New Society Maintenance Bill / RWA Pass"
            description="Upload maintenance bill, rent agreement, or RWA pass photo."
            docType="residency_proof"
            currentUrl={relocationProofUrl}
            onUploadSuccess={setRelocationProofUrl}
          />

          <TouchableOpacity 
            activeOpacity={0.85}
            disabled={loading}
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Submitting Transfer Request...' : 'Submit Society Relocation Request 🚀'}
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
  header: { marginBottom: 16 },
  backLink: { marginBottom: 12 },
  backLinkText: { color: '#1A73E8', fontSize: 13, fontWeight: '800' },
  pillBadge: {
    backgroundColor: '#E8F0FE',
    borderWidth: 1,
    borderColor: '#D2E3FC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  pillBadgeText: { color: '#1A73E8', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  currentCard: { backgroundColor: '#EFF6FF', borderRadius: 18, borderWidth: 1.5, borderColor: '#BFDBFE', padding: 16, marginBottom: 14 },
  cardHeader: { fontSize: 10, fontWeight: '900', color: '#1E40AF', letterSpacing: 0.8, marginBottom: 4 },
  currentSocietyText: { fontSize: 15, fontWeight: '900', color: '#1E3A8A' },
  currentStatusText: { fontSize: 11, fontWeight: '800', color: '#1A73E8', marginTop: 4 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 18 },
  formTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
  label: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.8, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontWeight: '700', color: '#0F172A' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: '#E8F0FE', borderColor: '#1A73E8' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: '#1A73E8', fontWeight: '900' },
  submitBtn: { backgroundColor: '#1A73E8', paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 18 },
  submitBtnDisabled: { backgroundColor: '#94A3B8' },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
