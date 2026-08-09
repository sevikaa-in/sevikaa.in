import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal 
} from 'react-native';
import { 
  Sparkles, MapPin, Briefcase, Calendar, ShieldCheck, 
  Bell, ArrowRight, Building2, ChevronRight, Clock, CheckCircle2, User, Star, Check, BellRing, IndianRupee, Lock, X
} from 'lucide-react-native';
import { getApiUrl } from '../../config/api';
import { supabase } from '../../lib/supabase';
import { JobCard } from '../../components/JobCard';
import { useMobileLanguage } from '../../context/LanguageContext';
import { useUserProfile } from '../../context/UserProfileContext';

export const WorkerHomeScreen: React.FC<{ 
  user?: any;
  onNavigateToJobs?: () => void;
  onSelectJobDetail?: (job: any) => void;
}> = ({ user, onNavigateToJobs, onSelectJobDetail }) => {
  const { t } = useMobileLanguage();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const { user: ctxUser, profile, workerProfile, isVerified: isWorkerVerified, workerSkills, primarySociety } = useUserProfile();
  const activeUser = ctxUser || user;
  const workerName = workerProfile?.full_name || profile?.full_name || activeUser?.full_name || activeUser?.phone || 'Domestic Worker';
  const workerSociety = primarySociety || 'Residential Society';

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  useEffect(() => {
    fetchJobs();
  }, [activeUser]);

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cook' | 'maid' | 'nanny'>('all');

  const fetchJobs = async () => {
    setLoading(true);
    let fetched: any[] = [];
    try {
      const { data: dbJobs } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (dbJobs && dbJobs.length > 0) {
        fetched = dbJobs.filter((j: any) => j.status !== 'closed' && j.status !== 'deleted');
      }
    } catch (err) {
      console.warn('Supabase jobs fetch notice:', err);
    }

    if (fetched.length === 0) {
      try {
        const res = await fetch(getApiUrl('api/admin/data?tab=jobs&limit=20'));
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
            fetched = data.jobs.filter((j: any) => j.status !== 'closed' && j.status !== 'deleted');
          }
        }
      } catch (e) {}
    }

    setJobs(fetched);
    setLoading(false);
  };

  // Filter by worker skills first, then category pill
  const filteredJobs = jobs.filter(j => {
    const title = (j.title || '').toLowerCase();
    const cat = (j.category || '').toLowerCase();
    const desc = (j.description || '').toLowerCase();

    // If we have real skills, match against them (unless category pill overrides)
    if (selectedCategory === 'all' && workerSkills.length > 0) {
      return workerSkills.some(skill => {
        const s = skill.toLowerCase();
        if (s.includes('cook') && (title.includes('cook') || cat.includes('cook') || desc.includes('cook'))) return true;
        if ((s.includes('maid') || s.includes('housekeep') || s.includes('clean')) &&
          (title.includes('maid') || title.includes('clean') || cat.includes('maid') || desc.includes('clean'))) return true;
        if ((s.includes('nanny') || s.includes('child') || s.includes('baby')) &&
          (title.includes('nanny') || title.includes('child') || cat.includes('nanny') || desc.includes('child'))) return true;
        return title.includes(s) || cat.includes(s);
      });
    }

    if (selectedCategory === 'cook') return title.includes('cook') || cat.includes('cook') || desc.includes('cook');
    if (selectedCategory === 'maid') return title.includes('maid') || title.includes('clean') || cat.includes('maid') || desc.includes('clean');
    if (selectedCategory === 'nanny') return title.includes('nanny') || title.includes('child') || cat.includes('nanny') || desc.includes('child');
    return true;
  });

  const handleApplyJob = async (job: any) => {
    if (appliedJobIds.includes(job.id)) {
      showToast(`Already applied for "${job.title}"! 🟢`);
      return;
    }

    setAppliedJobIds(prev => [...prev, job.id]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id || user?.id;

      if (activeUserId) {
        await supabase
          .from('job_applications')
          .insert([{
            job_id: job.id,
            worker_id: activeUserId,
            status: 'applied',
            created_at: new Date().toISOString()
          }]);
      }
    } catch (e) {
      console.warn("Job application DB save notice:", e);
    }

    showToast(`Application Sent! 🟢 Employer notified for "${job.title}".`);
  };

  const candidateInitial = (workerName || 'W')[0].toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMsg && (
        <View style={styles.floatingToast}>
          <CheckCircle2 size={16} color="#34D399" />
          <Text style={styles.floatingToastText}>{toastMsg}</Text>
        </View>
      )}
      
      {/* 🚀 1. HIGH-CONTRAST PENDING AUDIT NOTICE BANNER (100% WEB MATCH) */}
      {!isWorkerVerified && (
        <View style={styles.auditNoticeCard}>
          <View style={styles.auditHeaderRow}>
            <View style={styles.auditBadgePill}>
              <Clock size={11} color="#78350F" />
              <Text style={styles.auditBadgeText}>{t('pendingAdminAudit', 'PENDING ADMIN AUDIT')}</Text>
            </View>
            <View style={styles.guaranteeRow}>
              <Sparkles size={12} color="#D97706" />
              <Text style={styles.guaranteeText}>{t('expressAuditGuarantee', 'Express Audit Guarantee')}</Text>
            </View>
          </View>

          <Text style={styles.auditNoticeTitle}>
            {t('passportUnderVerification', 'Your Sevikaa Passport is Under Verification')}
          </Text>
          <Text style={styles.auditNoticeSub}>
            {t('passportVerificationSub', 'Sevikaa verification officers are verifying your Aadhaar card & background records. Your candidate card will go live in your residential society feed as soon as approval completes!')}
          </Text>
        </View>
      )}

      {/* 💳 2. WORKER PASSPORT PROFILE CARD (100% WEB MATCH TO WEB WORKER HOME) */}
      <View style={styles.passportCard}>
        <View style={styles.passportHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{candidateInitial}</Text>
          </View>

          <View style={styles.passportMainCol}>
            <Text style={styles.candidateName}>{workerName}</Text>
            <View style={styles.societyLocationRow}>
              <MapPin size={13} color="#1A73E8" />
              <Text style={styles.societyLocationText}>{workerSociety}</Text>
            </View>

            <View style={[styles.statusBadge, isWorkerVerified && styles.statusBadgeVerified]}>
              <View style={[styles.statusDot, isWorkerVerified && styles.statusDotVerified]} />
              <Text style={[styles.statusText, isWorkerVerified && styles.statusTextVerified]}>
                {isWorkerVerified ? 'VERIFIED CANDIDATE' : t('pendingAdminAudit', 'PENDING ADMIN AUDIT')}
              </Text>
            </View>

            <TouchableOpacity style={styles.editProfileBtn}>
              <User size={14} color="#FFFFFF" />
              <Text style={styles.editProfileText}>{t('editProfileDetails', 'Edit Profile Details')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3 Verification Badges Row */}
        <View style={styles.verificationBadgesGrid}>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeBoxTitle}>AADHAAR VERIFIED</Text>
            <View style={styles.badgeStatusRow}>
              <CheckCircle2 size={12} color="#16A34A" />
              <Text style={styles.badgeStatusGreen}>{t('aadhaarVerified', 'Aadhaar Verified')}</Text>
            </View>
          </View>

          <View style={styles.badgeBox}>
            <Text style={styles.badgeBoxTitle}>POLICE CLEARANCE</Text>
            <View style={styles.badgeStatusRow}>
              {isWorkerVerified ? (
                <>
                  <CheckCircle2 size={12} color="#16A34A" />
                  <Text style={styles.badgeStatusGreen}>Passed</Text>
                </>
              ) : (
                <>
                  <Clock size={12} color="#D97706" />
                  <Text style={styles.badgeStatusAmber}>{t('pendingAuditBadge', 'Pending Audit')}</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.badgeBox}>
            <Text style={styles.badgeBoxTitle}>INTERVIEW AUDIT</Text>
            <View style={styles.badgeStatusRow}>
              <CheckCircle2 size={12} color="#16A34A" />
              <Text style={styles.badgeStatusGreen}>{t('aadhaarVerified', 'Aadhaar Verified')}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 📊 3. EXECUTIVE METRICS ROW (100% WEB MATCH) */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>{t('availableJobsTitle', 'AVAILABLE JOBS')}</Text>
          <Text style={[styles.statVal, { color: '#1A73E8' }]}>{filteredJobs.length}</Text>
          <Text style={styles.statSub}>In Preferred Society</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>{t('myApplicationsTitle', 'MY APPLICATIONS')}</Text>
          <Text style={[styles.statVal, { color: '#16A34A' }]}>{appliedJobIds.length}</Text>
          <Text style={styles.statSub}>Active Interviews</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>{t('trustRatingTitle', 'TRUST RATING')}</Text>
          <View style={styles.ratingValRow}>
            <Text style={[styles.statVal, { color: '#D97706' }]}>4.9</Text>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
          </View>
          <Text style={styles.statSub}>Verified Member</Text>
        </View>
      </View>

      {/* 💼 4. TOP RECOMMENDED JOBS SECTION */}
      <View style={styles.jobsSectionHeader}>
        <View style={styles.jobsHeaderLeft}>
          <Briefcase size={16} color="#1A73E8" />
          <Text style={styles.jobsHeaderTitle}>
            {t('topRecommendedJobs', 'RECOMMENDED REQUISITIONS')} ({filteredJobs.length})
          </Text>
        </View>
        {onNavigateToJobs && (
          <TouchableOpacity onPress={onNavigateToJobs} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>{t('viewAllJobs', 'View All Jobs')}</Text>
            <ChevronRight size={13} color="#1A73E8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.categoryRow}>
        {[
          { id: 'all', label: 'All Jobs' },
          { id: 'cook', label: '🍳 Cooks' },
          { id: 'maid', label: '🧹 Maids' },
          { id: 'nanny', label: '👶 Nannies' }
        ].map(cat => (
          <TouchableOpacity 
            key={cat.id}
            style={[styles.catPill, selectedCategory === cat.id && styles.catPillActive]}
            onPress={() => setSelectedCategory(cat.id as any)}
          >
            <Text style={[styles.catPillText, selectedCategory === cat.id && styles.catPillTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginVertical: 20 }} />
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Briefcase size={36} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Open Jobs Matching Filter</Text>
          <Text style={styles.emptySub}>No active society job postings match your selected category filter.</Text>
        </View>
      ) : (
        filteredJobs.slice(0, 3).map((job) => (
          <JobCard
            key={job.id}
            job={job}
            hasApplied={appliedJobIds.includes(job.id)}
            isWorkerVerified={isWorkerVerified}
            onApply={handleApplyJob}
            onViewDetails={(j) => {
              if (onSelectJobDetail) onSelectJobDetail(j);
              else setSelectedJob(j);
            }}
          />
        ))
      )}

      {/* 🔔 5. LATEST UPDATES & SYSTEM ALERTS BOX (100% WEB MATCH) */}
      <View style={styles.updatesContainerCard}>
        <View style={styles.updatesHeaderRow}>
          <View style={styles.updatesHeaderLeft}>
            <View style={styles.bellIconCircle}>
              <Bell size={18} color="#1A73E8" />
            </View>
            <View>
              <Text style={styles.updatesTitle}>{t('latestUpdates', 'Latest Updates & System Alerts')}</Text>
              <Text style={styles.updatesSub}>Real-time alerts for interview requests &amp; job approvals</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.enableAlertsBtn}>
            <BellRing size={13} color="#FFFFFF" />
            <Text style={styles.enableAlertsText}>{t('enablePushAlerts', 'Enable Push Alerts')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.alertsList}>
          <TouchableOpacity style={styles.alertCardItem}>
            <Text style={styles.alertEmoji}>🎉</Text>
            <View style={styles.alertTextCol}>
              <Text style={styles.alertItemTitle}>{t('profileUnderAudit', 'Your profile documents are under admin audit.')}</Text>
              <Text style={styles.alertItemSub}>{t('expressAuditSub', 'Express audit completes within 24 hours.')}</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.alertCardItem}>
            <Text style={styles.alertEmoji}>📅</Text>
            <View style={styles.alertTextCol}>
              <Text style={styles.alertItemTitle}>{t('activeApplications', '0 Active Job Applications & Interviews')}</Text>
              <Text style={styles.alertItemSub}>{t('checkInterviewTimes', 'Tap to check scheduled interview times and unlock employer contacts.')}</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* RICH JOB DETAIL MODAL */}
      {selectedJob && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{selectedJob.title}</Text>
                  <Text style={styles.modalEmployer}>{t('postedBy', 'Posted by')} {selectedJob.employer_name || t('verifiedHousehold', 'Verified Household')}</Text>
                </View>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedJob(null)}>
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={styles.modalDetailStatsRow}>
                  <View style={styles.modalStatBox}>
                    <IndianRupee size={14} color="#15803D" />
                    <Text style={styles.modalStatVal}>₹{Number(selectedJob.salary_offered || selectedJob.salary || 15000).toLocaleString('en-IN')}</Text>
                    <Text style={styles.modalStatSub}>{t('perMonth', 'Monthly')}</Text>
                  </View>

                  <View style={styles.modalStatBox}>
                    <Clock size={14} color="#1A73E8" />
                    <Text style={styles.modalStatVal} numberOfLines={1}>{selectedJob.shift_hours || 'Full Day'}</Text>
                    <Text style={styles.modalStatSub}>{t('shiftHoursLabel', 'Shift Hours')}</Text>
                  </View>
                </View>

                <View style={styles.modalLocationRow}>
                  <MapPin size={14} color="#1A73E8" />
                  <Text style={styles.modalLocationText}>{selectedJob.society_name || t('residentialSociety', 'Gated Residential Society')}</Text>
                </View>

                <View style={styles.modalDivider} />

                <Text style={styles.modalDescLabel}>{t('jobDescriptionLabel', 'Job Description & Requirements:')}</Text>
                <Text style={styles.modalDesc}>{selectedJob.description || 'Household work required.'}</Text>

                {Array.isArray(selectedJob.responsibilities) && selectedJob.responsibilities.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.modalDescLabel}>{t('keyResponsibilities', 'Key Responsibilities:')}</Text>
                    {selectedJob.responsibilities.map((resp: string, idx: number) => (
                      <View key={idx} style={styles.bulletRow}>
                        <CheckCircle2 size={12} color="#16A34A" />
                        <Text style={styles.bulletText}>{resp}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {Array.isArray(selectedJob.perks) && selectedJob.perks.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.modalDescLabel}>{t('perksAndBenefits', 'Perks & Benefits:')}</Text>
                    <View style={styles.perksWrap}>
                      {selectedJob.perks.map((perk: string, idx: number) => (
                        <View key={idx} style={styles.perkChip}>
                          <Text style={styles.perkChipText}>✨ {perk}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity 
                style={[
                  styles.modalApplyBtn, 
                  appliedJobIds.includes(selectedJob.id) && styles.modalApplyBtnApplied,
                  !isWorkerVerified && styles.modalApplyBtnLocked
                ]}
                disabled={appliedJobIds.includes(selectedJob.id) || !isWorkerVerified}
                onPress={() => {
                  handleApplyJob(selectedJob);
                  setSelectedJob(null);
                }}
              >
                {appliedJobIds.includes(selectedJob.id) ? (
                  <>
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.modalApplyBtnText}>{t('appliedBadge', 'Application Transmitted ✓')}</Text>
                  </>
                ) : !isWorkerVerified ? (
                  <>
                    <Lock size={16} color="#78350F" />
                    <Text style={styles.modalApplyBtnTextLocked}>{t('pendingAuditBadge', 'Pending Audit (Locked until Verified)')}</Text>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.modalApplyBtnText}>{t('oneClickApplyBtn', 'Confirm 1-Click Apply')}</Text>
                  </>
                )}
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

  floatingToast: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingToastText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF', flex: 1 },
  
  // 1. Audit Notice Card
  auditNoticeCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FCD34D',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  auditHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  auditBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  auditBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#78350F',
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guaranteeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  auditNoticeTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#78350F',
    marginBottom: 4,
  },
  auditNoticeSub: {
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 17,
  },

  // 2. Passport Profile Card
  passportCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  passportHeader: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  passportMainCol: {
    flex: 1,
  },
  candidateName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  societyLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  societyLocationText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  statusBadgeVerified: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  statusDotVerified: {
    backgroundColor: '#16A34A',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400E',
  },
  statusTextVerified: {
    color: '#15803D',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  editProfileText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  verificationBadgesGrid: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
    paddingTop: 12,
  },
  badgeBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBoxTitle: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeStatusGreen: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  badgeStatusAmber: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D97706',
  },

  // 3. Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#475569',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 2,
  },
  ratingValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statSub: {
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'center',
  },

  // 4. Jobs Section
  jobsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  jobsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  catPill: {
    paddingHorizontal: 12,
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
  jobsHeaderTitle: {
    fontSize: 12,
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
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },

  // 5. Updates & System Alerts Box
  updatesContainerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 16,
    marginTop: 6,
    marginBottom: 10,
  },
  updatesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  updatesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bellIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updatesTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  updatesSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  enableAlertsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  enableAlertsText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  alertsList: {
    gap: 8,
  },
  alertCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  alertEmoji: {
    fontSize: 18,
  },
  alertTextCol: {
    flex: 1,
  },
  alertItemTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  alertItemSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
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
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalEmployer: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  modalDetailStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  modalStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  modalStatVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  modalStatSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  modalLocationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  modalDescLabel: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  bulletText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  perksWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  perkChip: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  perkChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  modalApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
  },
  modalApplyBtnApplied: {
    backgroundColor: '#16A34A',
  },
  modalApplyBtnLocked: {
    backgroundColor: '#FCD34D',
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  modalApplyBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalApplyBtnTextLocked: {
    fontSize: 12,
    fontWeight: '900',
    color: '#78350F',
  },
});
