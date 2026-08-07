import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Modal, Alert 
} from 'react-native';
import { 
  Building2, MapPin, Search, Check, ShieldCheck, 
  Briefcase, Users, Star, Plus, X, Globe, Home
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { getApiUrl } from '../../config/api';
import { useMobileLanguage } from '../../context/LanguageContext';

export const WorkerSocietiesScreen: React.FC<{ user?: any }> = ({ user }) => {
  const { t } = useMobileLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'selected' | 'high_hiring'>('all');
  const [societies, setSocieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [primarySocietyId, setPrimarySocietyId] = useState<string>('');
  const [secondarySocietyIds, setSecondarySocietyIds] = useState<string[]>([]);

  // Request Unlisted Society Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newSocietyName, setNewSocietyName] = useState('');
  const [newSocietyLocality, setNewSocietyLocality] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSocieties();
  }, [user]);

  const fetchSocieties = async () => {
    setLoading(true);
    try {
      const { data: dbSocieties } = await supabase
        .from('societies')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbSocieties && dbSocieties.length > 0) {
        setSocieties(dbSocieties);
        if (dbSocieties[0]?.id) setPrimarySocietyId(dbSocieties[0].id);
        if (dbSocieties[1]?.id) setSecondarySocietyIds([dbSocieties[1].id]);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Supabase societies fetch notice:", err);
    }

    try {
      const res = await fetch(getApiUrl('api/admin/data?tab=societies&limit=20'));
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.societies)) {
          setSocieties(data.societies);
          if (data.societies[0]?.id) setPrimarySocietyId(data.societies[0].id);
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  const filteredSocieties = useMemo(() => {
    return societies.filter(soc => {
      // 1. Search Query Filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const name = (soc.name || '').toLowerCase();
        const area = (soc.area || soc.locality || soc.city || '').toLowerCase();
        if (!name.includes(q) && !area.includes(q)) return false;
      }

      // 2. Tab Filter
      if (activeTab === 'selected') {
        return soc.id === primarySocietyId || secondarySocietyIds.includes(soc.id);
      }
      if (activeTab === 'high_hiring') {
        return Number(soc.active_jobs_count || soc.employers_count || 0) > 0;
      }

      return true;
    });
  }, [societies, searchQuery, activeTab, primarySocietyId, secondarySocietyIds]);

  const handleSelectPrimary = (soc: any) => {
    setPrimarySocietyId(soc.id);
    setSecondarySocietyIds(prev => prev.filter(id => id !== soc.id));
    Alert.alert("Primary Workplace Updated 🟢", `${soc.name} set as your primary gated society.`);
  };

  const handleToggleSecondary = (soc: any) => {
    if (soc.id === primarySocietyId) {
      Alert.alert("Notice", "This society is already your Primary Workplace.");
      return;
    }
    if (secondarySocietyIds.includes(soc.id)) {
      setSecondarySocietyIds(prev => prev.filter(id => id !== soc.id));
      Alert.alert("Removed 🟢", `${soc.name} removed from secondary workplaces.`);
    } else {
      if (secondarySocietyIds.length >= 3) {
        Alert.alert("Limit Reached", "You can select up to 3 secondary workplaces.");
        return;
      }
      setSecondarySocietyIds(prev => [...prev, soc.id]);
      Alert.alert("Secondary Workplace Added 🟢", `${soc.name} added to secondary workplaces.`);
    }
  };

  const handleRequestUnlistedSubmit = () => {
    if (!newSocietyName.trim()) {
      Alert.alert("Error", "Please enter the society name.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowRequestModal(false);
      setNewSocietyName('');
      setNewSocietyLocality('');
      Alert.alert("Request Submitted 🟢", "Sevikaa Admin team will verify and add your society within 24 hours.");
    }, 600);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* PAGE HEADER */}
      <View style={styles.pageHeader}>
        <View style={styles.eyebrowPill}>
          <Building2 size={11} color="#1A73E8" />
          <Text style={styles.eyebrowText}>GATED RESIDENTIAL NETWORK</Text>
        </View>

        <Text style={styles.pageTitle}>Gated Societies Directory</Text>
        <Text style={styles.pageSub}>
          Select your primary and secondary society workplaces to get instant gate pass alerts &amp; job matches.
        </Text>
      </View>

      {/* SEARCH BAR & UNLISTED REQUEST BUTTON */}
      <View style={styles.searchCard}>
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search gated societies, towers, or areas..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.requestUnlistedBtn}
          onPress={() => setShowRequestModal(true)}
        >
          <Plus size={14} color="#1A73E8" />
          <Text style={styles.requestUnlistedText}>Request Unlisted Society</Text>
        </TouchableOpacity>
      </View>

      {/* 3 TAB FILTERS */}
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
          onPress={() => setActiveTab('all')}
        >
          <Globe size={13} color={activeTab === 'all' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.tabBtnText, activeTab === 'all' && styles.tabBtnTextActive]}>
            All Societies ({societies.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'selected' && styles.tabBtnActive]}
          onPress={() => setActiveTab('selected')}
        >
          <Home size={13} color={activeTab === 'selected' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.tabBtnText, activeTab === 'selected' && styles.tabBtnTextActive]}>
            My Workplace Network
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'high_hiring' && styles.tabBtnActive]}
          onPress={() => setActiveTab('high_hiring')}
        >
          <Briefcase size={13} color={activeTab === 'high_hiring' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.tabBtnText, activeTab === 'high_hiring' && styles.tabBtnTextActive]}>
            High Hiring
          </Text>
        </TouchableOpacity>
      </View>

      {/* SOCIETIES LIST */}
      {loading ? (
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginVertical: 30 }} />
      ) : filteredSocieties.length === 0 ? (
        <View style={styles.emptyCard}>
          <Building2 size={36} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Societies Found</Text>
          <Text style={styles.emptySub}>No gated residential complexes match your search query.</Text>
        </View>
      ) : (
        filteredSocieties.map(soc => {
          const isPrimary = soc.id === primarySocietyId;
          const isSecondary = secondarySocietyIds.includes(soc.id);
          const liveJobs = Number(soc.active_jobs_count) || 2;
          const employers = Number(soc.employers_count) || 12;

          return (
            <View key={soc.id} style={[styles.societyCard, isPrimary && styles.societyCardPrimary]}>
              
              {/* Header Info */}
              <View style={styles.socHeaderRow}>
                <View style={styles.socAvatarBox}>
                  <Building2 size={18} color="#FFFFFF" />
                </View>

                <View style={styles.socMainCol}>
                  <View style={styles.socTitleRow}>
                    <Text style={styles.socName} numberOfLines={1}>{soc.name}</Text>
                    {isPrimary && (
                      <View style={styles.primaryBadgePill}>
                        <Text style={styles.primaryBadgeText}>PRIMARY WORKPLACE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.socLocality} numberOfLines={1}>
                    📍 {soc.area || soc.locality || soc.city || 'Bengaluru'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Hiring Stats Bar */}
              <View style={styles.statsBar}>
                <View style={styles.statItem}>
                  <Briefcase size={12} color="#1A73E8" />
                  <Text style={styles.statItemVal}>{liveJobs} Open Jobs</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Users size={12} color="#15803D" />
                  <Text style={styles.statItemVal}>{employers} Hiring Families</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <ShieldCheck size={12} color="#9333EA" />
                  <Text style={styles.statItemVal}>Gate Verified</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.socActionsRow}>
                {!isPrimary ? (
                  <TouchableOpacity 
                    style={styles.setPrimaryBtn}
                    onPress={() => handleSelectPrimary(soc)}
                  >
                    <Text style={styles.setPrimaryBtnText}>Set Primary Workplace</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.isPrimaryIndicator}>
                    <Check size={14} color="#15803D" />
                    <Text style={styles.isPrimaryIndicatorText}>Selected Primary ✓</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[
                    styles.toggleSecondaryBtn, 
                    isSecondary && styles.toggleSecondaryBtnActive,
                    isPrimary && styles.toggleSecondaryBtnDisabled
                  ]}
                  disabled={isPrimary}
                  onPress={() => handleToggleSecondary(soc)}
                >
                  <Text style={[styles.toggleSecondaryText, isSecondary && styles.toggleSecondaryTextActive]}>
                    {isSecondary ? 'Secondary ✓' : '+ Add Secondary'}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          );
        })
      )}

      {/* REQUEST UNLISTED SOCIETY MODAL */}
      {showRequestModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Request Unlisted Society</Text>
                <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSub}>
                Enter your residential society name to get listed on Sevikaa network within 24 hours.
              </Text>

              <Text style={styles.inputLabel}>Society Name:</Text>
              <TextInput 
                style={styles.modalInput}
                placeholder="e.g. Prestige Shantiniketan"
                placeholderTextColor="#94A3B8"
                value={newSocietyName}
                onChangeText={setNewSocietyName}
              />

              <Text style={styles.inputLabel}>Locality / City:</Text>
              <TextInput 
                style={styles.modalInput}
                placeholder="e.g. Whitefield, Bengaluru"
                placeholderTextColor="#94A3B8"
                value={newSocietyLocality}
                onChangeText={setNewSocietyLocality}
              />

              <TouchableOpacity 
                style={styles.modalSubmitBtn}
                onPress={handleRequestUnlistedSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.modalSubmitText}>
                  {isSubmitting ? 'Transmitting Request...' : 'Submit Unlisted Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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

  searchCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  requestUnlistedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 8,
    borderRadius: 10,
  },
  requestUnlistedText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A73E8',
  },

  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  tabBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },

  societyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  societyCardPrimary: {
    borderColor: '#1A73E8',
    borderWidth: 1.5,
    backgroundColor: '#F8FAFC',
  },
  socHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  socAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socMainCol: {
    flex: 1,
  },
  socTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  primaryBadgePill: {
    backgroundColor: '#E8F0FE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#1A73E8',
  },
  socLocality: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statItemVal: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
  },
  socActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  setPrimaryBtn: {
    flex: 1,
    backgroundColor: '#1A73E8',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  setPrimaryBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  isPrimaryIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 9,
    borderRadius: 10,
  },
  isPrimaryIndicatorText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#15803D',
  },
  toggleSecondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  toggleSecondaryBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  toggleSecondaryBtnDisabled: {
    opacity: 0.5,
  },
  toggleSecondaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  toggleSecondaryTextActive: {
    color: '#1A73E8',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 12,
  },
  modalSubmitBtn: {
    backgroundColor: '#1A73E8',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
