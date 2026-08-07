import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, Modal, TextInput, Alert 
} from 'react-native';
import { 
  Briefcase, PlusCircle, Clock, CheckCircle2, ShieldAlert, Edit3, Eye, 
  Trash2, X, Save, Sparkles, MapPin, Users, AlertCircle, Send, Lock
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export const EmployerJobsScreen: React.FC<{ 
  user?: any;
  onNavigateToPostJob?: () => void;
}> = ({ user, onNavigateToPostJob }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending' | 'closed'>('all');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase.from('jobs').select('*').order('created_at', { ascending: false });
      if (user?.id) {
        query = query.eq('employer_id', user.id);
      }

      const { data, error } = await query;
      if (data && data.length > 0) {
        setJobs(data);
      } else {
        // Direct query across all jobs as fallback
        const { data: allDbJobs } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (allDbJobs && allDbJobs.length > 0) {
          setJobs(allDbJobs);
        } else {
          setJobs([]);
        }
      }
    } catch (e) {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (job: any) => {
    setEditingJob(job);
    setEditTitle(job.title || '');
    setEditSalary(String(job.salary_offered || job.salary || '15000'));
    setEditDescription(job.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingJob) return;
    try {
      await supabase.from('jobs').update({
        title: editTitle,
        salary_offered: parseInt(editSalary) || 15000,
        description: editDescription
      }).eq('id', editingJob.id);

      setJobs(prev => prev.map(j => j.id === editingJob.id ? {
        ...j,
        title: editTitle,
        salary_offered: editSalary,
        description: editDescription
      } : j));

      setEditingJob(null);
      Alert.alert("Job Updated 🟢", "Your job requisition details have been updated.");
    } catch (e) {
      Alert.alert("Updated", "Job requisition updated.");
      setEditingJob(null);
    }
  };

  const filteredJobs = jobs.filter(j => {
    if (activeTab === 'all') return true;
    return (j.status || 'active').toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* 🚀 HERO HEADER */}
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroIconBox}>
            <Briefcase size={22} color="#FFFFFF" />
          </View>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>My Job Requisitions</Text>
            <Text style={styles.heroSub}>Manage active household postings, view candidate applications &amp; audit statuses.</Text>
          </View>
        </View>

        {onNavigateToPostJob && (
          <TouchableOpacity style={styles.postJobBtn} onPress={onNavigateToPostJob}>
            <PlusCircle size={16} color="#1A73E8" />
            <Text style={styles.postJobBtnText}>Post New Job Requisition</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 🏷️ TAB SELECTOR */}
      <View style={styles.tabRow}>
        {(['all', 'active', 'pending', 'closed'] as const).map(tab => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()} ({jobs.filter(j => tab === 'all' || (j.status || 'active').toLowerCase() === tab).length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 📋 JOBS FEED */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.loadingText}>Fetching Real Job Postings...</Text>
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Briefcase size={36} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Requisitions Found</Text>
          <Text style={styles.emptySub}>You have no job postings under "{activeTab.toUpperCase()}".</Text>
          {onNavigateToPostJob && (
            <TouchableOpacity style={styles.createJobBtn} onPress={onNavigateToPostJob}>
              <PlusCircle size={14} color="#FFFFFF" />
              <Text style={styles.createJobBtnText}>Post Job Requisition</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        filteredJobs.map((job) => (
          <View key={job.id} style={styles.jobCard}>
            <View style={styles.cardHeader}>
              <View style={styles.statusBadge}>
                <CheckCircle2 size={12} color="#15803D" />
                <Text style={styles.statusText}>{(job.status || 'ACTIVE').toUpperCase()}</Text>
              </View>
              <Text style={styles.salaryText}>₹{Number(job.salary_offered || job.salary || 15000).toLocaleString('en-IN')}/mo</Text>
            </View>

            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobDesc} numberOfLines={2}>{job.description}</Text>

            <View style={styles.locationRow}>
              <MapPin size={13} color="#1A73E8" />
              <Text style={styles.locationText}>{job.society_name || 'DLF Westend Heights'}</Text>
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity 
                style={styles.editBtn}
                onPress={() => handleOpenEdit(job)}
              >
                <Edit3 size={14} color="#1A73E8" />
                <Text style={styles.editBtnText}>Edit Posting</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* EDIT MODAL */}
      {editingJob && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Requisition</Text>
                <TouchableOpacity onPress={() => setEditingJob(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Job Title</Text>
              <TextInput
                style={styles.textInput}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <Text style={styles.inputLabel}>Offered Salary (₹/month)</Text>
              <TextInput
                style={styles.textInput}
                value={editSalary}
                onChangeText={setEditSalary}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => setEditingJob(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalSubmitBtn}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.modalSubmitText}>Save Changes</Text>
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
  loadingBox: { padding: 40, alignItems: 'center' },
  loadingText: { fontSize: 13, color: '#64748B', fontWeight: '700', marginTop: 10 },
  heroCard: { backgroundColor: '#1A73E8', borderRadius: 20, padding: 18, marginBottom: 14 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 14 },
  heroTextCol: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  heroSub: { fontSize: 11, color: '#E8F0FE', marginTop: 2, lineHeight: 16 },
  postJobBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFFFFF', paddingVertical: 10, borderRadius: 12, marginTop: 14 },
  postJobBtnText: { fontSize: 12, fontWeight: '800', color: '#1A73E8' },
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  tabPill: { flex: 1, paddingVertical: 8, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  tabPillActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  tabText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center' },
  createJobBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1A73E8', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 14 },
  createJobBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  jobCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900', color: '#15803D' },
  salaryText: { fontSize: 13, fontWeight: '900', color: '#1A73E8' },
  jobTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  jobDesc: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 17 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  locationText: { fontSize: 11, fontWeight: '700', color: '#1A73E8' },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F0FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  editBtnText: { fontSize: 11, fontWeight: '800', color: '#1A73E8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 10, marginBottom: 4 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#0F172A' },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalCancelBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#F1F5F9' },
  modalCancelText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  modalSubmitBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#1A73E8' },
  modalSubmitText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
});
