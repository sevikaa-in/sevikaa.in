import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking 
} from 'react-native';
import { getApiUrl } from '../config/api';

interface InvoicesScreenProps {
  onBack?: () => void;
}

export const InvoicesScreen: React.FC<InvoicesScreenProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { apiClient } = await import('../services/apiClient');
      const data = await apiClient.get('api/employer/invoices');
      if (data && Array.isArray(data.invoices)) {
        setInvoices(data.invoices);
      } else if (data && Array.isArray(data.transactions)) {
        setInvoices(data.transactions);
      } else {
        setInvoices([]);
      }
    } catch (e: any) {
      console.warn('[InvoicesScreen] Failed to fetch invoices:', e?.message);
      setErrorMsg('Unable to load tax invoices from server.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenTaxInvoice = (inv: any) => {
    const invId = inv.invoiceNumber ? inv.invoiceNumber.replace(/\//g, '-') : (inv.razorpay_payment_id || inv.id);
    if (!invId) return;
    const url = getApiUrl(`invoice/${invId}`);
    Linking.openURL(url);
    Alert.alert("Opening Tax Invoice 🧾", `Opening single A4 page Tax Invoice ${inv.invoiceNumber || invId}...`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Membership &amp; GST Tax Invoices</Text>
      <Text style={styles.subtitle}>Issuer: YugaYatra Retail (OPC) Pvt.Ltd (GSTIN: 29AABCY8389C1ZT)</Text>

      <Text style={styles.sectionHeader}>Payment Ledger &amp; Tax Invoice History</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginTop: 30 }} />
      ) : errorMsg ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Notice</Text>
          <Text style={styles.emptyText}>{errorMsg}</Text>
        </View>
      ) : invoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Invoices Found</Text>
          <Text style={styles.emptyText}>When you purchase a hiring pass or job posting requisition, official GST tax invoices will appear here.</Text>
        </View>
      ) : (
        invoices.map((inv) => (
          <View key={inv.id || inv.razorpay_payment_id} style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.invNumber}>{inv.invoiceNumber || inv.invoice_number || 'Tax Invoice'}</Text>
                <Text style={styles.planName}>{inv.planName || inv.plan_name || 'Household Staffing Requisition'}</Text>
              </View>
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>✓ PAID 🟢</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View>
                <Text style={styles.metaLabel}>PAYMENT DATE</Text>
                <Text style={styles.metaVal}>{inv.timestamp || inv.created_at || 'N/A'}</Text>
              </View>

              <View>
                <Text style={styles.metaLabel}>GATEWAY REF ID</Text>
                <Text style={styles.metaVal}>{inv.razorpay_payment_id || inv.id || 'N/A'}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>TOTAL PAID (18% GST)</Text>
                <Text style={styles.amountText}>₹{Number(inv.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.downloadBtn}
              onPress={() => handleOpenTaxInvoice(inv)}
            >
              <Text style={styles.downloadBtnText}>🖨️ View Executive Tax Invoice PDF</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2, marginBottom: 16 },
  sectionHeader: { fontSize: 13, fontWeight: '800', color: '#334155', marginVertical: 12, letterSpacing: 0.3 },
  emptyContainer: { padding: 24, backgroundColor: '#FFFFFF', borderRadius: 12, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: '#334155', marginBottom: 6 },
  emptyText: { fontSize: 12, fontWeight: '500', color: '#64748B', textAlign: 'center', lineHeight: 18 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invNumber: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  planName: { fontSize: 11, fontWeight: '700', color: '#1A73E8', marginTop: 2 },
  paidBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  paidBadgeText: { fontSize: 10, fontWeight: '900', color: '#166534' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  metaLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  metaVal: { fontSize: 10.5, fontWeight: '700', color: '#334155', marginTop: 2 },
  amountText: { fontSize: 12, fontWeight: '900', color: '#0F172A', marginTop: 2 },
  downloadBtn: { marginTop: 12, backgroundColor: '#F1F5F9', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  downloadBtnText: { fontSize: 11, fontWeight: '800', color: '#1A73E8' },
});
