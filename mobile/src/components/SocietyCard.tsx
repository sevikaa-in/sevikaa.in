import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { 
  Building2, MapPin, Star, CheckCircle2, Sparkles, 
  Briefcase, Home, ShieldCheck, ChevronRight 
} from 'lucide-react-native';
import { useMobileLanguage } from '../context/LanguageContext';

export interface SocietyItem {
  id: string;
  name: string;
  locality: string;
  city?: string;
  activeJobsCount: number;
  employersCount: number;
  securityType: string;
  distance: string;
  isHighHiring?: boolean;
  image_url?: string;
}

export interface SocietyCardProps {
  society: SocietyItem;
  isPrimary?: boolean;
  isSecondary?: boolean;
  onSelectPrimary?: (society: SocietyItem) => void;
  onToggleSecondary?: (society: SocietyItem) => void;
  onPressCard?: (society: SocietyItem) => void;
}

export const SocietyCard: React.FC<SocietyCardProps> = ({
  society,
  isPrimary = false,
  isSecondary = false,
  onSelectPrimary,
  onToggleSecondary,
  onPressCard
}) => {
  const { t } = useMobileLanguage();
  const isSelected = isPrimary || isSecondary;

  return (
    <TouchableOpacity 
      style={[
        styles.card,
        isPrimary && styles.cardPrimary,
        isSecondary && styles.cardSecondary
      ]}
      activeOpacity={0.85}
      onPress={() => onPressCard && onPressCard(society)}
    >
      
      {/* Header Row: Avatar, Name, Badges & Distance */}
      <View style={styles.headerRow}>
        <View style={styles.avatarBox}>
          {society.image_url ? (
            <Image source={{ uri: society.image_url }} style={styles.avatarImg} />
          ) : (
            <Building2 size={20} color="#475569" />
          )}
        </View>

        <View style={styles.mainCol}>
          <View style={styles.titleRow}>
            <Text style={styles.socName} numberOfLines={1}>{society.name}</Text>
          </View>

          <View style={styles.localityRow}>
            <MapPin size={11} color="#64748B" />
            <Text style={styles.localityText} numberOfLines={1}>{society.locality}</Text>
          </View>

          {/* Badges Container */}
          <View style={styles.badgesRow}>
            {isPrimary && (
              <View style={styles.primaryBadgePill}>
                <Star size={9} color="#1A73E8" fill="#1A73E8" />
                <Text style={styles.primaryBadgeText}>{t('primaryWorkplaceBadge', 'Primary Workplace')}</Text>
              </View>
            )}
            {isSecondary && (
              <View style={styles.secondaryBadgePill}>
                <CheckCircle2 size={9} color="#15803D" />
                <Text style={styles.secondaryBadgeText}>{t('secondaryWorkplaceBadge', 'Secondary Workplace')}</Text>
              </View>
            )}
            {society.isHighHiring && !isPrimary && !isSecondary && (
              <View style={styles.highHiringBadge}>
                <Sparkles size={9} color="#FFFFFF" />
                <Text style={styles.highHiringText}>🔥 {t('highHiringBadge', 'High Hiring')}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.distancePill}>
          <Text style={styles.distanceText}>{society.distance}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 3 Metrics Boxes */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>{t('metricLiveJobs', 'LIVE JOBS')}</Text>
          <View style={styles.metricValRow}>
            <Briefcase size={12} color="#1A73E8" />
            <Text style={styles.metricValBlue}>{society.activeJobsCount} {t('metricOpenings', 'Openings')}</Text>
          </View>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>{t('residentEmployers', 'RESIDENT EMPLOYERS')}</Text>
          <View style={styles.metricValRow}>
            <Home size={12} color="#64748B" />
            <Text style={styles.metricValDark}>{society.employersCount} {t('householdsCount', 'Households')}</Text>
          </View>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>{t('metricGateSecurity', 'GATE SECURITY')}</Text>
          <Text style={styles.metricValGreen} numberOfLines={1}>
            ✓ {(society.securityType || 'Verified').split(' ')[0]} {t('gateSuffix', 'Gate')}
          </Text>
        </View>
      </View>

      {/* Action Buttons Row */}
      {(onSelectPrimary || onToggleSecondary) && (
        <View style={styles.actionRow}>
          {onSelectPrimary && (
            <TouchableOpacity 
              style={[styles.primaryActionBtn, isPrimary && styles.primaryActionBtnActive]}
              onPress={() => onSelectPrimary(society)}
            >
              <Star size={12} color={isPrimary ? '#FFFFFF' : '#1A73E8'} fill={isPrimary ? '#FFFFFF' : 'none'} />
              <Text style={[styles.primaryActionBtnText, isPrimary && styles.primaryActionBtnTextActive]}>
                {isPrimary ? t('primaryWorkplaceActive', 'Primary Workplace ✓') : t('setAsPrimaryBtn', 'Set as Primary')}
              </Text>
            </TouchableOpacity>
          )}

          {onToggleSecondary && (
            <TouchableOpacity 
              style={[styles.secondaryActionBtn, isSecondary && styles.secondaryActionBtnActive]}
              onPress={() => onToggleSecondary(society)}
            >
              <CheckCircle2 size={12} color={isSecondary ? '#15803D' : '#64748B'} />
              <Text style={[styles.secondaryActionBtnText, isSecondary && styles.secondaryActionBtnTextActive]}>
                {isSecondary ? t('secondaryAddedBadge', 'Secondary Added ✓') : t('addSecondaryBtn', '+ Add Secondary')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPrimary: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
  },
  cardSecondary: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
  },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 42, height: 42 },
  mainCol: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  socName: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  localityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  localityText: { fontSize: 11, fontWeight: '600', color: '#64748B' },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  primaryBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryBadgeText: { fontSize: 9.5, fontWeight: '900', color: '#1A73E8' },
  secondaryBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  secondaryBadgeText: { fontSize: 9.5, fontWeight: '900', color: '#15803D' },
  highHiringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DC2626',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  highHiringText: { fontSize: 9.5, fontWeight: '900', color: '#FFFFFF' },

  distancePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  distanceText: { fontSize: 10, fontWeight: '800', color: '#475569' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },

  metricsGrid: { flexDirection: 'row', gap: 6 },
  metricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 8,
  },
  metricLabel: { fontSize: 8.5, fontWeight: '900', color: '#64748B', letterSpacing: 0.3 },
  metricValRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metricValBlue: { fontSize: 10.5, fontWeight: '900', color: '#1A73E8' },
  metricValDark: { fontSize: 10.5, fontWeight: '800', color: '#0F172A' },
  metricValGreen: { fontSize: 10.5, fontWeight: '900', color: '#15803D', marginTop: 2 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 8,
    borderRadius: 12,
  },
  primaryActionBtnActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  primaryActionBtnText: { fontSize: 11, fontWeight: '900', color: '#1A73E8' },
  primaryActionBtnTextActive: { color: '#FFFFFF' },

  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 8,
    borderRadius: 12,
  },
  secondaryActionBtnActive: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  secondaryActionBtnText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  secondaryActionBtnTextActive: { color: '#15803D', fontWeight: '900' },
});
