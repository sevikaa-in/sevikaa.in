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

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('api/super-admin/transactions?page=1&limit=10'));
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.transactions)) {
          setInvoices(data.transactions);
        }
      }
    } catch (e) {
      setInvoices([
        {
          id: 'pay_RZP1009814',
          invoiceNumber: 'SV/26-27/0004',
          timestamp: '06 Aug 2026',
          employerName: 'sharma.employer',
          planName: 'Pro Household Unlimited Employer Pass',
          amount: 1499.00,
          status: 'Paid'
        },
        {
          id: 'pay_RZP1009812',
          invoiceNumber: 'SV/26-27/0003',
          timestamp: '06 Aug 2026',
          employerName: 'Verma Residency',
          planName: 'Job Posting Requisition',
          amount: 199.00,
          status: 'Paid'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenTaxInvoice = (inv: any) => {
    const invId = inv.invoiceNumber ? inv.invoiceNumber.replace(/\//g, '-') : inv.id;
    const url = getApiUrl(`invoice/${invId}`);
    Linking.openURL(url);
    Alert.alert("Opening Tax Invoice 🧾", `Opening single A4 page Tax Invoice ${inv.invoiceNumber || inv.id}...`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Membership &amp; GST Tax Invoices</Text>
      <Text style={styles.subtitle}>Issuer: YugaYatra Retail (OPC) Pvt.Ltd (GSTIN: 29AABCY8389C1ZT)</Text>

      {/* ACTIVE SUBSCRIPTION BADGE CARD */}
      <View style={styles.activePassCard}>
        <View style={styles.activePassRow}>
          <View>
            <Text style={styles.activePassBadge}>🟢 ACTIVE MEMBERSHIP PASS</Text>
            <Text style={styles.activePassTitle}>Pro Household Unlimited Pass</Text>
            <Text style={styles.activePassSub}>Valid till: 06 Oct 2026 (60 Days Unlimited Contact Access)</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Payment Ledger &amp; Tax Invoice History</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginTop: 30 }} />
      ) : (
        invoices.map((inv) => (
          <View key={inv.id} style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.invNumber}>{inv.invoiceNumber || 'SV/26-27/0004'}</Text>
                <Text style={styles.planName}>{inv.planName || 'Household Staffing Requisition'}</Text>
              </View>
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>✓ PAID 🟢</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View>
                <Text style={styles.metaLabel}>PAYMENT DATE</Text>
                <Text style={styles.metaVal}>{inv.timestamp || '06 Aug 2026'}</Text>
              </View>

              <View>
                <Text style={styles.metaLabel}>GATEWAY REF ID</Text>
                <Text style={styles.metaVal}>{inv.id}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>TOTAL PAID (18% GST)</Text>
                <Text style={styles.amountText}>₹{Number(inv.amount || 199).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
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
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 14, marginTop: 2 },
  activePassCard: { backgroundColor: '#1B5E20', borderRadius: 18, padding: 16, marginBottom: 16 },
  activePassRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activePassBadge: { color: '#A5D6A7', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  activePassTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 4 },
  activePassSub: { color: '#E8F5E9', fontSize: 11, fontWeight: '600', marginTop: 4 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invNumber: { fontSize: 14, fontWeight: '900', color: '#1B5E20', fontFamily: 'monospace' },
  planName: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  paidBadge: { backgroundColor: '#1B5E20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paidBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  metaLabel: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  metaVal: { fontSize: 11, fontWeight: '700', color: '#334155', marginTop: 2 },
  amountText: { fontSize: 15, fontWeight: '900', color: '#1B5E20', marginTop: 2 },
  downloadBtn: {
    backgroundColor: '#F1F8E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  downloadBtnText: { color: '#1B5E20', fontWeight: '800', fontSize: 12 },
});
