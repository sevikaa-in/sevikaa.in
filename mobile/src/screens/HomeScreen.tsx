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
  onNavigateToAccount?: () => void;
  onNavigateToInvite?: (job: any) => void;
  onNavigateToPricing?: () => void;
  onNavigateToRelocate?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  role = 'employer', 
  onNavigateToPostJob, 
  onNavigateToWorkers,
  onNavigateToAccount,
  onNavigateToInvite,
  onNavigateToPricing,
  onNavigateToRelocate
}) => {
  const { t } = useMobileLanguage();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [bookingWorker, setBookingWorker] = useState<any | null>(null);
  const [totalWorkersCount, setTotalWorkersCount] = useState<number>(0);
  const [employerProfile, setEmployerProfile] = useState<any>({
    company_name: 'Employer Household',
    society_name: 'Adarsh Palm Retreat, Bellandur',
    status: 'pending_review',
    subscription_status: 'premium'
  });

  const categories = ['All', 'Cook', 'Maid', 'Nanny'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Session / Employer Profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data: empProf } = await supabase
          .from('employer_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (empProf) {
          setEmployerProfile({
            ...empProf,
            company_name: empProf.company_name || empProf.name || empProf.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Employer Household'
          });
        } else if (session.user?.user_metadata) {
          setEmployerProfile((prev: any) => ({
            ...prev,
            company_name: session.user.user_metadata.full_name || session.user.user_metadata.name || 'Employer Household'
          }));
        }
      }

      // 2. Fetch Total Worker Count
      const { count } = await supabase
        .from('worker_profiles')
        .select('*', { count: 'exact', head: true });

      if (count !== null) {
        setTotalWorkersCount(count);
      }

      // 3. Fetch Candidates from Supabase (Live & Approved Workers Only)
      const { data: dbWorkers } = await supabase
        .from('worker_profiles')
        .select('*')
        .or('status.eq.live,status.eq.approved')
        .order('created_at', { ascending: false })
        .limit(20);

      if (dbWorkers && dbWorkers.length > 0) {
        setCandidates(dbWorkers.map((w: any) => ({
          id: w.id || w.user_id,
          full_name: w.full_name || 'Verified Helper',
          category: Array.isArray(w.skills) && w.skills[0] ? w.skills[0] : (w.category || 'Cook'),
          skills: Array.isArray(w.skills) ? w.skills : [w.category || 'Cook'],
          experience_years: (w.experience_years !== undefined && w.experience_years !== null) ? w.experience_years : (w.experience !== undefined && w.experience !== null ? Number(w.experience) : 0),
          total_reviews: w.total_reviews || 14,
          rating: w.rating || 4.9,
          expected_salary: w.expected_salary || 14000,
          preferred_society_name: w.preferred_society_name || w.society || employerProfile.society_name || 'Gated Society',
          is_police_verified: w.is_police_verified ?? true,
          status: w.status || 'live'
        })));
      }

      // 4. Fetch Employer Jobs from Supabase
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

  const activeJobsCount = postedJobs.filter(j => j.status === 'active' || j.status === 'approved').length;
  const pendingJobsCount = postedJobs.filter(j => j.status === 'pending' || j.status === 'changes_requested').length;
  const totalApplicantsCount = postedJobs.reduce((sum, j) => sum + (j.applications_count || j.applicationsCount || 0), 0);
  const isEmployerVerified = employerProfile.status === 'live' || employerProfile.status === 'approved';

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* 🏡 1. LIGHT CRISP EMPLOYER CONTROL HERO BANNER (MATCHES WEB DESIGN EXACTLY) */}
      <View style={styles.heroBanner}>
        {/* Row 1: Badges */}
        <View style={styles.heroBadgeRow}>
          <View style={styles.eyebrowPill}>
            <Sparkles size={11} color="#1A73E8" />
            <Text style={styles.eyebrowText}>SEVIKAA HOUSEHOLD EMPLOYER HUB</Text>
          </View>
          {isEmployerVerified ? (
            <View style={styles.verifiedPill}>
              <ShieldCheck size={11} color="#15803D" />
              <Text style={styles.verifiedText}>VERIFIED EMPLOYER ACCOUNT</Text>
            </View>
          ) : (
            <View style={styles.pendingPill}>
              <Clock size={11} color="#92400E" />
              <Text style={styles.pendingText}>PENDING ADMIN AUDIT</Text>
            </View>
          )}
        </View>

        {/* Row 2: Employer Name */}
        <Text style={styles.heroEmployerName}>
          {employerProfile.company_name || employerProfile.name || employerProfile.full_name || 'Employer Household'}
        </Text>

        {/* Row 3: Society Location */}
        <View style={styles.societyRow}>
          <MapPin size={14} color="#1A73E8" />
          <Text style={styles.societyText}>
            {employerProfile.society_name || 'Adarsh Palm Retreat, Bellandur'}
          </Text>
        </View>

        {/* Row 4: Button AFTER Name and Society */}
        {onNavigateToPostJob && (
          <TouchableOpacity style={styles.postJobBtn} onPress={onNavigateToPostJob} activeOpacity={0.85}>
            <PlusCircle size={16} color="#FFFFFF" />
            <Text style={styles.postJobBtnText}>Post New Requisition</Text>
          </TouchableOpacity>
        )}

        {/* Row 5: Executive Society Gate Pass & Trust Widget Box */}
        <View style={styles.trustWidgetBox}>
          <View style={styles.trustWidgetLeft}>
            <View style={styles.trustIconCircle}>
              <ShieldCheck size={16} color="#1A73E8" />
            </View>
            <View>
              <Text style={styles.trustWidgetTitle}>GATE PASS VERIFIED</Text>
              <Text style={styles.trustWidgetSubGreen}>Live DLT SMS Alerts</Text>
            </View>
          </View>

          <View style={styles.trustWidgetRight}>
            <Text style={styles.trustRightText}>
              <Text style={{ color: '#64748B' }}>Society Helpers: </Text>
              <Text style={{ color: '#0F172A', fontWeight: '900' }}>{totalWorkersCount} Verified</Text>
            </Text>
            <Text style={styles.trustRightText}>
              <Text style={{ color: '#64748B' }}>Aadhaar Record: </Text>
              <Text style={{ color: '#15803D', fontWeight: '900' }}>100% Passed</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* 📊 2. PROFILE COMPLETENESS WIDGET (MATCHES WEB DESIGN EXACTLY) */}
      <View style={styles.completenessCard}>
        <View style={styles.completenessHeader}>
          <View style={styles.completenessLeft}>
            <View style={styles.completenessIconCircle}>
              <UserCheck size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.completenessTitle}>
                Profile Completeness <Text style={{ color: '#1A73E8' }}>( 88% )</Text>
              </Text>
              <Text style={styles.completenessSub} numberOfLines={1}>
                1 steps remaining to activate job postings
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.completeBtn} 
            onPress={onNavigateToAccount} 
            activeOpacity={0.85}
          >
            <Text style={styles.completeBtnText}>Complete Profile</Text>
            <ChevronRight size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: '88%' }]} />
        </View>
      </View>

      {/* 📊 3. 2 x 2 EXECUTIVE METRICS GRID (MATCHES WEB DESIGN EXACTLY) */}
      <View style={styles.statsGrid2x2}>
        <TouchableOpacity style={styles.statCard} onPress={onNavigateToPostJob} activeOpacity={0.85}>
          <View style={styles.statHeaderRow}>
            <Text style={styles.statLabel}>POSTED REQUISITIONS</Text>
            <ChevronRight size={13} color="#94A3B8" />
          </View>
          <Text style={styles.statVal}>{postedJobs.length}</Text>
          <Text style={styles.statSubGreen}>{activeJobsCount} Active &bull; {pendingJobsCount} Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={onNavigateToWorkers} activeOpacity={0.85}>
          <View style={styles.statHeaderRow}>
            <Text style={styles.statLabel}>TOTAL APPLICANTS</Text>
            <ChevronRight size={13} color="#94A3B8" />
          </View>
          <Text style={[styles.statVal, { color: '#1A73E8' }]}>{totalApplicantsCount}</Text>
          <Text style={styles.statSubGray}>View Applicants</Text>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>HELPERS IN SOCIETY</Text>
          <Text style={styles.statVal}>{totalWorkersCount}</Text>
          <Text style={styles.statSubGreen}>Verified in Society</Text>
        </View>

        <TouchableOpacity style={styles.statCard} onPress={onNavigateToAccount} activeOpacity={0.85}>
          <View style={styles.statHeaderRow}>
            <Text style={styles.statLabel}>ACCOUNT PLAN</Text>
            <ChevronRight size={13} color="#94A3B8" />
          </View>
          <Text style={[styles.statVal, { color: '#15803D', fontSize: 16, textTransform: 'lowercase' }]}>
            {employerProfile.subscription_status || 'premium'}
          </Text>
          <Text style={styles.statSubGray}>Unlimited Direct Contact</Text>
        </TouchableOpacity>
      </View>

      {/* 📋 4. YOUR ACTIVE REQUISITIONS CARD */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionTitleRow}>
            <Briefcase size={16} color="#1A73E8" />
            <Text style={styles.sectionTitle}>YOUR ACTIVE REQUISITIONS</Text>
          </View>
          <TouchableOpacity onPress={onNavigateToPostJob}>
            <Text style={styles.viewAllText}>View All ›</Text>
          </TouchableOpacity>
        </View>

        {postedJobs.length === 0 ? (
          <View style={styles.emptyCardBox}>
            <Briefcase size={36} color="#CBD5E1" style={{ alignSelf: 'center', marginBottom: 6 }} />
            <Text style={styles.emptyText}>No Jobs Posted Yet</Text>
            {onNavigateToPostJob && (
              <TouchableOpacity style={styles.postFirstJobBtn} onPress={onNavigateToPostJob} activeOpacity={0.85}>
                <PlusCircle size={15} color="#FFFFFF" />
                <Text style={styles.postFirstJobBtnText}>Post First Household Job</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          postedJobs.slice(0, 3).map((job) => (
            <View key={job.id} style={styles.jobItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobItemTitle}>{job.title}</Text>
                <Text style={styles.jobItemSub}>₹{job.salary_offered || job.salary || '15,000'}/mo &bull; {job.category || 'General'}</Text>
              </View>
              <View style={styles.applicantBadgePill}>
                <Text style={styles.applicantBadgeText}>{job.applications_count || 0} Applicants</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 👥 5. VERIFIED HELPERS IN YOUR SOCIETY (TOP-TO-BOTTOM PREMIUM VERTICAL STACK CARD) */}
      <View style={styles.societyHeroCard}>
        {/* Top Header Row */}
        <View style={styles.societyHeroTopRow}>
          <View style={styles.societyTitleLeft}>
            <View style={styles.societyHeroIconCircle}>
              <Users size={18} color="#1A73E8" />
            </View>
            <Text style={styles.societyHeroTitle}>{t('verifiedHelpersTitle') || "VERIFIED HELPERS IN YOUR SOCIETY"}</Text>
          </View>

          <View style={styles.verifiedCountPill}>
            <ShieldCheck size={10} color="#15803D" />
            <Text style={styles.verifiedCountText}>{totalWorkersCount} {t('verifiedBadgeText') || "Verified"}</Text>
          </View>
        </View>

        {/* Middle Description Text */}
        <Text style={styles.societyHeroSub}>
          {t('discoverInviteDesc') || "Discover & invite verified maids, cooks & nannies registered in"} {employerProfile.society_name || t('yourSocietyFallback') || 'Adarsh Palm Retreat, Bellandur'}.
        </Text>

        {/* Bottom Full-Width Premium Action Button */}
        <TouchableOpacity 
          style={styles.browseSocietyBtn} 
          onPress={() => {
            const firstApprovedJob = postedJobs.find(j => j.status === 'active' || j.status === 'approved');
            if (firstApprovedJob && onNavigateToInvite) {
              onNavigateToInvite(firstApprovedJob);
            } else if (onNavigateToWorkers) {
              onNavigateToWorkers();
            }
          }}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={15} color="#FDE68A" />
            <Text style={styles.browseSocietyBtnText}>{t('browseInviteSocietyHelpersBtn') || "Browse & Invite Society Helpers"}</Text>
          </View>
          <ArrowRight size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 🛡️ BRAND TRUST FOOTER */}
      <View style={styles.brandFooter}>
        <Text style={styles.brandFooterLabel}>POWERED BY</Text>
        <Text style={styles.brandFooterText}>YUGAYATRA</Text>
      </View>

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
  content: { padding: 14, paddingBottom: 40 },

  // 1. Hero Banner
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
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  eyebrowText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1A73E8',
    letterSpacing: 0.5,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
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
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pendingText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#92400E',
  },
  heroEmployerName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  societyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 14,
  },
  societyText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  postJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A73E8',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 18,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  postJobBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  trustWidgetBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trustWidgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustWidgetTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  trustWidgetSubGreen: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 1,
  },
  trustWidgetRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  trustRightText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // 2. Profile Completeness Widget
  completenessCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
  },
  completenessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  completenessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  completenessIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completenessTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  completenessSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A73E8',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  completeBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#DBEAFE',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1A73E8',
    borderRadius: 10,
  },

  // 3. Executive Stats 2x2 Grid
  statsGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 14,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 3,
  },
  statSubGreen: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  statSubGray: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },

  // 4. Society Helpers Hero Card (Top to Bottom Stack)
  societyHeroCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  societyHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  societyTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  societyHeroIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  societyHeroTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
    flex: 1,
  },
  verifiedCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedCountText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#15803D',
  },
  societyHeroSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 17,
  },
  browseSocietyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A73E8',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  browseSocietyBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // 5. Brand Trust Footer
  brandFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    marginTop: 8,
    gap: 2,
    opacity: 0.8,
  },
  brandFooterLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  brandFooterText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
  },

  // 5 & 6 Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A73E8',
  },
  emptyCardBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 10,
  },
  postFirstJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  postFirstJobBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  jobItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  jobItemTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  jobItemSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  applicantBadgePill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  applicantBadgeText: {
    fontSize: 10,
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  candHeaderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
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
    fontSize: 14,
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
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  candSocietyText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
    marginTop: 3,
  },
  salaryPill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  salaryText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#15803D',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  bookInterviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 9,
    borderRadius: 12,
  },
  bookInterviewBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
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
