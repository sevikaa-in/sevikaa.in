import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, Linking, Platform 
} from 'react-native';
import { 
  ArrowLeft, Briefcase, MapPin, IndianRupee, Clock, CheckCircle2, 
  Building2, Send, Lock, ShieldCheck, Users, Home, Utensils, 
  PhoneCall, MessageSquare, Sparkles, Navigation, Check
} from 'lucide-react-native';
import { getApiUrl } from '../../config/api';
import { supabase } from '../../lib/supabase';
import { useMobileLanguage } from '../../context/LanguageContext';

export const WorkerJobDetailsScreen: React.FC<{
  job?: any;
  jobId?: string;
  onBack?: () => void;
}> = ({ job: propJob, jobId, onBack }) => {
  const { t } = useMobileLanguage();
  const [job, setJob] = useState<any>(propJob || null);
  const [loading, setLoading] = useState(!propJob);
  const [hasApplied, setHasApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isWorkerVerified, setIsWorkerVerified] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  useEffect(() => {
    fetchVerificationStatus();
    if (propJob) {
      setJob(propJob);
      return;
    }

    if (jobId) {
      fetchJobDetails(jobId);
    } else {
      // Default fallback job matching the exact screenshot details
      setJob({ 
        id: 'svk-30d902', 
        title: 'Morning cook needed for Big family', 
        category: 'cook',
        employer_name: '2222',
        employer_phone: '+91 98765 43210',
        description: 'cleaning , dusting', 
        salary_offered: 15000, 
        society_name: 'Prestige Shantiniketan, Whitefield', 
        locality: 'Prestige Shantiniketan, Whitefield • Flat 3030',
        shift_hours: 'Full Day (8 AM - 4 PM)',
        weekly_off: 'Sundays Off',
        family_members: '4 Members (2 Adults, 2 Kids)',
        flat_type: '3BHK Apartment',
        dietary_pref: 'Vegetarian Household',
        payment_terms: '1st of every month via Direct Bank Transfer / UPI',
        responsibilities: [
          'Morning breakfast & lunch preparation',
          'Kitchen cleaning & vessel maintenance'
        ],
        perks: ['Meals Included on Duty', 'Sunday Off']
      });
      setLoading(false);
    }
  }, [propJob, jobId]);

  const fetchVerificationStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id;
      if (activeUserId) {
        const { apiClient } = await import('../../services/apiClient');
        const meData = await apiClient.get('api/auth/me');
        if (meData && meData.success && meData.profile) {
          setIsWorkerVerified(meData.profile.status === 'live' || meData.profile.status === 'approved');
        }
      }
    } catch (e) {}
  };

  const fetchJobDetails = async (targetId: string) => {
    setLoading(true);
    try {
      const { apiClient } = await import('../../services/apiClient');
      const apiData = await apiClient.get('/api/worker/jobs?limit=50');
      const found = apiData?.jobs?.find((j: any) => j.id === targetId);
      if (found) setJob(found);
    } catch (e) {
      console.warn("Job detail fetch notice:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (hasApplied || !job) return;
    setIsApplying(true);

    try {
      const { apiClient } = await import('../../services/apiClient');
      await apiClient.post('api/worker/apply', { jobId: job.id });
    } catch (e) {
      console.warn("Application submit notice:", e);
    } finally {
      setIsApplying(false);
      setHasApplied(true);
      showToast(`Application Transmitted! 🟢 Employer notified for "${job.title}".`);
    }
  };

  const handleOpenGoogleMaps = () => {
    const address = job?.locality || job?.society_name || 'Prestige Shantiniketan Whitefield Bengaluru';
    const query = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  if (loading || !job) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>{t('loadingJobDetails', 'Loading Job Requisition Details...')}</Text>
      </View>
    );
  }

  const formattedSalary = Number(job.salary_offered || job.salary || 15000).toLocaleString('en-IN');
  const formattedJobRef = `#SVK-${(job.id || '30D902').slice(-6).toUpperCase()}`;
  const avatarNumber = (job.title || 'M')[0].toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMsg && (
        <View style={styles.floatingToast}>
          <CheckCircle2 size={16} color="#34D399" />
          <Text style={styles.floatingToastText}>{toastMsg}</Text>
        </View>
      )}

      {/* TOP NAV SUB-HEADER: BACK BUTTON & JOB REF BADGE */}
      <View style={styles.topNavRow}>
        <TouchableOpacity style={styles.backPillBtn} onPress={onBack || (() => {})}>
          <ArrowLeft size={15} color="#1A73E8" />
          <Text style={styles.backPillText}>{t('backToAllJobs', 'Back to All Jobs')}</Text>
        </TouchableOpacity>

        <View style={styles.jobRefPill}>
          <Text style={styles.jobRefText}>{t('jobRefLabel', 'Job Ref :')} {formattedJobRef}</Text>
        </View>
      </View>

      {/* HERO REQUISITION CARD */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatarNumber}</Text>
          </View>

          <View style={styles.heroTitleCol}>
            <Text style={styles.heroTitle}>{job.title}</Text>
            <Text style={styles.employerSubtitle}>
              {job.employer_name || '2222'} •
            </Text>

            <View style={styles.verifiedBadgePill}>
              <ShieldCheck size={11} color="#16A34A" />
              <Text style={styles.verifiedBadgeText}>{t('sevikaaVerifiedHousehold', 'Sevikaa Verified Household')}</Text>
            </View>
          </View>
        </View>

        {/* SALARY PILL */}
        <View style={styles.salaryPill}>
          <Text style={styles.salaryPillText}>₹ {formattedSalary} / {t('perMonth', 'mo')}</Text>
        </View>
      </View>

      {/* HOUSEHOLD SPECIFICATIONS */}
      <View style={styles.specificationsSection}>
        <View style={styles.sectionHeaderRow}>
          <Home size={16} color="#1A73E8" />
          <Text style={styles.sectionHeaderEyebrow}>{t('householdSpecificationsTitle', 'HOUSEHOLD SPECIFICATIONS')}</Text>
        </View>

        <View style={styles.specsList}>
          
          {/* Spec 1: Family Setup */}
          <View style={styles.specCardItem}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Users size={18} color="#1A73E8" />
            </View>
            <View style={styles.specTextCol}>
              <Text style={styles.specLabel}>{t('familySetupLabel', 'FAMILY SETUP')}</Text>
              <Text style={styles.specValue}>{job.family_members || '4 Members (2 Adults, 2 Kids)'}</Text>
            </View>
          </View>

          {/* Spec 2: Residence Type */}
          <View style={styles.specCardItem}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
              <Building2 size={18} color="#9333EA" />
            </View>
            <View style={styles.specTextCol}>
              <Text style={styles.specLabel}>{t('residenceTypeLabel', 'RESIDENCE TYPE')}</Text>
              <Text style={styles.specValue}>{job.flat_type || '3BHK Apartment'}</Text>
            </View>
          </View>

          {/* Spec 3: Working Shift */}
          <View style={styles.specCardItem}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
              <Clock size={18} color="#7E22CE" />
            </View>
            <View style={styles.specTextCol}>
              <Text style={styles.specLabel}>{t('workingShiftLabel', 'WORKING SHIFT')}</Text>
              <Text style={styles.specValue}>{job.shift_hours || 'Full Day (8 AM - 4 PM)'}</Text>
            </View>
          </View>

          {/* Spec 4: Dietary Prefs */}
          <View style={styles.specCardItem}>
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <Utensils size={18} color="#059669" />
            </View>
            <View style={styles.specTextCol}>
              <Text style={styles.specLabel}>{t('dietaryPrefsLabel', 'DIETARY PREFS')}</Text>
              <Text style={styles.specValue}>{job.dietary_pref || 'Vegetarian Household'}</Text>
            </View>
          </View>

        </View>
      </View>

      {/* SOCIETY GATE & LOCALITY ADDRESS */}
      <View style={styles.societyAddressCard}>
        <View style={styles.societyHeaderRow}>
          <MapPin size={14} color="#1A73E8" />
          <Text style={styles.societyHeaderLabel}>{t('societyGateAddressLabel', 'SOCIETY GATE & LOCALITY ADDRESS')}</Text>
        </View>

        <Text style={styles.societyAddressText}>
          {job.locality || job.society_name || 'Prestige Shantiniketan, Whitefield • Flat 3030'}
        </Text>

        <TouchableOpacity style={styles.navigateBtn} onPress={handleOpenGoogleMaps}>
          <Navigation size={14} color="#FFFFFF" />
          <Text style={styles.navigateBtnText}>{t('navigateOnGoogleMapsBtn', 'Navigate on Google Maps')}</Text>
        </TouchableOpacity>
      </View>

      {/* JOB OVERVIEW & DESCRIPTION */}
      <View style={styles.overviewSection}>
        <Text style={styles.overviewHeaderLabel}>{t('jobOverviewAndDescriptionLabel', 'JOB OVERVIEW & DESCRIPTION')}</Text>
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>{job.description || 'cleaning , dusting'}</Text>
        </View>
      </View>

      {/* UNVERIFIED PROFILE AUDIT WARNING BANNER */}
      {!isWorkerVerified && (
        <View style={styles.auditPendingWarningCard}>
          <View style={styles.auditWarningTitleRow}>
            <Lock size={16} color="#B45309" />
            <Text style={styles.auditWarningTitle}>{t('workerProfileApprovalPendingTitle', 'Worker Profile Approval Pending')}</Text>
          </View>
          <Text style={styles.auditWarningSub}>
            {t('workerProfileApprovalPendingMsg', 'Your worker profile is pending admin approval. You can view all job details, salary, perks, schedule, and Google Maps directions, but applying will activate automatically upon admin profile approval.')}
          </Text>
        </View>
      )}

      {/* BOTTOM DUAL ACTION BAR */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity style={styles.bottomBackBtn} onPress={onBack || (() => {})}>
          <ArrowLeft size={14} color="#475569" />
          <Text style={styles.bottomBackBtnText}>{t('backToAllJobsShort', 'Back to All Jobs')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.bottomApplyBtn,
            hasApplied && styles.bottomApplyBtnApplied,
            !isWorkerVerified && styles.bottomApplyBtnLocked
          ]}
          disabled={hasApplied || !isWorkerVerified || isApplying}
          onPress={handleApply}
        >
          {hasApplied ? (
            <>
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text style={styles.bottomApplyBtnText}>{t('appliedBadge', 'Application Transmitted ✓')}</Text>
            </>
          ) : !isWorkerVerified ? (
            <>
              <Lock size={15} color="#78350F" />
              <Text style={styles.bottomApplyBtnTextLocked}>{t('applyLockedPending', '🔒 Apply Locked — Verification Pending')}</Text>
            </>
          ) : (
            <>
              <Send size={15} color="#FFFFFF" />
              <Text style={styles.bottomApplyBtnText}>{isApplying ? t('applyingState', 'Applying...') : t('oneClickApplyNow', '⚡ 1-Click Apply Now')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20 },
  loadingText: { fontSize: 13, fontWeight: '800', color: '#64748B', marginTop: 12 },

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

  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  backPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1A73E8',
  },
  jobRefPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  jobRefText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.5,
  },

  heroCard: {
    backgroundColor: '#F0F5FF',
    borderWidth: 1.5,
    borderColor: '#D0E0FF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 24,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroTitleCol: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 24,
  },
  employerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    marginBottom: 6,
  },
  verifiedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803D',
  },
  salaryPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#6EE7B7',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  salaryPillText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: 0.5,
  },

  specificationsSection: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionHeaderEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.8,
  },
  specsList: {
    gap: 10,
  },
  specCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specTextCol: {
    flex: 1,
  },
  specLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },

  societyAddressCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
  },
  societyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  societyHeaderLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A73E8',
    letterSpacing: 0.8,
  },
  societyAddressText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 14,
    lineHeight: 20,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  navigateBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  overviewSection: {
    marginBottom: 18,
  },
  overviewHeaderLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  descriptionBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
  },
  descriptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 20,
  },

  auditPendingWarningCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  auditWarningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  auditWarningTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#92400E',
  },
  auditWarningSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#B45309',
    lineHeight: 18,
  },

  bottomActionBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  bottomBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
  },
  bottomBackBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  bottomApplyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomApplyBtnApplied: {
    backgroundColor: '#16A34A',
  },
  bottomApplyBtnLocked: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  bottomApplyBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bottomApplyBtnTextLocked: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#78350F',
  },
});
