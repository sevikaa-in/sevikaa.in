import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { 
  ShieldCheck, MapPin, Clock, Check, Eye, CheckCircle2, Lock, Send, ChevronRight 
} from 'lucide-react-native';
import { useMobileLanguage } from '../context/LanguageContext';

export interface MobileJobCardProps {
  job: any;
  hasApplied?: boolean;
  isWorkerVerified?: boolean;
  onApply?: (job: any) => void;
  onViewDetails?: (job: any) => void;
  isApplying?: boolean;
}

export const JobCard: React.FC<MobileJobCardProps> = ({
  job,
  hasApplied = false,
  isWorkerVerified = true,
  onApply,
  onViewDetails,
  isApplying = false
}) => {
  const { t } = useMobileLanguage();
  const cleanSalary = job.salary_offered || job.salary 
    ? Number(job.salary_offered || job.salary).toLocaleString('en-IN') 
    : '15,000';

  const employerInitial = (job.employer_name || job.society_name || 'H')[0].toUpperCase();
  const getTranslatedTitle = (j: any) => {
    if (!j) return t('titleHousekeeping', 'Full Day Housekeeping & Deep Cleaning');
    if (j.id === 'c9bf0b7b-3b02-44e1-a20d-70498b8c2d1b') return t('titleHousekeeping', 'Full Day Housekeeping & Deep Cleaning');
    if (j.id === 'd78a9e4f-8f12-4c22-921a-5b12847a98b1') return t('titleCook', 'North & South Indian Family Cook');
    if (j.id === 'e412a89c-1120-4e55-901b-1b918a204910') return t('titleNanny', 'Toddler Nanny & Infant Caregiver');
    
    const titleLower = String(j.title || '').toLowerCase();
    if (titleLower.includes('cook')) return t('titleCook', j.title);
    if (titleLower.includes('maid') || titleLower.includes('housekeeping')) return t('titleHousekeeping', j.title);
    if (titleLower.includes('nanny') || titleLower.includes('child')) return t('titleNanny', j.title);
    return j.title || 'Domestic Worker Job';
  };

  const getTranslatedDesc = (j: any) => {
    if (!j) return t('descHousekeeping', 'Looking for an experienced domestic helper.');
    if (j.id === 'c9bf0b7b-3b02-44e1-a20d-70498b8c2d1b') return t('descHousekeeping', 'Looking for an experienced and reliable maid for daily dusting, mopping, utensil washing, and laundry for our family in a 3BHK flat.');
    if (j.id === 'd78a9e4f-8f12-4c22-921a-5b12847a98b1') return t('descCook', 'Family of 4 needs an experienced home cook for North Indian thali (roti, sabzi, dal, rice) and South Indian breakfast preparation.');
    if (j.id === 'e412a89c-1120-4e55-901b-1b918a204910') return t('descNanny', 'Loving and attentive nanny needed to take care of an 18-month-old baby boy. Responsibilities include feeding, playtime, reading stories, and hygiene.');

    if (j.description && j.description.trim().length > 25) return j.description;
    const titleStr = getTranslatedTitle(j);
    return `${titleStr}: ${j.description || 'Household work required'}.`;
  };

  const getTranslatedShift = (shift: string) => {
    if (!shift) return '';
    if (shift.includes('8:00 AM') || shift.includes('8 AM')) return t('shiftFullDay84', 'Full Day (8:00 AM – 4:00 PM)');
    if (shift.includes('9:00 AM') || shift.includes('9 AM')) return t('shiftFullDay96', 'Full Day (9:00 AM – 6:00 PM)');
    if (shift.includes('Split Shift')) return t('shiftSplit710', 'Split Shift (7–10 AM & 5–8 PM)');
    if (shift.includes('10 Hours')) return t('shift10Hours', '10 Hours (8:00 AM – 6:00 PM)');
    return shift;
  };

  const getTranslatedPerk = (perk: string) => {
    if (!perk) return '';
    if (perk.includes('Meals Included')) return t('perkMealsOnDuty', 'Meals Included on Duty');
    if (perk.includes('Tea')) return t('perkTeaSnacks', 'Tea & Morning Snacks');
    if (perk.includes('Sunday Off')) return t('perkSundayOff', 'Sunday Off');
    if (perk.includes('Diwali Bonus')) return t('perkDiwaliBonus', 'Diwali Bonus');
    if (perk.includes('Festival Bonus')) return t('perkFestivalBonus', 'Festival Bonus');
    if (perk.includes('Annual')) return t('perkAnnualRevision', 'Annual Salary Revision');
    if (perk.includes('Lunch')) return t('perkLunchProvided', 'Lunch Provided');
    if (perk.includes('Leaves')) return t('perkPaidLeaves', 'Paid Annual Leaves');
    if (perk.includes('Overtime')) return t('perkOvertimePay', 'Overtime Pay Allowance');
    if (perk.includes('Uniform')) return t('perkUniform', 'Uniform Allowance Provided');
    return perk;
  };

  const titleStr = getTranslatedTitle(job);
  const descStr = getTranslatedDesc(job);

  return (
    <View style={styles.cardContainer}>
      
      {/* 1. Employer & Salary Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.employerInfoLeft}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{employerInitial}</Text>
          </View>
          <View style={styles.employerTextCol}>
            <Text style={styles.employerName} numberOfLines={1}>
              {job.employer_name || t('verifiedHousehold', 'Verified Household')}
            </Text>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={11} color="#16A34A" />
              <Text style={styles.verifiedText}>{t('verifiedHouseholdBadge', 'Sevikaa Verified Household')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.salaryPill}>
          <Text style={styles.salaryText}>₹{cleanSalary} / {t('perMonth', 'mo')}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 2. Job Title & Society Location */}
      <View style={styles.titleSection}>
        <Text style={styles.jobTitle}>{titleStr}</Text>
        <View style={styles.locationPill}>
          <MapPin size={13} color="#1A73E8" />
          <Text style={styles.locationText} numberOfLines={1}>
            {job.society_name || job.locality || t('residentialSociety', 'Residential Society')}
          </Text>
        </View>
      </View>

      {/* 3. Description Box */}
      <View style={styles.descBox}>
        <Text style={styles.descText} numberOfLines={3}>
          {descStr}
        </Text>
      </View>

      {/* 4. Shift & Perks Badges */}
      <View style={styles.tagsRow}>
        {job.shift_hours && (
          <View style={styles.shiftTag}>
            <Clock size={11} color="#4338CA" />
            <Text style={styles.shiftTagText}>{getTranslatedShift(job.shift_hours)}</Text>
          </View>
        )}
        {Array.isArray(job.perks) && job.perks.map((perk: string, idx: number) => (
          <View key={idx} style={styles.perkTag}>
            <Check size={11} color="#15803D" />
            <Text style={styles.perkTagText}>{getTranslatedPerk(perk)}</Text>
          </View>
        ))}
      </View>

      {/* 5. Bottom Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.viewDetailsBtn}
          onPress={() => onViewDetails && onViewDetails(job)}
        >
          <Eye size={14} color="#475569" />
          <Text style={styles.viewDetailsBtnText}>{t('viewDetailsBtn', 'View Details')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.applyBtn,
            hasApplied && styles.applyBtnApplied,
            !isWorkerVerified && styles.applyBtnDisabled
          ]}
          disabled={hasApplied || !isWorkerVerified || isApplying}
          onPress={() => onApply && onApply(job)}
        >
          {hasApplied ? (
            <>
              <CheckCircle2 size={14} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>{t('appliedBadge', 'Applied ✓')}</Text>
            </>
          ) : !isWorkerVerified ? (
            <>
              <Lock size={13} color="#78350F" />
              <Text style={styles.applyBtnPendingText}>{t('pendingAuditBadge', 'Pending Audit')}</Text>
            </>
          ) : (
            <>
              <Send size={13} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>
                {isApplying ? t('applyingState', 'Applying...') : t('oneClickApplyBtn', '1-Click Apply')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  employerInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  employerTextCol: {
    flex: 1,
  },
  employerName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
  },
  salaryPill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  salaryText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#15803D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  titleSection: {
    marginBottom: 10,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  descBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  descText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 17,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  shiftTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shiftTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  perkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  perkTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewDetailsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    borderRadius: 12,
  },
  applyBtnApplied: {
    backgroundColor: '#16A34A',
  },
  applyBtnDisabled: {
    backgroundColor: '#FCD34D',
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  applyBtnPendingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#78350F',
  },
});
