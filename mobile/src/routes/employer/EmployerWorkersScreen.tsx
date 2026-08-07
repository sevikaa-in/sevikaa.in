import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Linking, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Users, Search, Phone, Star, ShieldCheck, MapPin, CheckCircle2, Calendar, X } from 'lucide-react-native';

export const EmployerWorkersScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'cook' | 'maid' | 'nanny'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Gate Meeting Modal State
  const [interviewCandidate, setInterviewCandidate] = useState<any | null>(null);
  const [interviewDate, setInterviewDate] = useState('Tomorrow (11:00 AM)');
  const [gateNotes, setGateNotes] = useState('Main Gate Entrance - Block B');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('worker_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setCandidates(data);
      } else {
        setCandidates([]);
      }
    } catch (e) {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const nameStr = (c.full_name || c.name || '').toLowerCase();
    const matchesQuery = searchQuery === '' || nameStr.includes(searchQuery.toLowerCase());
    const skillsArr = Array.isArray(c.skills) ? c.skills : [c.category || 'cook'];
    const matchesCategory = activeCategory === 'all' || skillsArr.map((s: string) => s.toLowerCase()).includes(activeCategory.toLowerCase());
    return matchesQuery && matchesCategory;
  });

  const handleConfirmInterview = () => {
    if (!interviewCandidate) return;
    Alert.alert(
      "Gate Interview Scheduled 🟢",
      `Gate Pass & SMS invitation sent to ${interviewCandidate.full_name || 'Worker'} for ${interviewDate}.`
    );
    setInterviewCandidate(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HERO */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroIconBox}>
              <Users size={22} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Verified Candidate Applicants</Text>
              <Text style={styles.heroSub}>Review police verified domestic helpers, check ratings &amp; schedule gate interviews.</Text>
            </View>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search candidate name or skill..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* CATEGORY TABS */}
        <View style={styles.tabRow}>
          {(['all', 'cook', 'maid', 'nanny'] as const).map(cat => (
            <TouchableOpacity 
              key={cat}
              style={[styles.tabPill, activeCategory === cat && styles.tabPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>
                {cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator size="large" color="#1A73E8" style={{ marginVertical: 20 }} />
        ) : filteredCandidates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={32} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Applicants Found</Text>
            <Text style={styles.emptySub}>No candidate applications matching your search criteria in the database.</Text>
          </View>
        ) : (
          filteredCandidates.map((cand) => (
            <View key={cand.id} style={styles.candCard}>
              <View style={styles.cardHeader}>
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color="#15803D" />
                  <Text style={styles.verifiedBadgeText}>Police Cleared ✓</Text>
                </View>
                <Text style={styles.salaryText}>₹{Number(cand.expected_salary || 14000).toLocaleString('en-IN')}/mo</Text>
              </View>

              <Text style={styles.candName}>{cand.full_name || 'Verified Helper'}</Text>

              <View style={styles.locRow}>
                <MapPin size={13} color="#1A73E8" />
                <Text style={styles.locText}>{cand.preferred_society_name || 'DLF Westend Heights'}</Text>
              </View>

              <View style={styles.footerRow}>
                <TouchableOpacity 
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${cand.phone || '+919876543210'}`)}
                >
                  <Phone size={14} color="#15803D" />
                  <Text style={styles.callBtnText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.interviewBtn}
                  onPress={() => setInterviewCandidate(cand)}
                >
                  <Calendar size={14} color="#1A73E8" />
                  <Text style={styles.interviewBtnText}>Schedule Interview</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* SCHEDULE MODAL */}
        {interviewCandidate && (
          <Modal visible transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Schedule Gate Interview</Text>
                  <TouchableOpacity onPress={() => setInterviewCandidate(null)}>
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSub}>
                  Invite {interviewCandidate.full_name || 'Worker'} for society gate interview.
                </Text>

                <Text style={styles.inputLabel}>Interview Date &amp; Time</Text>
                <TextInput 
                  style={styles.textInput}
                  value={interviewDate}
                  onChangeText={setInterviewDate}
                />

                <Text style={styles.inputLabel}>Society Entrance Notes</Text>
                <TextInput 
                  style={styles.textInput}
                  value={gateNotes}
                  onChangeText={setGateNotes}
                />

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity 
                    style={styles.modalCancelBtn}
                    onPress={() => setInterviewCandidate(null)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalSubmitBtn}
                    onPress={handleConfirmInterview}
                  >
                    <Text style={styles.modalSubmitText}>Confirm Gate Pass</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  heroCard: { backgroundColor: '#1A73E8', borderRadius: 20, padding: 18, marginBottom: 14 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 14 },
  heroTextCol: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  heroSub: { fontSize: 11, color: '#E8F0FE', marginTop: 2, lineHeight: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  tabPill: { flex: 1, paddingVertical: 8, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  tabPillActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  tabText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center' },
  candCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  verifiedBadgeText: { fontSize: 10, fontWeight: '900', color: '#15803D' },
  salaryText: { fontSize: 13, fontWeight: '900', color: '#1A73E8' },
  candName: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locText: { fontSize: 11, fontWeight: '700', color: '#1A73E8' },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  callBtnText: { fontSize: 12, fontWeight: '800', color: '#15803D' },
  interviewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#E8F0FE', paddingVertical: 8, borderRadius: 10 },
  interviewBtnText: { fontSize: 12, fontWeight: '800', color: '#1A73E8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  modalTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 10, marginBottom: 4 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#0F172A' },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalCancelBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#F1F5F9' },
  modalCancelText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  modalSubmitBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#1A73E8' },
  modalSubmitText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
});
