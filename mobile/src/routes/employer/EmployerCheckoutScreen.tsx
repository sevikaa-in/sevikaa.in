import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, SafeAreaView, Linking 
} from 'react-native';
import { getApiUrl } from '../../config/api';
import { useMobileLanguage } from '../../context/LanguageContext';

interface EmployerCheckoutProps {
  onBack?: () => void;
  selectedPlanId?: string;
  onPaymentSuccess?: () => void;
  employerName?: string;
  phone?: string;
  email?: string;
  societyName?: string;
  address?: string;
  userId?: string;
}

export const EmployerCheckoutScreen: React.FC<EmployerCheckoutProps> = ({ 
  onBack, selectedPlanId = 'standard', onPaymentSuccess,
  employerName, phone, email, societyName, address, userId
}) => {
  const { t } = useMobileLanguage();
  const [loading, setLoading] = useState(false);

  const displayEmployerName = employerName || 'Employer Account';
  const displayPhone = phone || '—';
  const displayEmail = email || '—';
  const displaySociety = societyName || '—';
  const displayAddress = address || '—';

  const PLAN_DATA: Record<string, any> = {
    free: {
      id: 'free',
      name: 'Free Trial Pass',
      price: 0,
      validity: '7 Days',
      features: [
        '1 Active Job Requisition',
        'Browse Worker Bios & Ratings',
        'Basic Applicant Notifications'
      ]
    },
    basic: {
      id: 'basic',
      name: 'Basic Household Pass',
      price: 299,
      validity: '30 Days',
      features: [
        '3 Active Job Requisitions',
        'Direct Candidate Calling (10 Unlocks)',
        'Watch 60-Second Worker Intro Videos',
        'Society Gate Security Badges',
        'Jio DLT Instant SMS Alerts'
      ]
    },
    standard: {
      id: 'standard',
      name: 'Standard Family Plan',
      price: 699,
      validity: '60 Days',
      features: [
        '10 Active Job Requisitions',
        '50 Candidate Contact Phone Unlocks',
        'Full Worker Intro Video Access',
        'Aadhaar ID & Police Clearance Badges',
        'Priority Applicant Matching in Society',
        'Dedicated WhatsApp Support'
      ]
    },
    pro: {
      id: 'pro',
      name: 'Pro Unlimited Household Pass',
      price: 1499,
      validity: '90 Days',
      features: [
        'Unlimited Job Requisitions',
        'Unlimited Candidate Phone Unlocks',
        'Watch All Intro Videos & Audio Bios',
        'Verified Aadhaar + Police Background Audit',
        '1-on-1 Dedicated Sevikaa Hiring Manager',
        'Replacement Guarantee within 30 Days'
      ]
    }
  };

  const plan = PLAN_DATA[selectedPlanId.toLowerCase()] || PLAN_DATA['standard'];

  const handleOpenWebCheckout = () => {
    setLoading(true);

    const encPhone = encodeURIComponent(displayPhone !== '—' ? displayPhone : '');
    const encName = encodeURIComponent(displayEmployerName !== 'Employer Account' ? displayEmployerName : '');
    const encEmail = encodeURIComponent(displayEmail !== '—' ? displayEmail : '');
    const encUserId = encodeURIComponent(userId || '');

    const webCheckoutUrl = getApiUrl(
      `employer/checkout?plan=${plan.id}&userId=${encUserId}&phone=${encPhone}&name=${encName}&email=${encEmail}`
    );
    
    Alert.alert(
      "Opening Web Checkout 🌐",
      `Redirecting to 100% secure web checkout page for ${plan.name} (₹${plan.price})...`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setLoading(false)
        },
        {
          text: "Proceed to Payment 🔒",
          onPress: () => {
            setLoading(false);
            Linking.openURL(webCheckoutUrl);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER BRANDING */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backLink} onPress={onBack}>
              <Text style={styles.backLinkText}>← Back to Pricing</Text>
            </TouchableOpacity>
          )}

          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>{t('checkoutEyebrow','SECURE CHECKOUT')}</Text>
          </View>
          <Text style={styles.title}>{t('checkoutTitle','Complete Your Subscription')}</Text>
          <Text style={styles.subtitle}>
            {t('checkoutSub','You are upgrading to a verified employer plan for your gated society household.')}
          </Text>
        </View>

        {/* 1. ORDER SUMMARY DARK GRADIENT CARD */}
        <View style={styles.orderSummaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.planCategoryText}>{t('orderSummaryLabel','ORDER SUMMARY').toUpperCase()}</Text>
              <Text style={styles.planNameText}>{plan.name}</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.payableLabelText}>{t('planPriceLabel','TOTAL PAYABLE').replace(':','').toUpperCase()}</Text>
              <Text style={styles.priceAmountText}>₹{plan.price}</Text>
            </View>
          </View>

          <View style={styles.validityBadge}>
            <Text style={styles.validityBadgeText}>{t('planValidityLabel','Validity:')} {plan.validity}</Text>
          </View>

          <View style={styles.divider} />

          {/* PLAN FEATURES LIST */}
          <View style={styles.featuresBox}>
            {plan.features.map((feat: string, idx: number) => (
              <View key={idx} style={styles.featureItemRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. HOUSEHOLD BILLING INFO */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>🏢 Household Billing Account</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>EMPLOYER NAME</Text>
              <Text style={styles.infoValue}>{displayEmployerName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>MOBILE CONTACT</Text>
              <Text style={styles.infoValue}>{displayPhone}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>GATED SOCIETY</Text>
              <Text style={styles.infoValue}>{displaySociety}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>FLAT ADDRESS</Text>
              <Text style={styles.infoValue}>{displayAddress}</Text>
            </View>
          </View>
        </View>

        {/* 3. WEB REDIRECT ACTION CARD */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>🌐 Web Gateway Activation</Text>
          <Text style={styles.cardSub}>
            Tapping below will securely open Sevikaa Web Portal Checkout where you can pay using Google Pay, PhonePe, Paytm, Cards, or Net Banking.
          </Text>

          <TouchableOpacity 
            activeOpacity={0.85}
            disabled={loading}
            style={[styles.payNowBtn, loading && styles.payNowBtnDisabled]}
            onPress={handleOpenWebCheckout}
          >
            <Text style={styles.payNowBtnText}>
              {loading ? t('processingPayment','Opening Razorpay...') : `${t('proceedToPaymentBtn','Proceed to Web Checkout')} (₹${plan.price}) 🌐`}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.stepFooter}>🔒 100% Razorpay PCI-DSS Compliant Payment Gateway</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 28 },
  header: { marginBottom: 14 },
  backLink: { marginBottom: 10 },
  backLinkText: { color: '#1A73E8', fontSize: 13, fontWeight: '800' },
  pillBadge: {
    backgroundColor: '#E8F0FE',
    borderWidth: 1,
    borderColor: '#D2E3FC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  pillBadgeText: { color: '#1A73E8', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  orderSummaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planCategoryText: { fontSize: 9, fontWeight: '900', color: '#93C5FD', letterSpacing: 1 },
  planNameText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  priceCol: { alignItems: 'flex-end' },
  payableLabelText: { fontSize: 9, fontWeight: '800', color: '#94A3B8' },
  priceAmountText: { fontSize: 24, fontWeight: '900', color: '#4ADE80' },
  validityBadge: { backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 8 },
  validityBadgeText: { color: '#93C5FD', fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 14 },
  featuresBox: { gap: 8 },
  featureItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureCheck: { color: '#4ADE80', fontSize: 14, fontWeight: '900' },
  featureText: { color: '#E2E8F0', fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 18, marginBottom: 14 },
  cardHeader: { fontSize: 15, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
  cardSub: { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 14 },
  infoGrid: { gap: 10 },
  infoItem: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 6 },
  infoLabel: { fontSize: 9, fontWeight: '900', color: '#64748B', letterSpacing: 0.8 },
  infoValue: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  payNowBtn: { backgroundColor: '#1A73E8', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#1A73E8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  payNowBtnDisabled: { backgroundColor: '#94A3B8' },
  payNowBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  stepFooter: { textAlign: 'center', color: '#94A3B8', fontSize: 10, fontWeight: '700', marginTop: 8 },
});
