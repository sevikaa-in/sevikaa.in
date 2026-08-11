import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Modal, Alert 
} from 'react-native';
import { 
  Briefcase, PlusCircle, Clock, CheckCircle2, ShieldCheck, ShieldAlert,
  Edit3, Eye, Trash2, X, Save, Sparkles, MapPin, IndianRupee, Users, Lock, ChevronRight
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { getApiUrl } from '../../config/api';
import { useMobileLanguage } from '../../context/LanguageContext';
import { useUserProfile } from '../../context/UserProfileContext';

export const EmployerJobsScreen: React.FC<{ 
  user?: any;
  onNavigateToPostJob?: () => void;
  onNavigateToInvite?: (job: any) => void;
  onNavigateToWorkers?: () => void;
}> = ({ user, onNavigateToPostJob, onNavigateToInvite, onNavigateToWorkers }) => {
  const { t } = useMobileLanguage();
  const { profile, employerProfile } = useUserProfile();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inboundAppsCount, setInboundAppsCount] = useState<number>(0);

  // Edit Modal State
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editSociety, setEditSociety] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id || user?.id;

      if (activeUserId) {
        // Query ONLY jobs posted by this specific employer
        const { data: dbJobs, error: fetchErr } = await supabase
          .from('jobs')
          .select('*')
          .or(`employer_id.eq.${activeUserId},created_by.eq.${activeUserId},user_id.eq.${activeUserId}`)
          .order('created_at', { ascending: false });

        if (!fetchErr && dbJobs && dbJobs.length > 0) {
          setJobs(dbJobs);

          // Count inbound applications for these jobs
          const jobIds = dbJobs.map(j => j.id);
          if (jobIds.length > 0) {
            const { count } = await supabase
              .from('job_applications')
              .select('*', { count: 'exact', head: true })
              .in('job_id', jobIds);
            setInboundAppsCount(count || 0);
          } else {
            setInboundAppsCount(0);
          }

          setLoading(false);
          return;
        }
      }

      const { apiClient } = await import('../../services/apiClient');
      const data = await apiClient.get('api/employer/jobs?limit=50');
      if (data && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
    } catch (e) {
      console.warn("Employer jobs fetch notice:", e);
    }

    setLoading(false);
  };

  const liveJobs = jobs.filter(j => j.status === 'active' || j.status === 'approved' || j.status === 'live');
  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'under_review' || j.status === 'draft' || j.status === 'changes_requested');

  const filteredJobs = jobs.filter(j => {
    if (activeTab === 'active') return j.status === 'active' || j.status === 'approved' || j.status === 'live';
    if (activeTab === 'pending') return j.status === 'pending' || j.status === 'under_review' || j.status === 'draft' || j.status === 'changes_requested';
    return true;
  });

  const societyDisplayName = employerProfile?.society_name || profile?.society || 'Adarsh Palm Retreat, Bellandur';

  const handleOpenEdit = (job: any) => {
    const isApproved = job.status === 'active' || job.status === 'approved' || job.status === 'live';
    if (isApproved) {
      Alert.alert(
        "Requisition Approved & Live 🔒",
        "This job requisition has already been audited & approved by Sevikaa Admin. Salary & core requirements are locked once live to protect candidate applications."
      );
      return;
    }

    setEditingJob(job);
    setEditTitle(job.title || '');
    setEditSalary(String(job.salary_offered || job.salary || 15000));
    setEditSociety(job.society_name || '');
    setEditShift(job.shift_hours || 'Full Day (8:00 AM – 4:00 PM)');
    setEditDesc(job.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingJob || !editTitle.trim()) return;
    setIsSaving(true);
    try {
      const { apiClient } = await import('../../services/apiClient');
      await apiClient.post('api/admin/job/update', {
        jobId: editingJob.id,
        status: 'pending',
        notes: `Updated: ${editTitle}`
      }).catch(async () => {
        await supabase.from('jobs').update({
          title: editTitle,
          salary_offered: Number(editSalary) || 15000,
          society_name: editSociety,
          shift_hours: editShift,
          description: editDesc,
          status: 'pending',
          updated_at: new Date().toISOString()
        }).eq('id', editingJob.id);
      });
    } catch (e) {}

    setJobs(prev => prev.map(j => j.id === editingJob.id ? { ...j, title: editTitle, salary_offered: editSalary, society_name: editSociety, shift_hours: editShift, description: editDesc, status: 'pending' } : j));
    setIsSaving(false);
    setEditingJob(null);
    Alert.alert("Requisition Updated 🟢", "Your job requisition details have been updated and resubmitted for admin review.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* 1. TOP HERO CARD: MY POSTED REQUISITIONS */}
      <View style={styles.heroCard}>
        <View style={styles.eyebrowPillBlue}>
          <Sparkles size={11} color="#1A73E8" />
          <Text style={styles.eyebrowTextBlue}>{t('employerHouseholdRequisitions', 'EMPLOYER HOUSEHOLD REQUISITIONS')}</Text>
        </View>

        <View style={styles.titleIconRow}>
          <Briefcase size={22} color="#1A73E8" />
          <Text style={styles.heroTitle}>{t('myPostedRequisitions', 'My Posted Requisitions')}</Text>
        </View>

        <Text style={styles.heroSubText}>
          {t('manageRequisitionsSub', 'Manage your active household job listings, view admin feedback, and track inbound candidate applications.')}
        </Text>

        {onNavigateToPostJob && (
          <TouchableOpacity style={styles.primaryPostBtn} onPress={onNavigateToPostJob}>
            <PlusCircle size={16} color="#FFFFFF" />
            <Text style={styles.primaryPostBtnText}>{t('postNewJobRequisitionBtn', 'Post New Job Requisition')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. PIPELINE SUMMARY CARD */}
      <View style={styles.pipelineCard}>
        <View style={styles.eyebrowPillGreen}>
          <CheckCircle2 size={11} color="#16A34A" />
          <Text style={styles.eyebrowTextGreen}>{t('activeHouseholdPipeline', 'ACTIVE HOUSEHOLD PIPELINE')}</Text>
        </View>

        <Text style={styles.pipelineTitle}>
          {jobs.length} {t('requisitionsPostedByHousehold', 'Requisitions Posted by Your Household')}
        </Text>

        <Text style={styles.pipelineSubText}>
          {t('trackActiveRequisitionsSub', `Track your active job requisitions in ${societyDisplayName}, view pending admin approvals, and manage inbound candidate applications.`)}
        </Text>

        {/* 3-COLUMN METRICS GRID */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>{t('liveJobsMetric', 'LIVE JOBS')}</Text>
            <Text style={[styles.metricNumber, { color: '#16A34A' }]}>{liveJobs.length}</Text>
          </View>
          <View style={styles.metricDivider} />

          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>{t('pendingAuditMetric', 'PENDING AUDIT')}</Text>
            <Text style={[styles.metricNumber, { color: '#D97706' }]}>{pendingJobs.length}</Text>
          </View>
          <View style={styles.metricDivider} />

          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>{t('inboundAppsMetric', 'INBOUND APPS')}</Text>
            <Text style={[styles.metricNumber, { color: '#1A73E8' }]}>{inboundAppsCount}</Text>
          </View>
        </View>
      </View>

      {/* 3. SEGMENTED FILTER TABS */}
      <View style={styles.filterTabsBar}>
        
        <TouchableOpacity 
          style={[styles.filterTabPill, activeTab === 'all' && styles.filterTabPillActive]}
          onPress={() => setActiveTab('all')}
        >
          <Briefcase size={13} color={activeTab === 'all' ? '#1A73E8' : '#64748B'} />
          <Text style={[styles.filterTabText, activeTab === 'all' && styles.filterTabTextActive]}>
            {t('allTab', 'All')} ({jobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterTabPill, activeTab === 'active' && styles.filterTabPillActive]}
          onPress={() => setActiveTab('active')}
        >
          <CheckCircle2 size={13} color={activeTab === 'active' ? '#1A73E8' : '#64748B'} />
          <Text style={[styles.filterTabText, activeTab === 'active' && styles.filterTabTextActive]}>
            {t('activeAndLiveTab', 'Active & Live')} ({liveJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterTabPill, activeTab === 'pending' && styles.filterTabPillActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Clock size={13} color={activeTab === 'pending' ? '#1A73E8' : '#64748B'} />
          <Text style={[styles.filterTabText, activeTab === 'pending' && styles.filterTabTextActive]}>
            {t('pendingFeedbackTab', 'Pending / Feedback')} ({pendingJobs.length})
          </Text>
        </TouchableOpacity>

      </View>

      {/* 4. REQUISITIONS LIST / EMPTY STATE */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.loadingText}>{t('loadingRequisitions', 'Loading household requisitions...')}</Text>
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <Briefcase size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>{t('noJobRequisitionsFoundTitle', 'No Job Requisitions Found')}</Text>
          <Text style={styles.emptySubText}>
            {t('noJobRequisitionsFoundSub', "You haven't posted any household job listings in this filter category yet.")}
          </Text>
          
          {onNavigateToPostJob && (
            <TouchableOpacity style={styles.emptyPostBtn} onPress={onNavigateToPostJob}>
              <PlusCircle size={15} color="#FFFFFF" />
              <Text style={styles.emptyPostBtnText}>{t('postFirstHouseholdJobBtn', 'Post First Household Job')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.jobsList}>
          {filteredJobs.map((job) => {
            const isActive = job.status === 'active' || job.status === 'approved' || job.status === 'live';
            const isChangesRequested = job.status === 'changes_requested';
            const formattedSalary = Number(job.salary_offered || job.salary || 15000).toLocaleString('en-IN');
            const createdDate = job.created_at ? new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently';
            const appsCount = job.applicationsCount || job.applications_count || 0;
            const categoryName = (job.category || 'GENERAL').toUpperCase();
            const formattedJobId = `SVK-${(job.id || 'REQS').slice(-6).toUpperCase()}`;

            return (
              <View 
                key={job.id} 
                style={[
                  styles.jobCardContainer,
                  isChangesRequested ? styles.jobCardChangesRequested : isActive ? styles.jobCardActive : styles.jobCardPending
                ]}
              >
                
                {/* 1. Top Header Row: Title, Category Badge, Location & Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardTitleCol}>
                    <View style={styles.titleBadgeRow}>
                      <Text style={styles.cardTitle}>{job.title}</Text>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{categoryName}</Text>
                      </View>
                    </View>

                    <View style={styles.cardLocationRow}>
                      <MapPin size={12} color="#1A73E8" />
                      <Text style={styles.cardLocationText} numberOfLines={1}>
                        {job.society_name || job.societyName || societyDisplayName}
                      </Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View style={[
                    styles.statusPill,
                    isActive ? styles.statusPillLive : isChangesRequested ? styles.statusPillAlert : styles.statusPillPending
                  ]}>
                    {isActive ? (
                      <>
                        <CheckCircle2 size={10} color="#15803D" />
                        <Text style={styles.statusTextLive}>{t('activePublished', 'PUBLISHED & LIVE')}</Text>
                      </>
                    ) : isChangesRequested ? (
                      <>
                        <ShieldAlert size={10} color="#B91C1C" />
                        <Text style={styles.statusTextAlert}>{t('actionRequired', 'ACTION REQUIRED')}</Text>
                      </>
                    ) : (
                      <>
                        <Clock size={10} color="#B45309" />
                        <Text style={styles.statusTextPending}>{t('pendingAdminAudit', 'PENDING ADMIN AUDIT')}</Text>
                      </>
                    )}
                  </View>
                </View>

                {/* 2. Admin Feedback Warning Box (If changes requested) */}
                {isChangesRequested && job.adminNote && (
                  <View style={styles.adminNoteBox}>
                    <View style={styles.adminNoteTitleRow}>
                      <ShieldAlert size={14} color="#B91C1C" />
                      <Text style={styles.adminNoteTitle}>Admin Audit Feedback Note</Text>
                    </View>
                    <Text style={styles.adminNoteText}>"{job.adminNote}"</Text>
                    <TouchableOpacity style={styles.adminNoteBtn} onPress={() => handleOpenEdit(job)}>
                      <Edit3 size={12} color="#FFFFFF" />
                      <Text style={styles.adminNoteBtnText}>Update Requirements</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 3. 3-Grid Specs Row */}
                <View style={styles.cardSpecsGrid}>
                  <View style={styles.cardSpecBox}>
                    <Text style={styles.cardSpecLabel}>{t('monthlyOfferedSalary', 'OFFERED SALARY')}</Text>
                    <Text style={styles.cardSpecSalaryVal}>₹{formattedSalary} / mo</Text>
                  </View>

                  <View style={styles.cardSpecBox}>
                    <Text style={styles.cardSpecLabel}>{t('inboundApplications', 'APPLICATIONS')}</Text>
                    <Text style={styles.cardSpecAppsVal}>{appsCount} {t('candidatesApplied', 'Applied')}</Text>
                  </View>

                  <View style={styles.cardSpecBox}>
                    <Text style={styles.cardSpecLabel}>{t('dateCreated', 'DATE CREATED')}</Text>
                    <Text style={styles.cardSpecDateVal}>{createdDate}</Text>
                  </View>
                </View>

                {/* 4. Description snippet */}
                {job.description ? (
                  <View style={styles.cardDescBox}>
                    <Text style={styles.cardDescText} numberOfLines={2}>"{job.description}"</Text>
                  </View>
                ) : null}

                {/* 5. Bottom Action Buttons Row */}
                <View style={styles.cardActionRow}>
                  <View style={styles.cardActionBtnGroup}>
                    {isActive && onNavigateToInvite && (
                      <TouchableOpacity style={styles.inviteHelpersBtn} onPress={() => onNavigateToInvite(job)}>
                        <Sparkles size={12} color="#FFFFFF" />
                        <Text style={styles.inviteHelpersBtnText}>{t('inviteHelpersInSociety', '📨 Invite Helpers')}</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                      style={styles.viewCandidatesBtn} 
                      onPress={() => onNavigateToWorkers ? onNavigateToWorkers() : null}
                    >
                      <Users size={12} color="#FFFFFF" />
                      <Text style={styles.viewCandidatesBtnText}>{t('viewCandidates', 'Candidates')} ({appsCount})</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={isActive ? styles.editCardBtnLocked : styles.editCardBtn} 
                      onPress={() => handleOpenEdit(job)}
                    >
                      {isActive ? (
                        <>
                          <Lock size={12} color="#78350F" />
                          <Text style={styles.editCardBtnTextLocked}>{t('editLockedLive', '🔒 Edit Locked (Live)')}</Text>
                        </>
                      ) : (
                        <>
                          <Edit3 size={12} color="#334155" />
                          <Text style={styles.editCardBtnText}>{t('editRequisition', 'Edit')}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.jobRefIdText}>ID: {formattedJobId}</Text>
                </View>

              </View>
            );
          })}
        </View>
      )}

      {/* EDIT JOB REQUISITION MODAL */}
      {editingJob && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentCard}>
              
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Edit Job Requisition</Text>
                <TouchableOpacity onPress={() => setEditingJob(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }}>
                <Text style={styles.fieldLabel}>Requisition Title</Text>
                <TextInput style={styles.textInput} value={editTitle} onChangeText={setEditTitle} />

                <Text style={styles.fieldLabel}>Monthly Salary Offered (₹)</Text>
                <TextInput style={styles.textInput} keyboardType="numeric" value={editSalary} onChangeText={setEditSalary} />

                <Text style={styles.fieldLabel}>Society Name</Text>
                <TextInput style={styles.textInput} value={editSociety} onChangeText={setEditSociety} />

                <Text style={styles.fieldLabel}>Shift Slot</Text>
                <TextInput style={styles.textInput} value={editShift} onChangeText={setEditShift} />

                <Text style={styles.fieldLabel}>Description & Summary</Text>
                <TextInput style={[styles.textInput, { height: 80 }]} multiline value={editDesc} onChangeText={setEditDesc} />
              </ScrollView>

              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingJob(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} disabled={isSaving} onPress={handleSaveEdit}>
                  {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                    <>
                      <Save size={14} color="#FFFFFF" />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

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

  loadingBox: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 13, fontWeight: '800', color: '#64748B', marginTop: 10 },

  // 1. HERO CARD
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  eyebrowPillBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  eyebrowTextBlue: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A73E8',
    letterSpacing: 0.5,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  heroSubText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 18,
  },
  primaryPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A73E8',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryPostBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // 2. PIPELINE CARD
  pipelineCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  eyebrowPillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  eyebrowTextGreen: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  pipelineTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  pipelineSubText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },

  // 3-COLUMN METRICS
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#CBD5E1',
  },

  // 3. SEGMENTED FILTER TABS BAR
  filterTabsBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    padding: 5,
    marginBottom: 16,
    gap: 4,
  },
  filterTabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 14,
  },
  filterTabPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#1A73E8',
    fontWeight: '900',
  },

  // 4. EMPTY CARD
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  emptyPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 16,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyPostBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // REQUISITION ITEMS LIST (100% WEB PARITY MATCH)
  jobsList: { gap: 14 },
  jobCardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 16,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  jobCardActive: { borderColor: '#A7F3D0' },
  jobCardPending: { borderColor: '#FDE68A' },
  jobCardChangesRequested: { borderColor: '#FECACA', backgroundColor: '#FFF5F5' },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  cardTitleCol: { flex: 1 },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 20,
  },
  categoryPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1A73E8',
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardLocationText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillLive: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  statusPillPending: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  statusPillAlert: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },

  statusTextLive: { fontSize: 9.5, fontWeight: '900', color: '#15803D' },
  statusTextPending: { fontSize: 9.5, fontWeight: '900', color: '#B45309' },
  statusTextAlert: { fontSize: 9.5, fontWeight: '900', color: '#B91C1C' },

  adminNoteBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  adminNoteTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminNoteTitle: { fontSize: 12, fontWeight: '900', color: '#B91C1C' },
  adminNoteText: { fontSize: 11.5, fontWeight: '600', color: '#991B1B', lineHeight: 17, backgroundColor: '#FFFFFF', padding: 8, borderRadius: 10 },
  adminNoteBtn: { backgroundColor: '#DC2626', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-end', paddingHorizontal: 12 },
  adminNoteBtnText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },

  // 3-SPECS GRID
  cardSpecsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  cardSpecBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 8,
  },
  cardSpecLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  cardSpecSalaryVal: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2,
  },
  cardSpecAppsVal: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A73E8',
    marginTop: 2,
  },
  cardSpecDateVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginTop: 2,
  },

  cardDescBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 10,
  },
  cardDescText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 17,
  },

  cardActionRow: {
    flexDirection: 'column',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  cardActionBtnGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  inviteHelpersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  inviteHelpersBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  viewCandidatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewCandidatesBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  editCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  editCardBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  editCardBtnLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  editCardBtnTextLocked: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#78350F',
  },
  jobRefIdText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    alignSelf: 'flex-end',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#475569', marginTop: 10, marginBottom: 4 },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelBtnText: { fontSize: 12, fontWeight: '800', color: '#475569' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1A73E8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveBtnText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
});
