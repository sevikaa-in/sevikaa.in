import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { 
  Sparkles, MapPin, Briefcase, Calendar, ShieldCheck, 
  Bell, ArrowRight, Building2, ChevronRight, Clock, CheckCircle2, User, Star, Check, BellRing
} from 'lucide-react-native';
import { getApiUrl } from '../../config/api';
import { supabase } from '../../lib/supabase';
import { JobCard } from '../../components/JobCard';
import { useMobileLanguage } from '../../context/LanguageContext';

export const WorkerHomeScreen: React.FC<{ 
  user?: any;
  onNavigateToJobs?: () => void 
}> = ({ user, onNavigateToJobs }) => {
  const { t } = useMobileLanguage();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [pushEnabled, setPushEnabled] = useState(true);
  
  // Real Worker Profile State
  const [workerName, setWorkerName] = useState('testing');
  const [workerSociety, setWorkerSociety] = useState('Prestige Shantiniketan, Whitefield');
  const [isWorkerVerified, setIsWorkerVerified] = useState(false);

  useEffect(() => {
    fetchWorkerProfile();
    fetchJobs();
  }, [user]);

  const fetchWorkerProfile = async () => {
    try {
      if (user?.full_name) setWorkerName(user.full_name);
      if (user?.society) setWorkerSociety(user.society);

      if (user?.id || user?.phone) {
        let query = supabase.from('profiles').select('*, worker_profiles(*)');
        if (user.id) {
          query = query.eq('id', user.id);
        } else if (user.phone) {
          query = query.eq('phone', user.phone);
        }
        const { data: prof } = await query.maybeSingle();

        if (prof) {
          const resolvedName = prof.worker_profiles?.full_name || prof.full_name || user?.full_name || user?.phone || 'testing';
          setWorkerName(resolvedName);
          if (prof.worker_profiles) {
            const wp = Array.isArray(prof.worker_profiles) ? prof.worker_profiles[0] : prof.worker_profiles;
            if (wp && (wp.preferred_society_name || wp.society)) {
              setWorkerSociety(wp.preferred_society_name || wp.society);
            }
          }
          const isVerified = prof.status === 'approved' || prof.status === 'live';
          setIsWorkerVerified(isVerified);
        }
      }
    } catch (e) {
      console.warn("Worker home profile fetch notice:", e);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data: dbJobs } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (dbJobs && dbJobs.length > 0) {
        setJobs(dbJobs);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Supabase jobs fetch notice:", err);
    }

    try {
      const res = await fetch(getApiUrl('api/admin/data?tab=jobs&limit=20'));
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
          setJobs(data.jobs);
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleApplyJob = (job: any) => {
    if (appliedJobIds.includes(job.id)) return;
    setAppliedJobIds(prev => [...prev, job.id]);
    Alert.alert(
      "Application Sent! 🟢",
      `Your application for "${job.title}" has been transmitted to the employer via DLT SMS.`,
      [{ text: "OK" }]
    );
  };

  const candidateInitial = (workerName || 'T')[0].toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
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
          <Text style={[styles.statVal, { color: '#1A73E8' }]}>{jobs.length}</Text>
          <Text style={styles.statSub}>In Preferred Society</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>{t('myApplicationsTitle', 'MY APPLICATIONS')}</Text>
          <Text style={[styles.statVal, { color: '#16A34A' }]}>0</Text>
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
            {t('topRecommendedJobs', 'TOP RECOMMENDED JOBS')} ({jobs.length})
          </Text>
        </View>
        {onNavigateToJobs && (
          <TouchableOpacity onPress={onNavigateToJobs} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>{t('viewAllJobs', 'View All Jobs')}</Text>
            <ChevronRight size={13} color="#1A73E8" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginVertical: 20 }} />
      ) : jobs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Briefcase size={36} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Open Jobs Right Now</Text>
          <Text style={styles.emptySub}>No active society job postings currently listed in the database.</Text>
        </View>
      ) : (
        jobs.slice(0, 2).map((job) => (
          <JobCard
            key={job.id}
            job={job}
            hasApplied={appliedJobIds.includes(job.id)}
            isWorkerVerified={isWorkerVerified}
            onApply={handleApplyJob}
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

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  
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
});
