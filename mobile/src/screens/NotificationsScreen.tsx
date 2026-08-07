import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Bell } from 'lucide-react-native';

export const NotificationsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifs();
  }, []);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HERO */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroIconBox}>
              <Bell size={22} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Notifications &amp; Alerts</Text>
              <Text style={styles.heroSub}>Track gate passes, hiring updates &amp; SMS alerts.</Text>
            </View>
          </View>
        </View>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator size="large" color="#1A73E8" style={{ marginVertical: 20 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell size={36} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySub}>You have zero unread notification alerts.</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title || 'Notification Alert'}</Text>
              <Text style={styles.cardBody}>{item.message || item.body || ''}</Text>
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  cardBody: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 17 },
});
