import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Bell, CheckCircle2, Calendar, Briefcase, User, Info } from 'lucide-react-native';

export const WorkerNotificationsScreen: React.FC<{ 
  user?: any;
  onNavigateToInterviews?: () => void; 
  onNavigateToJobs?: () => void;
  onNavigateToProfile?: () => void;
}> = ({ user, onNavigateToInterviews, onNavigateToJobs, onNavigateToProfile }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (user?.id) {
        query = query.eq('user_id', user.id);
      }
      const { data, error } = await query;
      if (data && data.length > 0) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    Alert.alert("All Read ✓", "All notification alerts have been marked as read.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HERO HEADER */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroIconBox}>
              <Bell size={22} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Worker Alerts &amp; SMS Logs</Text>
              <Text style={styles.heroSub}>Track interview invitations, gate passes &amp; job application status updates.</Text>
            </View>
          </View>
        </View>

        {/* CONTROLS */}
        <View style={styles.controlsRow}>
          <View style={styles.tabRow}>
            <TouchableOpacity 
              style={[styles.tabPill, activeTab === 'all' && styles.tabPillActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                All ({notifications.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabPill, activeTab === 'unread' && styles.tabPillActive]}
              onPress={() => setActiveTab('unread')}
            >
              <Text style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
                Unread ({notifications.filter(n => !n.read).length})
              </Text>
            </TouchableOpacity>
          </View>

          {notifications.length > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator size="large" color="#34A853" style={{ marginVertical: 20 }} />
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell size={36} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySub}>You have zero unread notification alerts in your candidate account.</Text>
          </View>
        ) : (
          filteredNotifications.map((notif) => (
            <View key={notif.id} style={[styles.notifCard, !notif.read && styles.notifCardUnread]}>
              <View style={styles.notifHeader}>
                <Text style={styles.notifTitle}>{notif.title || 'Notification Alert'}</Text>
                <Text style={styles.notifTime}>{notif.created_at || 'Just now'}</Text>
              </View>

              <Text style={styles.notifBody}>{notif.message || notif.body || 'No description'}</Text>
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
  heroCard: { backgroundColor: '#34A853', borderRadius: 20, padding: 18, marginBottom: 14 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 14 },
  heroTextCol: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  heroSub: { fontSize: 11, color: '#E8F5E9', marginTop: 2, lineHeight: 16 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tabPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  tabPillActive: { backgroundColor: '#34A853', borderColor: '#34A853' },
  tabText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },
  markReadText: { fontSize: 11, fontWeight: '800', color: '#34A853' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center' },
  notifCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  notifCardUnread: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { fontSize: 13, fontWeight: '900', color: '#0F172A', flex: 1 },
  notifTime: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  notifBody: { fontSize: 12, color: '#475569', lineHeight: 17 },
});
