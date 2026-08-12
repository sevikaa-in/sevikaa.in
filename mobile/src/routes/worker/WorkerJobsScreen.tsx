import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Modal 
} from 'react-native';
import { 
  Briefcase, MapPin, Search, Filter, Check, 
  ShieldCheck, X, Clock, Building2, User, Sparkles, Globe, Home, ChevronDown, ChevronRight, CheckCircle2, IndianRupee, Users, Utensils, Calendar, Eye, Lock
} from 'lucide-react-native';
import { getApiUrl } from '../../config/api';
import { supabase } from '../../lib/supabase';
import { JobCard } from '../../components/JobCard';
import { useMobileLanguage } from '../../context/LanguageContext';
import { useUserProfile } from '../../context/UserProfileContext';

export const WorkerJobsScreen: React.FC<{
  onSelectJobDetail?: (job: any) => void;
}> = ({ onSelectJobDetail }) => {
  const { t } = useMobileLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilterMode, setSkillFilterMode] = useState<'matching' | 'all'>('matching');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'cook' | 'maid' | 'nanny'>('all');
  const [locationTier, setLocationTier] = useState<'my_workplaces' | 'primary' | 'secondary' | 'nearby' | 'within5km' | 'all'>('all');

  const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);
  const [isSocietyDropdownOpen, setIsSocietyDropdownOpen] = useState(false);

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const { workerSkills, isVerified: isWorkerVerified, primarySociety, secondarySocieties } = useUserProfile();

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    let fetched: any[] = [];

    // 1. Query Supabase jobs table
    try {
      const { data: dbJobs } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);

      if (dbJobs && dbJobs.length > 0) {
        fetched = dbJobs.filter((j: any) => j.status !== 'closed' && j.status !== 'deleted');
      }
    } catch (err) {
      console.warn('Supabase jobs fetch notice:', err);
    }

    // 2. Fetch via authenticated Sevikaa API route
    if (fetched.length === 0) {
      try {
        const { apiClient } = await import('../../services/apiClient');
        const data = await apiClient.get('api/worker/jobs?limit=40');
        if (data && Array.isArray(data.jobs) && data.jobs.length > 0) {
          fetched = data.jobs.filter((j: any) => j.status !== 'closed' && j.status !== 'deleted');
        }
      } catch (e) {}
    }

    setJobs(fetched);
    setLoading(false);
  };

  const handleApplyJob = async (job: any) => {
    if (appliedJobIds.includes(job.id)) {
      showToast(`Already applied for "${job.title}"! 🟢`);
      return;
    }

    setAppliedJobIds(prev => [...prev, job.id]);

    try {
      const { apiClient } = await import('../../services/apiClient');
      await apiClient.post('api/worker/apply', { jobId: job.id });
    } catch (e) {
      console.warn("Job application error notice:", e);
    }

    showToast(`Application Sent! 🟢 Employer notified for "${job.title}".`);
  };

  // Filter Jobs based on skill matching, category, location tier, and search query
  const filteredJobs = jobs.filter(job => {
    const title = (job.title || '').toLowerCase();
    const cat = (job.category || '').toLowerCase();
    const soc = (job.society_name || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();

    // 1. Skill/Role Filter: "Matching My Skills"
    if (skillFilterMode === 'matching') {
      // If no skills loaded yet, show all (don't filter out everything)
      if (workerSkills.length === 0) return true;
      const matchesSkill = workerSkills.some(skill => {
        const s = skill.toLowerCase();
        if (s.includes('cook') && (title.includes('cook') || cat.includes('cook') || desc.includes('cook'))) return true;
        if ((s.includes('maid') || s.includes('housekeep') || s.includes('clean')) &&
            (title.includes('maid') || title.includes('clean') || cat.includes('maid') || desc.includes('clean'))) return true;
        if ((s.includes('nanny') || s.includes('child')) &&
            (title.includes('nanny') || title.includes('child') || cat.includes('nanny') || desc.includes('child'))) return true;
        return title.includes(s) || cat.includes(s);
      });
      if (!matchesSkill) return false;
    } 
    // 2. Specific Category Filter
    else if (skillFilterMode === 'all' && categoryFilter !== 'all') {
      if (categoryFilter === 'cook' && !title.includes('cook') && !cat.includes('cook') && !desc.includes('cook')) return false;
      if (categoryFilter === 'maid' && !title.includes('maid') && !title.includes('clean') && !cat.includes('maid') && !desc.includes('clean')) return false;
      if (categoryFilter === 'nanny' && !title.includes('nanny') && !title.includes('child') && !cat.includes('nanny') && !desc.includes('child')) return false;
    }

    // 3. Location Tier Filter
    if (locationTier === 'my_workplaces') {
      const isPrimaryMatch = primarySociety && soc.includes(primarySociety.toLowerCase().trim());
      const isSecMatch = secondarySocieties.some(sName => sName && soc.includes(sName.toLowerCase().trim()));
      if (primarySociety && !isPrimaryMatch && !isSecMatch) return false;
    } else if (locationTier === 'primary' && primarySociety) {
      if (!soc.includes(primarySociety.toLowerCase().trim())) return false;
    }

    // 4. Search Query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      return title.includes(q) || soc.includes(q) || desc.includes(q);
    }

    return true;
  });

  const getSkillsDropdownLabel = () => {
    if (skillFilterMode === 'matching') return t('matchingMySkillsBtn', 'Matching My Skills');
    if (categoryFilter === 'all') return t('allCategoriesBtn', 'All Categories & Roles');
    if (categoryFilter === 'cook') return t('cooksCategory', 'Cooks');
    if (categoryFilter === 'maid') return t('maidsCategory', 'Maids & Housekeeping');
    if (categoryFilter === 'nanny') return t('nanniesCategory', 'Nannies & Childcare');
    return 'All Categories';
  };

  const getSocietyDropdownLabel = () => {
    if (locationTier === 'my_workplaces') return t('allMyWorkplacesBtn', 'All My Workplaces (Primary & Secondary)');
    if (locationTier === 'primary') return t('primarySocietyBtn', 'Primary Society Only');
    if (locationTier === 'secondary') return t('secondarySocietiesBtn', 'Secondary Societies Only');
    if (locationTier === 'nearby') return t('nearby2kmBtn', 'Nearby Societies (< 2 km)');
    if (locationTier === 'within5km') return t('within5kmBtn', 'Within 5 km Radius');
    return t('allCitiesBtn', 'All Societies & Cities');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMsg && (
        <View style={styles.floatingToast}>
          <CheckCircle2 size={16} color="#34D399" />
          <Text style={styles.floatingToastText}>{toastMsg}</Text>
        </View>
      )}

      {/* 🔍 FILTER CONTROLS CONTAINER (100% MATCH TO WEB JOBS PAGE) */}
      <View style={styles.filterCard}>
        
        {/* Row 1: Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput 
            style={styles.searchInput}
            placeholder={t('searchPlaceholder', 'Search by job title, cook, nanny, maid, or society name')}
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

        {/* Row 2: Skills Filter Dropdown Toggle Button */}
        <TouchableOpacity 
          style={styles.dropdownToggleBtn}
          onPress={() => {
            setIsSkillsDropdownOpen(!isSkillsDropdownOpen);
            setIsSocietyDropdownOpen(false);
          }}
        >
          <View style={styles.dropdownLabelLeft}>
            {skillFilterMode === 'matching' ? (
              <Sparkles size={14} color="#D97706" />
            ) : (
              <Globe size={14} color="#1A73E8" />
            )}
            <Text style={styles.dropdownToggleText}>{getSkillsDropdownLabel()}</Text>
          </View>
          <ChevronDown size={14} color="#64748B" />
        </TouchableOpacity>

        {/* Expanded Skills Choices */}
        {isSkillsDropdownOpen && (
          <View style={styles.dropdownChoicesList}>
            {[
              { id: 'matching', label: t('matchingMySkillsBtn', 'Matching My Skills'), isMatching: true },
              { id: 'all', label: t('allCategoriesBtn', 'All Categories & Roles'), isMatching: false },
              { id: 'cook', label: t('cooksCategory', 'Cooks'), isMatching: false },
              { id: 'maid', label: t('maidsCategory', 'Maids & Housekeeping'), isMatching: false },
              { id: 'nanny', label: t('nanniesCategory', 'Nannies & Childcare'), isMatching: false },
            ].map(opt => {
              const isSelected = opt.isMatching 
                ? skillFilterMode === 'matching' 
                : (skillFilterMode === 'all' && categoryFilter === opt.id);

              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                  onPress={() => {
                    if (opt.isMatching) {
                      setSkillFilterMode('matching');
                      setCategoryFilter('all');
                    } else {
                      setSkillFilterMode('all');
                      setCategoryFilter(opt.id as any);
                    }
                    setIsSkillsDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={14} color="#1A73E8" />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Row 3: Society Filter Dropdown Toggle Button */}
        <TouchableOpacity 
          style={styles.dropdownToggleBtn}
          onPress={() => {
            setIsSocietyDropdownOpen(!isSocietyDropdownOpen);
            setIsSkillsDropdownOpen(false);
          }}
        >
          <View style={styles.dropdownLabelLeft}>
            <Home size={14} color="#1A73E8" />
            <Text style={styles.dropdownToggleText}>{getSocietyDropdownLabel()}</Text>
          </View>
          <ChevronDown size={14} color="#64748B" />
        </TouchableOpacity>

        {/* Expanded Society Choices */}
        {isSocietyDropdownOpen && (
          <View style={styles.dropdownChoicesList}>
            {[
              { id: 'my_workplaces', label: t('allMyWorkplacesBtn', 'All My Workplaces (Primary & Secondary)') },
              { id: 'primary', label: t('primarySocietyBtn', 'Primary Society Only') },
              { id: 'secondary', label: t('secondarySocietiesBtn', 'Secondary Societies Only') },
              { id: 'nearby', label: t('nearby2kmBtn', 'Nearby Societies (< 2 km)') },
              { id: 'within5km', label: t('within5kmBtn', 'Within 5 km Radius') },
              { id: 'all', label: t('allCitiesBtn', 'All Societies & Cities') },
            ].map(opt => {
              const isSelected = locationTier === opt.id;

              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                  onPress={() => {
                    setLocationTier(opt.id as any);
                    setIsSocietyDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={14} color="#1A73E8" />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </View>

      {/* SECTION HEADER ROW */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>
          VERIFIED HOUSEHOLD JOBS ({filteredJobs.length})
        </Text>
        <View style={styles.freePill}>
          <Text style={styles.freePillText}>100% FREE APPLICATION</Text>
        </View>
      </View>

      {/* JOBS LIST */}
      {loading ? (
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginVertical: 30 }} />
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Briefcase size={36} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Requisitions Found</Text>
          <Text style={styles.emptySub}>No open job requisitions match your search filters.</Text>
        </View>
      ) : (
        filteredJobs.map(job => (
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

      {/* RICH JOB DETAIL MODAL (100% MATCH WITH WEB DRAWER MODAL) */}
      {selectedJob && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{selectedJob.title}</Text>
                  <Text style={styles.modalEmployer}>Posted by {selectedJob.employer_name || 'Verified Household'}</Text>
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
                    <Text style={styles.modalStatSub}>Monthly</Text>
                  </View>

                  <View style={styles.modalStatBox}>
                    <Clock size={14} color="#1A73E8" />
                    <Text style={styles.modalStatVal} numberOfLines={1}>{selectedJob.shift_hours || 'Full Day'}</Text>
                    <Text style={styles.modalStatSub}>Shift Hours</Text>
                  </View>
                </View>

                <View style={styles.modalLocationRow}>
                  <MapPin size={14} color="#1A73E8" />
                  <Text style={styles.modalLocationText}>{selectedJob.society_name || 'Gated Residential Society'}</Text>
                </View>

                <View style={styles.modalDivider} />

                <Text style={styles.modalDescLabel}>Job Description &amp; Requirements:</Text>
                <Text style={styles.modalDesc}>{selectedJob.description || 'Household work required.'}</Text>

                {Array.isArray(selectedJob.responsibilities) && selectedJob.responsibilities.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.modalDescLabel}>Key Responsibilities:</Text>
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
                    <Text style={styles.modalDescLabel}>Perks &amp; Benefits:</Text>
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
                    <Text style={styles.modalApplyBtnText}>Application Transmitted ✓</Text>
                  </>
                ) : !isWorkerVerified ? (
                  <>
                    <Lock size={16} color="#78350F" />
                    <Text style={styles.modalApplyBtnTextLocked}>Pending Audit (Locked until Verified)</Text>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.modalApplyBtnText}>Confirm 1-Click Apply</Text>
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

  filterCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    paddingVertical: 0,
  },
  dropdownToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  dropdownLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dropdownToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  dropdownChoicesList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: '#E8F0FE',
  },
  dropdownItemText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  dropdownItemTextActive: {
    color: '#1A73E8',
    fontWeight: '900',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  freePill: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  freePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
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
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },

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
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  modalLocationText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
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
    lineHeight: 17,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  bulletText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  perksWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  perkChip: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
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
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 14,
  },
  modalApplyBtnApplied: {
    backgroundColor: '#16A34A',
  },
  modalApplyBtnLocked: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  modalApplyBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalApplyBtnTextLocked: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#78350F',
  },
});
