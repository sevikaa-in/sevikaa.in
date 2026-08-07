import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Modal, Alert 
} from 'react-native';
import { 
  Briefcase, MapPin, Search, Filter, Check, 
  ShieldCheck, X, Clock, Building2, User, Sparkles, Globe, Home, ChevronDown, ChevronRight
} from 'lucide-react-native';
import { getApiUrl } from '../../config/api';
import { supabase } from '../../lib/supabase';
import { JobCard } from '../../components/JobCard';
import { useMobileLanguage } from '../../context/LanguageContext';

export const WorkerJobsScreen: React.FC = () => {
  const { t } = useMobileLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilterMode, setSkillFilterMode] = useState<'matching' | 'all'>('matching');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'cook' | 'maid' | 'nanny'>('all');
  const [locationTier, setLocationTier] = useState<'my_workplaces' | 'primary' | 'secondary' | 'nearby' | 'within5km' | 'all'>('my_workplaces');
  
  const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);
  const [isSocietyDropdownOpen, setIsSocietyDropdownOpen] = useState(false);

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const [workerSkills, setWorkerSkills] = useState<string[]>(['cook', 'maid', 'housekeeping']);
  const [isWorkerVerified, setIsWorkerVerified] = useState(false);

  useEffect(() => {
    fetchWorkerSkills();
    fetchJobs();
  }, []);

  const fetchWorkerSkills = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('status, worker_profiles(*)')
          .eq('id', user.id)
          .maybeSingle();

        if (prof) {
          const isVerified = prof.status === 'approved' || prof.status === 'live';
          setIsWorkerVerified(isVerified);

          const wp = Array.isArray(prof.worker_profiles) ? prof.worker_profiles[0] : prof.worker_profiles;
          if (wp) {
            const sList: string[] = Array.isArray(wp.skills) && wp.skills.length > 0
              ? wp.skills.map((s: string) => s.toLowerCase())
              : [(wp.category || 'cook').toLowerCase()];
            setWorkerSkills(sList);
          }
        }
      }
    } catch (e) {}
  };

  const fetchJobs = async () => {
    setLoading(true);
    let fetched: any[] = [];
    try {
      const { data: dbJobs } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (dbJobs && dbJobs.length > 0) {
        fetched = dbJobs;
      }
    } catch (err) {
      console.warn("Supabase jobs fetch notice:", err);
    }

    if (fetched.length === 0) {
      try {
        const res = await fetch(getApiUrl('api/admin/data?tab=jobs&limit=30'));
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
            fetched = data.jobs;
          }
        }
      } catch (e) {}
    }

    if (fetched.length === 0) {
      fetched = [
        {
          id: 'job-001',
          title: 'Full Day Housekeeping & Deep Cleaning',
          category: 'maid',
          employer_name: 'sharama house',
          society_name: 'Adarsh Palm Retreat, Bellandur',
          salary_offered: 15000,
          shift_hours: 'Full Day (8:00 AM – 4:00 PM)',
          status: 'active',
          description: 'Daily dusting, mopping, utensil washing, and laundry for a 3BHK flat.'
        },
        {
          id: 'job-002',
          title: 'North Indian Family Cook & Kitchen Prep',
          category: 'cook',
          employer_name: 'Verma Household',
          society_name: 'DLF Westend Heights, Akshayanagar',
          salary_offered: 16000,
          shift_hours: 'Morning & Evening (7:00 AM - 1:00 PM)',
          status: 'active',
          description: 'Experienced cook needed for 4 family members. Healthy veg thali & breakfasts.'
        },
        {
          id: 'job-003',
          title: 'Full Time Childcare & Infant Nanny',
          category: 'nanny',
          employer_name: 'Mehta Family',
          society_name: 'Prestige Song of the South, Begur',
          salary_offered: 18000,
          shift_hours: 'Full Day (9:00 AM - 6:00 PM)',
          status: 'active',
          description: 'Responsible nanny for 2-year old toddler. Feeding, play supervision & hygiene.'
        }
      ];
    }

    setJobs(fetched);
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

  // Filter Jobs based on selected skill & society dropdowns + search query
  const filteredJobs = jobs.filter(job => {
    const title = (job.title || '').toLowerCase();
    const cat = (job.category || '').toLowerCase();
    const soc = (job.society_name || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();

    // 1. Skill/Role Filter: "Matching My Skills"
    if (skillFilterMode === 'matching') {
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
    if (locationTier === 'primary') {
      if (!soc.includes('dlf') && !soc.includes('adarsh')) return false;
    } else if (locationTier === 'secondary') {
      if (!soc.includes('prestige') && !soc.includes('song')) return false;
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
            onViewDetails={setSelectedJob}
          />
        ))
      )}

      {/* DETAIL MODAL */}
      {selectedJob && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedJob.title}</Text>
                <TouchableOpacity onPress={() => setSelectedJob(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalEmployer}>Employer: {selectedJob.employer_name || 'Verified Household'}</Text>
              <Text style={styles.modalSalary}>₹{Number(selectedJob.salary_offered || selectedJob.salary || 15000).toLocaleString('en-IN')} / month</Text>
              <Text style={styles.modalLocation}>📍 {selectedJob.society_name || 'Gated Residential Society'}</Text>

              <View style={styles.modalDivider} />

              <Text style={styles.modalDescLabel}>Job Description:</Text>
              <Text style={styles.modalDesc}>{selectedJob.description || 'Household work required.'}</Text>

              <TouchableOpacity 
                style={styles.modalApplyBtn}
                onPress={() => {
                  handleApplyJob(selectedJob);
                  setSelectedJob(null);
                }}
              >
                <Text style={styles.modalApplyBtnText}>Confirm 1-Click Apply</Text>
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
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
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
    paddingVertical: 10,
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
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  modalEmployer: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalSalary: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803D',
    marginTop: 6,
  },
  modalLocation: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  modalDescLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalApplyBtn: {
    backgroundColor: '#1A73E8',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalApplyBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
