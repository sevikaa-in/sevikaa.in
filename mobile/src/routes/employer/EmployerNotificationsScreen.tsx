import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Alert, SafeAreaView, ActivityIndicator
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useMobileLanguage } from '../../context/LanguageContext';
import {
  Bell, AlertTriangle, Users, Briefcase, Check, Trash2, ArrowRight
} from 'lucide-react-native';

export interface EmployerNotificationItem {
  id: string;
  type: 'changes_requested' | 'job_approved' | 'new_applicant' | 'interview_confirmed' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionType?: 'jobs' | 'workers';
  actionLabel?: string;
}

export const EmployerNotificationsScreen: React.FC<{
  user?: any;
  onNavigateToJobs?: () => void;
  onNavigateToWorkers?: () => void;
}> = ({ user, onNavigateToJobs, onNavigateToWorkers }) => {
  const { t } = useMobileLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'applicants'>('all');
  const [notifications, setNotifications] = useState<EmployerNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buildNotifications();
  }, [user]);

  const buildNotifications = async () => {
    setLoading(true);
    const notifList: EmployerNotificationItem[] = [];
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
            title: n.title || 'Employer Alert',
            message: n.message || n.body || '',
            time: n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
            read: n.read ?? false,
            actionType: n.action_url?.includes('workers') ? 'workers' : 'jobs',
            actionLabel: n.action_label || 'View',
          });
        });
      }

      // 2. Job status-derived notifications
      try {
        const { apiClient } = await import('../../services/apiClient');
        const jobsData = await apiClient.get('/api/employer/jobs');
        const dbJobs = jobsData?.jobs || [];

        if (dbJobs && dbJobs.length > 0) {
          dbJobs.forEach((j: any) => {
            if (j.status === 'changes_requested' && !notifList.some(n => n.id === `notif_job_${j.id}_changes`)) {
              notifList.push({
                id: `notif_job_${j.id}_changes`,
                type: 'changes_requested',
                title: `Action Required: "${j.title}"`,
                message: j.admin_note || 'Admin requested updates before publishing.',
                time: j.created_at ? new Date(j.created_at).toLocaleDateString('en-IN') : 'Recent',
                read: false,
                actionType: 'jobs',
                actionLabel: 'Revise',
              });
            } else if ((j.status === 'approved' || j.status === 'active') && !notifList.some(n => n.id === `notif_job_${j.id}_active`)) {
              notifList.push({
                id: `notif_job_${j.id}_active`,
                type: 'job_approved',
                title: `Requisition Live: "${j.title}" 🟢`,
                message: 'Your job passed Sevikaa verification and is now active.',
                time: j.created_at ? new Date(j.created_at).toLocaleDateString('en-IN') : 'Recent',
                read: true,
                actionType: 'jobs',
                actionLabel: 'View',
              });
            }

            if ((j.applicant_count || j.applicationsCount) > 0 && !notifList.some(n => n.id === `notif_job_${j.id}_apps`)) {
              notifList.push({
                id: `notif_job_${j.id}_apps`,
                type: 'new_applicant',
                title: `${j.applicant_count || j.applicationsCount} Applicants for "${j.title}"`,
                message: `${j.applicant_count || j.applicationsCount} verified candidates applied.`,
                time: 'Recent',
                read: false,
                actionType: 'workers',
                actionLabel: 'Review',
              });
            }
          });
        }
      } catch (e) {}

    } catch (e) {
      console.warn('Employer notif error:', e);
    } finally {
      setNotifications(notifList);
      setLoading(false);
    }
  };

  const handleMarkAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const handleClearAll = () => {
    Alert.alert(t('clearAllConfirmTitle','Clear All'), t('clearAllConfirmMsg','Remove all notifications?'), [
      { text: t('cancelBtnLabel','Cancel'), style: 'cancel' },
      { text: t('clearBtnLabel','Clear'), style: 'destructive', onPress: () => setNotifications([]) },
    ]);
  };

  const handleAction = (item: EmployerNotificationItem) => {
    if (item.actionType === 'workers' && onNavigateToWorkers) onNavigateToWorkers();
    else if (item.actionType === 'jobs' && onNavigateToJobs) onNavigateToJobs();
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'applicants') return n.type === 'new_applicant' || n.type === 'interview_confirmed';
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
              <Bell size={18} color="#1A73E8" />
              <Text style={styles.headerTitle}>{t('notificationsTitle', 'Notifications & Activity')}</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadPill}>
                  <Text style={styles.unreadPillText}>{unreadCount} {t('unreadLabel', 'UNREAD')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSub}>{t('notificationsSub', 'Applicant alerts, requisition updates & gate passes.')}</Text>
          </View>

          {(unreadCount > 0 || notifications.length > 0) && (
            <View style={styles.actionRow}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead} style={styles.actionBtn}>
                  <Check size={12} color="#1A73E8" />
                  <Text style={styles.actionBtnText}>{t('markReadBtn', 'Mark Read')}</Text>
                </TouchableOpacity>
              )}
              {notifications.length > 0 && (
                <TouchableOpacity onPress={handleClearAll} style={[styles.actionBtn, styles.actionBtnRed]}>
                  <Trash2 size={12} color="#DC2626" />
                  <Text style={[styles.actionBtnText, styles.actionBtnTextRed]}>{t('clearAllBtn', 'Clear All')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* FILTER TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
          {(['all', 'unread', 'applicants'] as const).map(tab => (
            <TouchableOpacity key={tab} style={[styles.tabPill, activeTab === tab && styles.tabPillActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all'
                  ? `${t('allTabLabel','All')} (${notifications.length})`
                  : tab === 'unread'
                  ? `${t('unreadTabLabel','Unread')} (${unreadCount})`
                  : `${t('applicantsTabLabel','Applicants')} (${notifications.filter(n => n.type === 'new_applicant' || n.type === 'interview_confirmed').length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator size="large" color="#1A73E8" style={{ marginVertical: 24 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell size={30} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>{t('noNotificationsTitle', 'No Notifications')}</Text>
            <Text style={styles.emptySub}>{t('noNotificationsSub', 'No activity alerts matching this filter.')}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map(notif => {
              const isApplicant = notif.type === 'new_applicant' || notif.type === 'interview_confirmed';
              const isAlert = notif.type === 'changes_requested';
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.row, !notif.read && styles.rowUnread]}
                  activeOpacity={0.75}
                  onPress={() => handleAction(notif)}
                >
                  <View style={[styles.iconBox, isApplicant ? styles.iconGreen : isAlert ? styles.iconRed : styles.iconBlue]}>
                    {isApplicant ? <Users size={14} color="#059669" /> : isAlert ? <AlertTriangle size={14} color="#DC2626" /> : <Briefcase size={14} color="#1A73E8" />}
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
  unreadPill: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 7, paddingVertical: 1.5, borderRadius: 8 },
  unreadPillText: { fontSize: 9, fontWeight: '900', color: '#1A73E8' },
  headerSub: { fontSize: 11, color: '#64748B', marginLeft: 25 },

  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  actionBtnText: { fontSize: 11, fontWeight: '800', color: '#1A73E8' },
  actionBtnRed: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  actionBtnTextRed: { color: '#DC2626' },

  tabScroll: { marginBottom: 12 },
  tabRow: { flexDirection: 'row', gap: 6 },
  tabPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  tabPillActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  tabText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },

  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  emptySub: { fontSize: 11.5, color: '#64748B', textAlign: 'center' },

  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  rowUnread: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },

  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconGreen: { backgroundColor: '#DCFCE7' },
  iconBlue: { backgroundColor: '#EFF6FF' },
  iconRed: { backgroundColor: '#FEE2E2' },

  rowText: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1A73E8' },
  rowTitle: { fontSize: 12, fontWeight: '900', color: '#0F172A', flex: 1 },
  rowMsg: { fontSize: 11, color: '#64748B', marginTop: 1 },

  rowRight: { alignItems: 'flex-end', gap: 3 },
  rowTime: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { fontSize: 10, fontWeight: '900', color: '#1A73E8' },
});
