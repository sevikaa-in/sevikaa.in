import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { getApiUrl } from '../../config/api';
import { useMobileLanguage } from '../../context/LanguageContext';

interface EmployerPricingProps {
  onSelectPlan?: (planId: string) => void;
}

export const EmployerPricingScreen: React.FC<EmployerPricingProps> = ({ onSelectPlan }) => {
  const { t } = useMobileLanguage();
  const currentPlanName = t('planStandardName','Standard Family Plan');
  const [loading, setLoading] = useState(false);
  const [livePricing, setLivePricing] = useState<any>(null);

  const fetchLivePricing = async () => {
    setLoading(true);
    try {
      const { apiClient } = await import('../../services/apiClient');
      const data = await apiClient.get('api/pricing');
      if (data && data.pricing) {
        setLivePricing(data.pricing);
      }
    } catch (e) {
      console.warn("Notice fetching live pricing:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePricing();
  }, []);

  // Map Super Admin live pricing config to UI plan cards
  const freeObj = livePricing?.freePlan || {};
  const basicObj = livePricing?.basicPlan || {};
  const premiumObj = livePricing?.premiumPlan || {};
  const proObj = livePricing?.proPlan || {};

  const plans = [
    {
      id: 'free',
      name: freeObj.name || 'Free Trial Pass',
      price: freeObj.price || '0',
      validity: freeObj.validityDays || '7 Days',
      badge: 'Starter Trial',
      popular: false,
      features: [
        `${freeObj.jobPostsLimit || '1'} Active Job Requisition`,
        'Browse Worker Bios & Ratings',
        'Basic Applicant Notifications',
        'Community Support'
      ]
    },
    {
      id: 'basic',
      name: basicObj.name || 'Basic Household Pass',
      price: basicObj.price || '299',
      validity: `${basicObj.validityDays || '30'} Days`,
      badge: 'Single Hire',
      popular: false,
      features: [
        `${basicObj.jobPostsLimit || '3'} Active Job Requisitions`,
        `Direct Candidate Calling (${basicObj.contactUnlocksLimit || '10'} Unlocks)`,
        'Watch 60-Second Worker Intro Videos',
        'Society Gate Security Badges',
        'Jio DLT Instant SMS Alerts'
      ]
    },
    {
      id: 'standard',
      name: premiumObj.name || 'Standard Family Plan',
      price: premiumObj.price || '699',
      validity: `${premiumObj.validityDays || '60'} Days`,
      badge: 'Most Popular ⭐',
      popular: true,
      features: [
        `${premiumObj.jobPostsLimit || '10'} Active Job Requisitions`,
        `${premiumObj.contactUnlocksLimit || '50'} Candidate Contact Phone Unlocks`,
        'Full Worker Intro Video Access',
        'Aadhaar ID & Police Clearance Badges',
        'Priority Applicant Matching in Society',
        'Dedicated WhatsApp Support'
      ]
    },
    {
      id: 'pro',
      name: proObj.name || 'Pro Unlimited Household Pass',
      price: proObj.price || '1,499',
      validity: `${proObj.validityDays || '90'} Days`,
      badge: 'Best Value for Gated Societies',
      popular: false,
      features: [
        `${proObj.jobPostsLimit || 'Unlimited'} Job Requisitions`,
        `${proObj.contactUnlocksLimit || 'Unlimited'} Candidate Phone Unlocks`,
        'Watch All Intro Videos & Audio Bios',
        'Verified Aadhaar + Police Background Audit',
        '1-on-1 Dedicated Sevikaa Hiring Manager',
        'Replacement Guarantee within 30 Days'
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER BRANDING */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{t('pricingEyebrow','SUBSCRIPTION PLANS')}</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchLivePricing}>
              <Text style={styles.refreshBtnText}>🔄 {t('syncLiveLabel','Sync Live')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{t('pricingTitle','Choose Your Hiring Plan')}</Text>
          <Text style={styles.subtitle}>
            {t('pricingSub','Transparent, affordable plans for verified gated society employers.')}
          </Text>
        </View>

        {/* CURRENT ACTIVE PLAN BANNER */}
        <View style={styles.activeBanner}>
          <View style={styles.activeBannerTopRow}>
            <View>
              <Text style={styles.activeBannerLabel}>{t('currentPlanLabel','YOUR CURRENT ACTIVE PLAN')}</Text>
              <Text style={styles.activeBannerTitle}>{currentPlanName}</Text>
            </View>
            <View style={styles.activeBadgeGreen}>
              <Text style={styles.activeBadgeGreenText}>✓ {t('activeBadge','Active')} 🟢</Text>
            </View>
          </View>
          <Text style={styles.activeBannerSub}>
            {t('activePlanBannerSub','Full direct calling, video bios & verified candidate access active in your society.')}
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#1A73E8" />
            <Text style={styles.loadingText}>Fetching Live Super-Admin Prices...</Text>
          </View>
        )}

        {/* 4 PRICING CARDS LIST */}
        <View style={styles.plansGrid}>
          {plans.map((p) => {
            const isPopular = p.popular;
            return (
              <View 
                key={p.id} 
                style={[
                  styles.planCard,
                  isPopular && styles.planCardPopular
                ]}
              >
                {/* POPULAR BADGE */}
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.tagBadge, isPopular ? styles.tagBadgeBlue : styles.tagBadgeGray]}>
                    <Text style={[styles.tagBadgeText, isPopular ? styles.tagBadgeTextBlue : styles.tagBadgeTextGray]}>
                      {p.badge}
                    </Text>
                  </View>
                  <Text style={styles.validityText}>{p.validity}</Text>
                </View>

                {/* PLAN NAME & PRICE */}
                <Text style={styles.planName}>{p.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceSymbol}>₹</Text>
                  <Text style={styles.priceValue}>{p.price}</Text>
                  <Text style={styles.pricePeriod}>/ {p.validity}</Text>
                </View>

                {/* FEATURES LIST */}
                <View style={styles.featuresList}>
                  {p.features.map((feat, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <Text style={styles.featureCheck}>✓</Text>
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA BUTTON */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.selectPlanBtn, isPopular && styles.selectPlanBtnBlue]}
                  onPress={() => onSelectPlan ? onSelectPlan(p.id) : null}
                >
                  <Text style={[styles.selectPlanBtnText, isPopular && styles.selectPlanBtnTextBlue]}>
                    {t('selectPlanBtn','Select Plan')} →
                  </Text>
                </TouchableOpacity>

              </View>
            );
          })}
        </View>

        <Text style={styles.stepFooter}>🔒 100% Super-Admin Controlled Live Pricing Architecture</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 28 },
  header: { marginBottom: 14 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pillBadge: { backgroundColor: '#E8F0FE', borderWidth: 1, borderColor: '#D2E3FC', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  pillBadgeText: { color: '#1A73E8', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  refreshBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  refreshBtnText: { color: '#1A73E8', fontSize: 10, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  activeBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  activeBannerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeBannerLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  activeBannerTitle: { fontSize: 17, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  activeBadgeGreen: { backgroundColor: 'rgba(52, 168, 83, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(52, 168, 83, 0.4)' },
  activeBadgeGreenText: { color: '#4ADE80', fontSize: 11, fontWeight: '800' },
  activeBannerSub: { fontSize: 11, color: '#93C5FD', marginTop: 6, fontWeight: '600' },
  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginVertical: 10 },
  loadingText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  plansGrid: { gap: 14 },
  planCard: { backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 18 },
  planCardPopular: { borderColor: '#1A73E8', borderWidth: 2, shadowColor: '#1A73E8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tagBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagBadgeBlue: { backgroundColor: '#E8F0FE', borderWidth: 1, borderColor: '#D2E3FC' },
  tagBadgeGray: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  tagBadgeText: { fontSize: 10, fontWeight: '900' },
  tagBadgeTextBlue: { color: '#1A73E8' },
  tagBadgeTextGray: { color: '#64748B' },
  validityText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  planName: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 14 },
  priceSymbol: { fontSize: 18, fontWeight: '900', color: '#1A73E8' },
  priceValue: { fontSize: 32, fontWeight: '900', color: '#0F172A' },
  pricePeriod: { fontSize: 12, fontWeight: '700', color: '#64748B', marginLeft: 4 },
  featuresList: { gap: 8, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureCheck: { color: '#137333', fontSize: 13, fontWeight: '900' },
  featureText: { color: '#334155', fontSize: 12, fontWeight: '600' },
  selectPlanBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  selectPlanBtnBlue: { backgroundColor: '#1A73E8', borderWidth: 0, shadowColor: '#1A73E8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  selectPlanBtnText: { color: '#475569', fontSize: 13, fontWeight: '900' },
  selectPlanBtnTextBlue: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  stepFooter: { textAlign: 'center', color: '#94A3B8', fontSize: 10, fontWeight: '700', marginTop: 16 },
});
