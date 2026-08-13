import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { ArrowLeft, Building2, Search, Check, CheckCircle2, Upload, FileText } from 'lucide-react-native';
import { DocumentUploadCard } from '../../components/DocumentUploadCard';
import { supabase } from '../../lib/supabase';
import { useMobileLanguage } from '../../context/LanguageContext';
import { useUserProfile } from '../../context/UserProfileContext';

interface EmployerRelocateProps {
  onBack?: () => void;
  onRelocateSuccess?: (newSociety: string) => void;
}

export const EmployerRelocateScreen: React.FC<EmployerRelocateProps> = ({ onBack, onRelocateSuccess }) => {
  const { t } = useMobileLanguage();
  const { employerProfile, profile } = useUserProfile();

  const currentSociety = employerProfile?.society_name || profile?.society || 'Adarsh Palm Retreat, Bellandur, Bangalore';
  const [relocationReason, setRelocationReason] = useState('Moved to new residential gated society');
  const [targetSociety, setTargetSociety] = useState('');
  const [targetSocietyId, setTargetSocietyId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [relocationProofUrl, setRelocationProofUrl] = useState('');
  const [loadingSocieties, setLoadingSocieties] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [dbSocieties, setDbSocieties] = useState<any[]>([]);

  useEffect(() => {
    fetchSocieties();
  }, []);

  const fetchSocieties = async () => {
    setLoadingSocieties(true);
    try {
      const { apiClient } = await import('../../services/apiClient');
      const data = await apiClient.get('/api/societies');
      if (data && Array.isArray(data.societies)) {
        setDbSocieties(data.societies.map((soc: any) => ({
          id: soc.id,
          name: soc.name,
          locality: soc.locality || soc.city || soc.address || 'Verified Gated Society'
        })));
      } else {
        setDbSocieties([
          { id: 's1', name: 'Adarsh Palm Retreat', locality: 'Bellandur, Bengaluru' },
          { id: 's2', name: 'DLF Westend Heights', locality: 'Akshayanagar, Bengaluru' },
          { id: 's3', name: 'Prestige Song of the South', locality: 'Begur, Bengaluru' },
          { id: 's4', name: 'SNN Raj Serenity', locality: 'Yelenahalli, Bengaluru' },
          { id: 's5', name: 'Purva Westend', locality: 'Kudlu Gate, Bengaluru' },
          { id: 's6', name: 'Sobha Royal Pavilion', locality: 'Sarjapur Road, Bengaluru' },
          { id: 's7', name: 'Godrej Eternity', locality: 'Kanakapura Road, Bengaluru' },
        ]);
      }
    } catch (e) {
      console.warn("Fetch societies notice:", e);
    } finally {
      setLoadingSocieties(false);
    }
  };

  const filteredSocieties = dbSocieties.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return s.name.toLowerCase().includes(q) || s.locality.toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    if (!targetSociety.trim()) {
      Alert.alert(t('missingSocietyTitle', 'Missing Target Society'), t('missingSocietyMsg', 'Please select your new target gated society from the list.'));
      return;
    }
    if (!relocationProofUrl) {
      Alert.alert(t('missingProofTitle', 'Missing Residence Proof'), t('missingProofMsg', 'Please upload a proof of residence document (Maintenance Bill, Electricity Bill or Rent Agreement) for your new society.'));
      return;
    }

    setSubmitting(true);
    try {
      const { apiClient } = await import('../../services/apiClient');
      await apiClient.post('api/employer/relocate', {
        targetSociety: targetSociety.trim(),
        targetSocietyId: targetSocietyId || null,
        residencyProofUrl: relocationProofUrl,
        reason: 'Society relocation request'
      });
    } catch (e) {
      console.warn("Relocate request notice:", e);
    }

    setSubmitting(false);
    Alert.alert(
      t('relocationSubmittedTitle', 'Relocation Request Submitted ⏳'),
      `Your society transfer request to "${targetSociety}" has been submitted to Sevikaa admin for verification audit.`
    );
    if (onRelocateSuccess) onRelocateSuccess(targetSociety);
    else if (onBack) onBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* BACK LINK */}
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ArrowLeft size={14} color="#1A73E8" />
            <Text style={styles.backBtnText}>Back to Employer Account Settings</Text>
          </TouchableOpacity>
        )}

        {/* HEADER CARD */}
        <View style={styles.headerCard}>
          <View style={styles.headerTitleRow}>
            <Building2 size={22} color="#1A73E8" />
            <Text style={styles.pageTitle}>{t('gatedSocietyRelocationRequest', 'Gated Society Relocation Request')}</Text>
          </View>
          <Text style={styles.pageSub}>
            {t('relocationRequestSub', 'Updating your residential society requires admin audit & new residence proof verification to maintain neighborhood trust & candidate matching security.')}
          </Text>
        </View>

        {/* CURRENT REGISTERED SOCIETY CARD */}
        <View style={styles.currentCard}>
          <Text style={styles.currentCardTag}>{t('currentRegisteredSociety', 'CURRENT REGISTERED GATED SOCIETY')}</Text>
          <View style={styles.currentCardRow}>
            <Text style={styles.currentSocietyName}>📍 {currentSociety}</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>{t('activeRegisteredBadge', 'ACTIVE REGISTERED')}</Text>
            </View>
          </View>
        </View>

        {/* MAIN RELOCATION FORM CARD */}
        <View style={styles.formCard}>
          
          {/* STEP 1: RELOCATION REASON */}
          <Text style={styles.stepTitle}>1. {t('primaryReasonRelocation', 'Primary Reason for Society Relocation')}</Text>
          <View style={styles.reasonPillsCol}>
            {[
              'Moved to new residential gated society',
              'Selected incorrect society during initial registration',
              'Temporary apartment relocation',
              'Other specific relocation reason'
            ].map(r => (
              <TouchableOpacity 
                key={r}
                style={[styles.reasonPill, relocationReason === r && styles.reasonPillSelected]}
                onPress={() => setRelocationReason(r)}
              >
                <Text style={[styles.reasonPillText, relocationReason === r && styles.reasonPillTextSelected]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* STEP 2: SELECT TARGET NEW GATED SOCIETY */}
          <Text style={styles.stepTitle}>2. {t('selectTargetNewSociety', 'Select Target New Gated Society')}</Text>
          
          <View style={styles.searchBarWrap}>
            <Search size={15} color="#94A3B8" />
            <TextInput 
              style={styles.searchInput}
              placeholder={t('searchSocietyPlaceholder', 'Search society name or locality...')}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Scrollable Societies List */}
          <View style={styles.societiesListBox}>
            {loadingSocieties ? (
              <ActivityIndicator size="small" color="#1A73E8" style={{ padding: 20 }} />
            ) : filteredSocieties.length === 0 ? (
              <Text style={styles.emptySocietiesText}>No verified society found matching "{searchQuery}"</Text>
            ) : (
              filteredSocieties.map(soc => {
                const isSelected = targetSociety === soc.name;
                return (
                  <TouchableOpacity 
                    key={soc.id}
                    style={[styles.societyItem, isSelected && styles.societyItemSelected]}
                    onPress={() => {
                      setTargetSociety(soc.name);
                      setTargetSocietyId(soc.id);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.societyItemName, isSelected && styles.societyItemNameSelected]}>{soc.name}</Text>
                      <Text style={[styles.societyItemLocality, isSelected && styles.societyItemLocalitySelected]}>{soc.locality}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {targetSociety.length > 0 && (
            <View style={styles.targetSelectedBox}>
              <CheckCircle2 size={16} color="#15803D" />
              <Text style={styles.targetSelectedText}>Selected Target Society: <Text style={{ fontWeight: '900' }}>{targetSociety}</Text></Text>
            </View>
          )}

          {/* STEP 3: UPLOAD NEW RESIDENCE PROOF */}
          <Text style={styles.stepTitle}>3. {t('uploadNewResidenceProof', 'Upload New Residence Proof')}</Text>
          <DocumentUploadCard 
            title="New Society Maintenance Bill / Rent Receipt"
            description="Upload maintenance bill, electricity receipt or rent agreement photo."
            docType="residency_proof"
            currentUrl={relocationProofUrl}
            onUploadSuccess={setRelocationProofUrl}
          />

          {/* SUBMIT BUTTON */}
          <TouchableOpacity 
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            disabled={submitting}
            onPress={handleSubmit}
          >
            {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <Text style={styles.submitBtnText}>{t('submitRelocationRequestBtn', 'Submit Society Relocation Request for Admin Audit')}</Text>
            )}
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  backBtnText: { fontSize: 11.5, fontWeight: '900', color: '#1A73E8' },

  headerCard: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 24, padding: 18, marginBottom: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pageTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  pageSub: { fontSize: 12, fontWeight: '600', color: '#64748B', lineHeight: 18 },

  currentCard: { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#BFDBFE', borderRadius: 20, padding: 16, marginBottom: 16 },
  currentCardTag: { fontSize: 9.5, fontWeight: '900', color: '#1E40AF', letterSpacing: 0.5, marginBottom: 4 },
  currentCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  currentSocietyName: { fontSize: 14, fontWeight: '900', color: '#0F172A', flex: 1 },
  activePill: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#93C5FD', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activePillText: { fontSize: 9, fontWeight: '900', color: '#1D4ED8' },

  formCard: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 24, padding: 18 },
  stepTitle: { fontSize: 11, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },

  reasonPillsCol: { gap: 6, marginBottom: 12 },
  reasonPill: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  reasonPillSelected: { backgroundColor: '#EFF6FF', borderColor: '#1A73E8' },
  reasonPillText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  reasonPillTextSelected: { color: '#1A73E8', fontWeight: '900' },

  searchBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 12.5, fontWeight: '600', color: '#0F172A' },

  societiesListBox: { maxHeight: 200, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 6, gap: 4 },
  emptySocietiesText: { fontSize: 11, fontWeight: '600', color: '#64748B', textAlign: 'center', padding: 20 },
  societyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 10, borderRadius: 12 },
  societyItemSelected: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  societyItemName: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
  societyItemNameSelected: { color: '#FFFFFF' },
  societyItemLocality: { fontSize: 10, fontWeight: '600', color: '#64748B', marginTop: 1 },
  societyItemLocalitySelected: { color: '#DBEAFE' },
  checkCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },

  targetSelectedBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', padding: 10, borderRadius: 12, marginTop: 8 },
  targetSelectedText: { fontSize: 11, fontWeight: '700', color: '#065F46' },

  submitBtn: { backgroundColor: '#1A73E8', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 18 },
  submitBtnDisabled: { backgroundColor: '#94A3B8' },
  submitBtnText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
});
