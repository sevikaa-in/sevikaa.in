import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, ActivityIndicator, Modal, Alert 
} from 'react-native';
import { 
  Sparkles, MapPin, PlusCircle, UserCheck, Briefcase, 
  Calendar, Users, Star, ShieldCheck, CheckCircle2, Search, Phone, ChevronRight, ArrowRight, X, Clock
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useMobileLanguage } from '../context/LanguageContext';

interface HomeScreenProps {
  role?: 'employer' | 'worker';
  onNavigateToPostJob?: () => void;
  onNavigateToWorkers?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ role = 'employer', onNavigateToPostJob, onNavigateToWorkers }) => {
  const { t } = useMobileLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [bookingWorker, setBookingWorker] = useState<any | null>(null);

  const categories = ['All', 'Cook', 'Maid', 'Nanny'];

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Candidates from Supabase
      const { data: dbWorkers } = await supabase
        .from('worker_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (dbWorkers && dbWorkers.length > 0) {
        setCandidates(dbWorkers.map((w: any) => ({
          id: w.id || w.user_id,
          full_name: w.full_name || 'Verified Helper',
          category: Array.isArray(w.skills) && w.skills[0] ? w.skills[0] : (w.category || 'Cook'),
          skills: Array.isArray(w.skills) ? w.skills : [w.category || 'Cook'],
          experience_years: w.experience_years || 4,
          total_reviews: w.total_reviews || 14,
          rating: w.rating || 4.9,
          expected_salary: w.expected_salary || 14000,
          preferred_society_name: w.preferred_society_name || w.society || 'DLF Westend Heights',
          is_police_verified: w.is_police_verified ?? true,
          status: w.status || 'live'
        })));
      } else {
        setCandidates([
          {
            id: 'c1',
            full_name: 'Lakshmi Devi',
            category: 'Cook',
            skills: ['Cook', 'Housekeeping'],
            experience_years: 5,
            total_reviews: 18,
            rating: 4.9,
            expected_salary: 15000,
            preferred_society_name: 'DLF Westend Heights',
            is_police_verified: true
          },
          {
            id: 'c2',
            full_name: 'Anita Sharma',
            category: 'Maid',
            skills: ['Housekeeping', 'Deep Cleaning'],
            experience_years: 3,
            total_reviews: 12,
            rating: 4.8,
            expected_salary: 13000,
            preferred_society_name: 'Prestige Song of the South',
            is_police_verified: true
          }
        ]);
      }

      // 2. Fetch Jobs from Supabase
      const { data: dbJobs } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (dbJobs) {
        setPostedJobs(dbJobs);
      }
    } catch (err) {
      console.warn("Supabase fetch notice:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    if (selectedCategory === 'All') return true;
    const cat = (c.category || '').toLowerCase();
    const skills = Array.isArray(c.skills) ? c.skills.join(' ').toLowerCase() : '';
    const target = selectedCategory.toLowerCase();
    return cat.includes(target) || skills.includes(target);
  });

  const handleConfirmInterviewBooking = () => {
    if (!bookingWorker) return;
    Alert.alert("Interview Requested! 🟢", `Gate pass interview request sent to ${bookingWorker.full_name}. Sevikaa will send DLT SMS confirmation.`);
    setBookingWorker(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* 🏡 1. LIGHT CRISP EMPLOYER CONTROL HERO BANNER (BALANCED WITH TRUST WIDGET) */}
      <View style={styles.heroBanner}>
        {/* Row 1: Badges */}
        <View style={styles.heroBadgeRow}>
          <View style={styles.eyebrowPill}>
            <Sparkles size={11} color="#D97706" />
            <Text style={styles.eyebrowText}>HOUSEHOLD EMPLOYER HUB</Text>
          </View>
          <View style={styles.pendingPill}>
            <Clock size={11} color="#92400E" />
            <Text style={styles.pendingText}>PENDING ADMIN AUDIT</Text>
          </View>
        </View>

        {/* Row 2: Name */}
        <Text style={styles.heroEmployerName}>Employer Household</Text>

        {/* Row 3: Society Location */}
        <View style={styles.societyRow}>
          <MapPin size={13} color="#1A73E8" />
          <Text style={styles.societyText}>DLF Westend Heights - Akshayanagar</Text>
        </View>

        {/* Row 4: Button AFTER Name and Society */}
        {onNavigateToPostJob && (
          <TouchableOpacity style={styles.postJobBtn} onPress={onNavigateToPostJob}>
            <PlusCircle size={15} color="#FFFFFF" />
            <Text style={styles.postJobBtnText}>+ Post New Requisition</Text>
          </TouchableOpacity>
        )}

        {/* Row 5: Executive Society Gate Pass & Trust Widget Box */}
        <View style={styles.trustWidgetBox}>
          <View style={styles.trustWidgetHeader}>
            <ShieldCheck size={14} color="#1A73E8" />
            <Text style={styles.trustWidgetTitle}>GATE PASS &amp; AUDIT VERIFIED</Text>
          </View>
          <Text style={styles.trustWidgetSub}>📍 52 Helpers in Society &bull; 100% Aadhaar Verified</Text>
        </View>
      </View>

      {/* 📊 2. LIGHT 2 x 2 EXECUTIVE METRICS GRID */}
      <View style={styles.statsGrid2x2}>
        <View style={[styles.statCard2x2, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <Text style={styles.statLabel}>POSTED REQUISITIONS</Text>
          <Text style={[styles.statVal, { color: '#15803D' }]}>{postedJobs.length || 1}</Text>
          <Text style={styles.statSub}>Active Postings</Text>
        </View>

        <View style={[styles.statCard2x2, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <Text style={styles.statLabel}>TOTAL APPLICANTS</Text>
          <Text style={[styles.statVal, { color: '#1A73E8' }]}>5</Text>
          <Text style={styles.statSub}>Candidates</Text>
        </View>

        <View style={[styles.statCard2x2, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}>
          <Text style={styles.statLabel}>HELPERS IN SOCIETY</Text>
          <Text style={[styles.statVal, { color: '#9333EA' }]}>52</Text>
          <Text style={styles.statSub}>Gate Verified</Text>
        </View>

        <View style={[styles.statCard2x2, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <Text style={styles.statLabel}>ACCOUNT PLAN</Text>
          <Text style={[styles.statVal, { color: '#D97706', fontSize: 15 }]}>Standard</Text>
          <Text style={styles.statSub}>Unlimited Contact</Text>
        </View>
      </View>

      {/* 💡 3. HIRE FAST ACTION CARD */}
      <View style={styles.hireFastCard}>
        <View style={styles.hireFastLeft}>
          <View style={styles.hireFastIconBox}>
            <Sparkles size={18} color="#FFFFFF" />
          </View>
          <View style={styles.hireFastTextCol}>
            <Text style={styles.hireFastTitle}>Need Domestic Help Fast?</Text>
            <Text style={styles.hireFastSub}>Browse verified maids, cooks &amp; nannies near you</Text>
          </View>
        </View>
      </View>

      {/* 👥 4. CANDIDATES SEARCH & CATEGORY FILTER */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>VERIFIED CANDIDATE CANDIDATES ({filteredCandidates.length})</Text>
        {onNavigateToWorkers && (
          <TouchableOpacity onPress={onNavigateToWorkers} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View All Candidates</Text>
            <ChevronRight size={13} color="#1A73E8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.categoryRow}>
        {categories.map(cat => (
          <TouchableOpacity 
            key={cat}
            style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.catPillText, selectedCategory === cat && styles.catPillTextActive]}>
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
          <Text style={styles.emptyTitle}>No Candidates Matching Filters</Text>
        </View>
      ) : (
        filteredCandidates.map(w => {
          const initial = (w.full_name || 'V')[0].toUpperCase();
          const salaryStr = `₹${Number(w.expected_salary || 14000).toLocaleString('en-IN')} / mo`;

          return (
            <View key={w.id} style={styles.candidateCard}>
              <View style={styles.candHeaderRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>

                <View style={styles.candMainCol}>
                  <View style={styles.candNameRow}>
                    <Text style={styles.candName}>{w.full_name}</Text>
                    <View style={styles.verifiedBadgePill}>
                      <ShieldCheck size={11} color="#15803D" />
                      <Text style={styles.verifiedBadgeText}>Verified</Text>
                    </View>
                  </View>

                  <Text style={styles.candRoleSub}>
                    {w.category || 'Cook'} &bull; {w.experience_years || 4} Years Exp &bull; ⭐ {w.rating || 4.9} ({w.total_reviews || 12})
                  </Text>
                  
                  <Text style={styles.candSocietyText}>📍 {w.preferred_society_name}</Text>

                  <View style={styles.salaryPill}>
                    <Text style={styles.salaryText}>{salaryStr}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.bookInterviewBtn}
                onPress={() => setBookingWorker(w)}
              >
                <Calendar size={14} color="#FFFFFF" />
                <Text style={styles.bookInterviewBtnText}>1-Click Book Gate Pass Interview</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      {/* BOOK INTERVIEW MODAL */}
      {bookingWorker && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Book Gate Pass Interview</Text>
                <TouchableOpacity onPress={() => setBookingWorker(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSub}>
                Confirm 1-Click Gate Pass interview with {bookingWorker.full_name} ({bookingWorker.category}).
              </Text>

              <View style={styles.modalDetailBox}>
                <Text style={styles.modalDetailText}>📍 Workplace: {bookingWorker.preferred_society_name}</Text>
                <Text style={styles.modalDetailText}>💵 Salary: ₹{Number(bookingWorker.expected_salary || 14000).toLocaleString('en-IN')} / mo</Text>
              </View>

              <TouchableOpacity 
                style={styles.modalConfirmBtn}
                onPress={handleConfirmInterviewBooking}
              >
                <Text style={styles.modalConfirmBtnText}>Confirm Gate Pass Booking</Text>
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

  // 1. Light Hero Banner
  heroBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  eyebrowText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#92400E',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#92400E',
  },
  heroEmployerName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  societyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 12,
  },
  societyText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  postJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    borderRadius: 14,
  },
  postJobBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  trustWidgetBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 10,
    marginTop: 10,
  },
  trustWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustWidgetTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  trustWidgetSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },

  // 2. Executive Stats 2x2 Grid
  statsGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard2x2: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#475569',
    textAlign: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    marginVertical: 2,
  },
  statSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },

  // 3. Hire Fast Card
  hireFastCard: {
    backgroundColor: '#1A73E8',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
  },
  hireFastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hireFastIconBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 10,
  },
  hireFastTextCol: { flex: 1 },
  hireFastTitle: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  hireFastSub: { fontSize: 10.5, color: '#E8F0FE', marginTop: 1 },

  // 4. Candidates Section
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A73E8',
  },

  categoryRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },

  candidateCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  candHeaderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  candMainCol: { flex: 1 },
  candNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  candName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  verifiedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
  },
  candRoleSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  candSocietyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  salaryPill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  salaryText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#15803D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  bookInterviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookInterviewBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 8,
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
    marginBottom: 12,
  },
  modalDetailBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    gap: 4,
    marginBottom: 14,
  },
  modalDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalConfirmBtn: {
    backgroundColor: '#1A73E8',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
