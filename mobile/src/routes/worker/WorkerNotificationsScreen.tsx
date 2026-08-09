import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Alert, SafeAreaView, ActivityIndicator
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useMobileLanguage } from '../../context/LanguageContext';
import {
  Bell, Calendar, Briefcase, ShieldCheck, Check, Trash2, ArrowRight
} from 'lucide-react-native';

export interface WorkerNotificationItem {
  id: string;
  type: 'interview_scheduled' | 'profile_approved' | 'job_match' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionType?: 'profile' | 'interviews' | 'jobs';
  actionLabel?: string;
}

export const WorkerNotificationsScreen: React.FC<{
  user?: any;
  onNavigateToInterviews?: () => void;
  onNavigateToJobs?: () => void;
  onNavigateToProfile?: () => void;
}> = ({ user, onNavigateToInterviews, onNavigateToJobs, onNavigateToProfile }) => {
  const { t } = useMobileLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'interviews'>('all');
  const [notifications, setNotifications] = useState<WorkerNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buildNotifications();
  }, [user]);

  const buildNotifications = async () => {
    setLoading(true);
    const notifList: WorkerNotificationItem[] = [];
    const activeUserId = user?.id;

    try {
      if (!activeUserId) { setNotifications([]); return; }

      // 1. Persistent notifications from DB
      const { data: dbNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', activeUserId)
        .order('created_at', { ascending: false });

      if (dbNotifs && dbNotifs.length > 0) {
        dbNotifs.forEach((n: any) => {
          notifList.push({
            id: n.id,
            type: n.type || 'system',
            title: n.title || 'Platform Notification',
            message: n.message || n.body || '',
            time: n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
            read: n.read ?? false,
            actionLabel: n.action_label || 'View',
          });
        });
      }

      // 2. Profile verification status
      const { data: prof } = await supabase
        .from('profiles').select('*, worker_profiles(*)').eq('id', activeUserId).maybeSingle();
      const wp = prof && (Array.isArray(prof.worker_profiles) ? prof.worker_profiles[0] : prof.worker_profiles);
      const isLive = wp?.status === 'live' || wp?.status === 'approved' || prof?.status === 'approved' || prof?.status === 'live';

      if (!notifList.some(n => n.id === 'notif_w_profile')) {
        notifList.unshift({
          id: 'notif_w_profile',
          type: 'profile_approved',
          title: isLive ? 'Worker Passport Verified & Live ??' : 'Verification Documents Under Admin Audit ?',
          message: isLive
            ? 'Your profile passed Aadhaar & background audit. Employers can now view and contact you.'
            : 'Sevikaa officers are checking your Aadhaar & profile details. Approval within 24 hrs.',
          time: 'Status',
          read: isLive,
          actionType: 'profile',
          actionLabel: 'View Passport',
        });
      }

      // 3. Interview invites from real applications
      const { data: dbApps } = await supabase
        .from('job_applications').select('*, jobs(*)').eq('worker_id', activeUserId);

      if (dbApps && dbApps.length > 0) {
        dbApps.forEach((app: any) => {
          if ((app.status === 'interview_scheduled' || app.status === 'accepted') &&
            !notifList.some(n => n.id === `notif_app_${app.id}`)) {
            notifList.push({
              id: `notif_app_${app.id}`,
              type: 'interview_scheduled',
              title: `Interview: ${app.jobs?.title || 'Housekeeping Requisition'}`,
              message: `${app.jobs?.employer_name || 'Employer'} scheduled a gate interview.`,
              time: app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN') : 'Recent',
              read: false,
              actionType: 'interviews',
              actionLabel: 'View Gate Pass',
            });
          }
        });
      }

      // 4. Nearby jobs (real only)
      const { count: jobCount } = await supabase
        .from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active');
      if (jobCount && jobCount > 0 && !notifList.some(n => n.id === 'notif_w_jobs')) {
        notifList.push({
          id: 'notif_w_jobs',
          type: 'job_match',
          title: `${jobCount} Job Requisitions Nearby`,
          message: `${jobCount} active household requisitions open in your area.`,
          time: 'Live',
          read: true,
          actionType: 'jobs',
          actionLabel: 'Explore Jobs',
        });
      }

    } catch (e) {
      console.warn('Worker notif error:', e);
    } finally {
      setNotifications(notifList);
      setLoading(false);
    }
  };

  const handleMarkAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const handleClearAll = () => {
    Alert.alert('Clear All', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setNotifications([]) },
    ]);
  };

  const handleAction = (item: WorkerNotificationItem) => {
    if (item.actionType === 'profile' && onNavigateToProfile) onNavigateToProfile();
    else if (item.actionType === 'interviews' && onNavigateToInterviews) onNavigateToInterviews();
    else if (item.actionType === 'jobs' && onNavigateToJobs) onNavigateToJobs();
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'interviews') return n.type === 'interview_scheduled';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.headerWrap}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleRow}>
              <Bell size={18} color="#059669" />
              <Text style={styles.headerTitle}>Notifications & Alerts</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadPill}>
                  <Text style={styles.unreadPillText}>{unreadCount} UNREAD</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSub}>Interview invites, gate passes & job matches.</Text>
          </View>

          {(unreadCount > 0 || notifications.length > 0) && (
            <View style={styles.actionRow}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead} style={styles.actionBtn}>
                  <Check size={12} color="#059669" />
                  <Text style={styles.actionBtnText}>Mark Read</Text>
                </TouchableOpacity>
              )}
              {notifications.length > 0 && (
                <TouchableOpacity onPress={handleClearAll} style={[styles.actionBtn, styles.actionBtnRed]}>
                  <Trash2 size={12} color="#DC2626" />
                  <Text style={[styles.actionBtnText, styles.actionBtnTextRed]}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* FILTER TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
          {(['all', 'unread', 'interviews'] as const).map(tab => (
            <TouchableOpacity key={tab} style={[styles.tabPill, activeTab === tab && styles.tabPillActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? `All (${notifications.length})` : tab === 'unread' ? `Unread (${unreadCount})` : `Interviews (${notifications.filter(n => n.type === 'interview_scheduled').length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator size="large" color="#059669" style={{ marginVertical: 24 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell size={30} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySub}>No alerts matching this filter.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map(notif => {
              const isInterview = notif.type === 'interview_scheduled';
              const isProfile = notif.type === 'profile_approved';
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.row, !notif.read && styles.rowUnread]}
                  activeOpacity={0.75}
                  onPress={() => handleAction(notif)}
                >
                  <View style={[styles.iconBox, isInterview ? styles.iconGreen : isProfile ? styles.iconBlue : styles.iconAmber]}>
                    {isInterview ? <Calendar size={14} color="#059669" /> : isProfile ? <ShieldCheck size={14} color="#1A73E8" /> : <Briefcase size={14} color="#D97706" />}
                  </View>
                  <View style={styles.rowText}>
                    <View style={styles.titleRow}>
                      {!notif.read && <View style={styles.dot} />}
                      <Text style={styles.rowTitle} numberOfLines={1}>{notif.title}</Text>
                    </View>
                    <Text style={styles.rowMsg} numberOfLines={1}>{notif.message}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowTime}>{notif.time}</Text>
                    {notif.actionLabel && (
                      <View style={styles.linkRow}>
                        <Text style={styles.linkText}>{notif.actionLabel}</Text>
                        <ArrowRight size={9} color="#1A73E8" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 48 },

  headerWrap: { marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 10 },
  headerTop: { gap: 2 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
  unreadPill: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingHorizontal: 7, paddingVertical: 1.5, borderRadius: 8 },
  unreadPillText: { fontSize: 9, fontWeight: '900', color: '#059669' },
  headerSub: { fontSize: 11, color: '#64748B', marginLeft: 25 },

  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  actionBtnText: { fontSize: 11, fontWeight: '800', color: '#059669' },
  actionBtnRed: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  actionBtnTextRed: { color: '#DC2626' },

  tabScroll: { marginBottom: 12 },
  tabRow: { flexDirection: 'row', gap: 6 },
  tabPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  tabPillActive: { backgroundColor: '#059669', borderColor: '#059669' },
  tabText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },

  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  emptySub: { fontSize: 11.5, color: '#64748B', textAlign: 'center' },

  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  rowUnread: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },

  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconGreen: { backgroundColor: '#DCFCE7' },
  iconBlue: { backgroundColor: '#EFF6FF' },
  iconAmber: { backgroundColor: '#FEF3C7' },

  rowText: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  rowTitle: { fontSize: 12, fontWeight: '900', color: '#0F172A', flex: 1 },
  rowMsg: { fontSize: 11, color: '#64748B', marginTop: 1 },

  rowRight: { alignItems: 'flex-end', gap: 3 },
  rowTime: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { fontSize: 10, fontWeight: '900', color: '#1A73E8' },
});
