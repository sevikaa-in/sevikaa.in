import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, ActivityIndicator, Modal, Alert 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Sparkles, MapPin, ShieldCheck, Search, Users, Phone } from 'lucide-react-native';

export const EmployerHomeScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [bookingWorker, setBookingWorker] = useState<any | null>(null);

  const categories = ['All', 'Cook', 'Maid', 'Nanny'];

  useEffect(() => {
    fetchCandidates();
  }, [searchQuery, selectedCategory]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { apiClient } = await import('../../services/apiClient');
      const data = await apiClient.get('api/employer/workers');
      if (data && Array.isArray(data.workers)) {
        setCandidates(data.workers);
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
    const matchesCategory = selectedCategory === 'All' || skillsArr.map((s: string) => s.toLowerCase()).includes(selectedCategory.toLowerCase());
    return matchesQuery && matchesCategory;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* HERO BANNER */}
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroIconBox}>
            <Sparkles size={22} color="#FFFFFF" />
          </View>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>Sevikaa Household Portal ⚡</Text>
            <Text style={styles.heroSub}>Find police verified Cooks, Maids &amp; Nannies in your gated society.</Text>
          </View>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <Search size={16} color="#64748B" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search verified domestic helpers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* CATEGORY PILLS */}
      <View style={styles.categoryRow}>
        {categories.map(cat => (
          <TouchableOpacity 
            key={cat}
            style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CANDIDATES LIST */}
      {loading ? (
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginVertical: 20 }} />
      ) : filteredCandidates.length === 0 ? (
        <View style={styles.emptyCard}>
          <Users size={32} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Helpers Found</Text>
          <Text style={styles.emptySub}>No verified candidates matching "{selectedCategory}" in your area.</Text>
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
          </View>
        ))
      )}

    </ScrollView>
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
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  catPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  catPillActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  catText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  catTextActive: { color: '#FFFFFF' },
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
});
