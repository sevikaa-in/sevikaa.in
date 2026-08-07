import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react-native';

export const InterviewsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<any[]>([]);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, jobs(*)')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setInterviews(data);
      } else {
        setInterviews([]);
      }
    } catch (e) {
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HERO */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroIconBox}>
              <Calendar size={22} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Gate Meetings &amp; Interviews</Text>
              <Text style={styles.heroSub}>Track confirmed gate passes &amp; verified interview interactions.</Text>
            </View>
          </View>
        </View>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator size="large" color="#1A73E8" style={{ marginVertical: 20 }} />
        ) : interviews.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={36} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Interviews Scheduled</Text>
            <Text style={styles.emptySub}>You have zero gate pass interviews scheduled in your account.</Text>
          </View>
        ) : (
          interviews.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <ShieldCheck size={12} color="#15803D" />
                  <Text style={styles.badgeText}>Gate Pass Active</Text>
                </View>
                <Text style={styles.timeText}>{item.created_at || 'Today'}</Text>
              </View>

              <Text style={styles.nameText}>{item.employer_name || item.jobs?.employer_name || 'Employer'}</Text>
              <Text style={styles.subText}>{item.job_title || item.jobs?.title || 'Domestic Worker Job'}</Text>

              <View style={styles.locRow}>
                <MapPin size={13} color="#1A73E8" />
                <Text style={styles.locText}>{item.society_name || item.jobs?.society_name || 'DLF Westend Heights'}</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  heroCard: { backgroundColor: '#1A73E8', borderRadius: 20, padding: 18, marginBottom: 14 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 14 },
  heroTextCol: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  heroSub: { fontSize: 11, color: '#E8F0FE', marginTop: 2, lineHeight: 16 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#15803D' },
  timeText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  nameText: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  subText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  locText: { fontSize: 11, fontWeight: '700', color: '#1A73E8' },
});
