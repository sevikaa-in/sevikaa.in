import React from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Image, SafeAreaView, StatusBar, ScrollView, Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileLanguage } from '../context/LanguageContext';

interface RoleSelectProps {
  onSelectRole?: (role: 'employer' | 'worker') => void;
  onSelectEmployer?: () => void;
  onSelectWorker?: () => void;
}

export const RoleSelectScreen: React.FC<RoleSelectProps> = ({ 
  onSelectRole, onSelectEmployer, onSelectWorker 
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useMobileLanguage();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: Math.max(insets.bottom, 28) }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* HEADER BRANDING */}
        <View style={styles.header}>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>{t('welcomeBadge', '✨ WELCOME TO SEVIKAA PLATFORM')}</Text>
          </View>
          
          <View style={styles.logoRow}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </View>

          <Text style={styles.title}>{t('roleSelectTitle', 'How would you like to use Sevikaa?')}</Text>
          <Text style={styles.subtitle}>
            {t('roleSelectSub', 'Select your account type to customize your experience. You can switch roles anytime.')}
          </Text>
        </View>

        {/* ROLE SELECTION CARDS */}
        <View style={styles.roleGrid}>
          
          {/* CARD 1: HOUSEHOLD EMPLOYER */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.employerCard}
            onPress={() => {
              if (onSelectEmployer) onSelectEmployer();
              if (onSelectRole) onSelectRole('employer');
            }}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.employerIconBadge}>
                <Text style={styles.iconEmoji}>🏠</Text>
              </View>
              <View style={styles.badgeTagBlue}>
                <Text style={styles.badgeTagBlueText}>{t('employerBadge', 'EMPLOYER')}</Text>
              </View>
            </View>

            <Text style={styles.cardTitleBlue}>{t('employerCardTitle', 'I Want to Hire Household Help')}</Text>
            <Text style={styles.cardDesc}>
              {t('employerCardDesc', 'Browse & hire verified Cooks, Maids, and Nannies. Schedule 1-click gate meetings & download GST invoices.')}
            </Text>

            <View style={styles.featureRow}>
              <Text style={styles.featureCheck}>{t('featureVerifiedStaff', '✓ Aadhaar Verified Staff')}</Text>
              <Text style={styles.featureCheck}>{t('featureGatePass', '✓ Gate Interview Pass')}</Text>
            </View>

            <View style={styles.selectBtnBlue}>
              <Text style={styles.selectBtnBlueText}>{t('continueEmployerBtn', 'Continue as Employer →')}</Text>
            </View>
          </TouchableOpacity>

          {/* CARD 2: DOMESTIC HELPER / WORKER */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.workerCard}
            onPress={() => {
              if (onSelectWorker) onSelectWorker();
              if (onSelectRole) onSelectRole('worker');
            }}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.workerIconBadge}>
                <Text style={styles.iconEmoji}>🧹</Text>
              </View>
              <View style={styles.badgeTagGreen}>
                <Text style={styles.badgeTagGreenText}>{t('workerBadge', 'WORKER / HELPER')}</Text>
              </View>
            </View>

            <Text style={styles.cardTitleGreen}>{t('workerCardTitle', 'I Am Looking for Household Work')}</Text>
            <Text style={styles.cardDesc}>
              {t('workerCardDesc', 'Find trusted, high-paying jobs in premium gated societies. Get instant interview requests & verified society entry passes.')}
            </Text>

            <View style={styles.featureRow}>
              <Text style={styles.featureCheckGreen}>{t('featureFreeJobCalls', '✓ 0% Commission Jobs')}</Text>
              <Text style={styles.featureCheckGreen}>{t('featureZeroCommission', '✓ Direct Society Hiring')}</Text>
            </View>

            <View style={styles.selectBtnGreen}>
              <Text style={styles.selectBtnGreenText}>{t('continueWorkerBtn', 'Continue as Helper →')}</Text>
            </View>
          </TouchableOpacity>

        </View>

        <Text style={styles.stepFooter}>Step 3 of 4 • Sevikaa Platform Role</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  brandAccentBar: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
  },
  accentStrip: {
    flex: 1,
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pillBadge: {
    backgroundColor: '#E8F0FE',
    borderWidth: 1,
    borderColor: '#D2E3FC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  pillBadgeText: {
    color: '#1A73E8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  logoImage: {
    width: 140,
    height: 44,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  roleGrid: {
    gap: 16,
  },
  employerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1A73E8',
    padding: 20,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  employerIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 24,
  },
  badgeTagBlue: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D2E3FC',
  },
  badgeTagBlueText: {
    color: '#1A73E8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardTitleBlue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  featureCheck: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A73E8',
  },
  selectBtnBlue: {
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectBtnBlueText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  workerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#34A853',
    padding: 20,
    shadowColor: '#34A853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  workerIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeTagGreen: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CEEAD6',
  },
  badgeTagGreenText: {
    color: '#137333',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardTitleGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  featureCheckGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: '#137333',
  },
  selectBtnGreen: {
    backgroundColor: '#34A853',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectBtnGreenText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  stepFooter: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 20,
  },
});
