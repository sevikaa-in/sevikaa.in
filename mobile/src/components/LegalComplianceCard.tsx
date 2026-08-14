import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ShieldCheck, ChevronRight } from 'lucide-react-native';

interface LegalComplianceCardProps {
  onPress: () => void;
  style?: any;
}

export const LegalComplianceCard: React.FC<LegalComplianceCardProps> = ({ onPress, style }) => {
  return (
    <View style={[styles.cardContainer, style]}>
      <TouchableOpacity 
        style={styles.cardTouch}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.leftCol}>
          <View style={styles.iconBox}>
            <ShieldCheck size={20} color="#1A73E8" />
          </View>
          <View style={styles.textWrap}>
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>Legal, Privacy &amp; Terms Center</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
              </View>
            </View>
            <Text style={styles.subtitleText}>
              Privacy Policy, Terms of Service, Refund Policy &amp; Disclosures
            </Text>
          </View>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
  },
  cardTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#15803D',
  },
  subtitleText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
});
