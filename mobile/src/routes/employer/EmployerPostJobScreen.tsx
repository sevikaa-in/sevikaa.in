import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Alert 
} from 'react-native';
import { 
  PlusCircle, Sparkles, MapPin, IndianRupee, Briefcase, 
  Clock, ShieldCheck, CheckCircle2, Home, Users, Lock, Check, Utensils, HeartHandshake, ShieldAlert
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useMobileLanguage } from '../../context/LanguageContext';
import { useUserProfile } from '../../context/UserProfileContext';

export const EmployerPostJobScreen: React.FC<{ 
  user?: any;
  onPostSuccess?: () => void;
  onSuccess?: () => void;
  onNavigateToInvite?: (job: any) => void;
}> = ({ user, onPostSuccess, onSuccess, onNavigateToInvite }) => {
  const { t } = useMobileLanguage();
  const { user: ctxUser, profile, employerProfile } = useUserProfile();
  const activeUser = ctxUser || user;

  // Verification Gate Check: Employer must be verified live/approved
  const isEmployerVerified = employerProfile?.status === 'live' || employerProfile?.status === 'approved' || profile?.status === 'live' || profile?.status === 'approved';

  // Step 1: Category
  const [category, setCategory] = useState<'cook' | 'maid' | 'nanny'>('cook');

  // Step 2: Position & Compensation
  const [title, setTitle] = useState('Experienced North & South Indian Cook');
  const [society, setSociety] = useState(employerProfile?.society_name || profile?.society || 'Adarsh Palm Retreat, Bellandur');
  const [salary, setSalary] = useState('15000');
  const [dietaryPref, setDietaryPref] = useState('Both Veg & Non-Veg');
  const [flatType, setFlatType] = useState('3BHK Apartment');
  const [familyMembers, setFamilyMembers] = useState('4 Members (2 Adults, 2 Kids)');
  const [careNeeds, setCareNeeds] = useState('No Special Senior / Infant Care Required');

  // Perks Selection
  const [selectedPerks, setSelectedPerks] = useState<string[]>([
    'Meals Included on Duty', 
    'Tea & Snacks Provided', 
    'Sunday Off', 
    'Diwali Bonus'
  ]);

  // Requirements Selection
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([
    'Aadhaar Verification Mandatory',
    '2+ Years Experience in Gated Societies',
    'Local Reference & Police Clearance'
  ]);

  const [description, setDescription] = useState('');

  // Step 3: Leave & Deductions
  const [leavePolicy, setLeavePolicy] = useState('4 Sundays Off + 1 Paid Leave (Recommended)');
  const [deductionPolicy, setDeductionPolicy] = useState('Pro-rata Daily Rate (Salary ÷ 30)');

  // Step 4: Schedule Shift Slot
  const [selectedShiftSlot, setSelectedShiftSlot] = useState('fullday');
  const [shiftHours, setShiftHours] = useState('Full Day (8:00 AM – 4:00 PM)');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePerk = (perk: string) => {
    setSelectedPerks(prev => 
      prev.includes(perk) ? prev.filter(p => p !== perk) : [...prev, perk]
    );
  };

  const toggleRequirement = (req: string) => {
    setSelectedRequirements(prev => 
      prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req]
    );
  };

  const handleSelectCategory = (catId: 'cook' | 'maid' | 'nanny') => {
    setCategory(catId);
    if (catId === 'cook') setTitle('Experienced North & South Indian Cook');
    else if (catId === 'maid') setTitle('Full Day Housekeeping & Deep Cleaning Maid');
    else if (catId === 'nanny') setTitle('Toddler Nanny & Childcare Specialist');
  };

  const handleSelectShift = (slotId: string, hoursText: string) => {
    setSelectedShiftSlot(slotId);
    setShiftHours(hoursText);
  };

  const handleSubmitPost = async () => {
    if (!isEmployerVerified) {
      Alert.alert(
        t('employerIdVerificationRequired', 'Employer ID Verification Required'),
        t('employerVerificationRequiredMsg', 'You must upload your Aadhaar Card and a live selfie in Account Settings → Identity Verification before posting job requisitions.')
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert(t('jobRequiredAlert', 'Required Field'), t('jobRequiredAlertMsg', 'Please enter a job title for your requisition.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const targetUserId = activeUser?.id || user?.id;
      if (targetUserId) {
        await supabase.from('jobs').insert([{
          employer_id: targetUserId,
          employer_name: employerProfile?.company_name || profile?.full_name || activeUser?.full_name || activeUser?.phone || 'Employer Household',
          title: title.trim(),
          category: category,
          salary_offered: Number(salary) || 15000,
          society_name: society,
          shift_hours: shiftHours,
          flat_type: flatType,
          family_members: familyMembers,
          dietary_pref: dietaryPref,
          perks: selectedPerks,
          qualifications: selectedRequirements,
          leave_policy: leavePolicy,
          deduction_policy: deductionPolicy,
          description: description.trim() || 'Daily household work required.',
          status: 'pending', // Sent for Admin Audit
          created_at: new Date().toISOString()
        }]);
      }
    } catch (err) {
      console.warn("Post job error notice:", err);
    }
    setIsSubmitting(false);
    Alert.alert(
      t('requisitionSubmittedTitle', 'Requisition Submitted! ⏳'),
      t('requisitionSubmittedMsg', 'Your job requisition has been submitted and is currently pending Sevikaa Admin Audit. It will unlock for candidate applications upon approval.')
    );
    if (onSuccess) onSuccess();
    else if (onPostSuccess) onPostSuccess();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* 1. PAGE HEADER BANNER */}
      <View style={styles.headerCard}>
        <View style={styles.eyebrowPillBlue}>
          <Sparkles size={11} color="#1A73E8" />
          <Text style={styles.eyebrowTextBlue}>{t('householdEmployerHiringPortal', 'HOUSEHOLD EMPLOYER HIRING PORTAL')}</Text>
        </View>

        <Text style={styles.pageTitle}>{t('createJobRequisition', 'Create Job Requisition')}</Text>
        <Text style={styles.pageSub}>
          {t('specifyRequirementsSub', 'Specify your household requirements and reach Aadhaar-verified domestic helpers in your society.')}
        </Text>
      </View>

      {/* 2. LOCK WARNING BANNER (If Employer ID Verification Pending) */}
      {!isEmployerVerified && (
        <View style={styles.lockWarningCard}>
          <View style={styles.lockIconBox}>
            <Lock size={22} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.lockTitleRow}>
              <View style={styles.formInactiveTag}>
                <Text style={styles.formInactiveText}>{t('formInactive', 'FORM INACTIVE')}</Text>
              </View>
              <Text style={styles.lockTitle}>{t('employerIdVerificationRequired', 'Employer ID Verification Required')}</Text>
            </View>
            <Text style={styles.lockSubText}>
              {t('employerVerificationRequiredMsg', 'You must upload your Aadhaar Card and a live selfie in Account Settings → Identity Verification before posting job requisitions. This prevents fraudulent listings and protects domestic workers.')}
            </Text>
            <Text style={styles.lockStatusFoot}>
              ✦ {t('statusTag', 'Status:')} <Text style={styles.statusMono}>PENDING_REVIEW</Text> • {t('unlocksUponAdminApproval', 'Unlocks upon admin approval')}
            </Text>
          </View>
        </View>
      )}

      {/* STEP 1 OF 4: SELECT DOMESTIC HELP CATEGORY */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeaderRow}>
          <View style={styles.stepBadgeCircle}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={styles.stepTitle}>{t('selectDomesticHelpCategory', 'SELECT DOMESTIC HELP CATEGORY')}</Text>
          <Text style={styles.stepCounter}>{t('step1of4', 'Step 1 of 4')}</Text>
        </View>

        <View style={styles.categoryGrid}>
          {/* Category Card 1: Cook */}
          <TouchableOpacity 
            style={[styles.categoryCard, category === 'cook' && styles.categoryCardSelected]}
            onPress={() => handleSelectCategory('cook')}
          >
            {category === 'cook' && (
              <View style={styles.selectedCheckCircle}>
                <Check size={10} color="#1A73E8" />
              </View>
            )}
            <Text style={styles.categoryEmoji}>🍳</Text>
            <Text style={styles.categoryCardTitle}>{t('cookChefTitle', 'Cook / Chef')}</Text>
            <Text style={styles.categoryCardSub}>{t('cookChefSub', 'Meal Prep & Kitchen Care')}</Text>
          </TouchableOpacity>

          {/* Category Card 2: Maid */}
          <TouchableOpacity 
            style={[styles.categoryCard, category === 'maid' && styles.categoryCardSelected]}
            onPress={() => handleSelectCategory('maid')}
          >
            {category === 'maid' && (
              <View style={styles.selectedCheckCircle}>
                <Check size={10} color="#1A73E8" />
              </View>
            )}
            <Text style={styles.categoryEmoji}>🧹</Text>
            <Text style={styles.categoryCardTitle}>{t('maidHousekeeperTitle', 'Maid / Housekeeper')}</Text>
            <Text style={styles.categoryCardSub}>{t('maidHousekeeperSub', 'Cleaning & Housekeeping')}</Text>
          </TouchableOpacity>

          {/* Category Card 3: Nanny */}
          <TouchableOpacity 
            style={[styles.categoryCard, category === 'nanny' && styles.categoryCardSelected]}
            onPress={() => handleSelectCategory('nanny')}
          >
            {category === 'nanny' && (
              <View style={styles.selectedCheckCircle}>
                <Check size={10} color="#1A73E8" />
              </View>
            )}
            <Text style={styles.categoryEmoji}>👶</Text>
            <Text style={styles.categoryCardTitle}>{t('nannyChildcareTitle', 'Nanny / Childcare')}</Text>
            <Text style={styles.categoryCardSub}>{t('nannyChildcareSub', 'Infant & Toddler Care')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* STEP 2 OF 4: POSITION HEADLINE & MONTHLY COMPENSATION */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeaderRow}>
          <View style={styles.stepBadgeCircle}>
            <Text style={styles.stepBadgeText}>2</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{t('positionHeadlineCompensation', 'POSITION HEADLINE & MONTHLY COMPENSATION')}</Text>
          </View>
          <Text style={styles.stepCounter}>{t('step2of4', 'Step 2 of 4')}</Text>
        </View>

        {/* Job Title */}
        <Text style={styles.fieldLabel}>{t('jobHeadlineTitleLabel', 'JOB HEADLINE TITLE')}</Text>
        <TextInput 
          style={styles.textInput}
          placeholder="e.g. Experienced North & South Indian Cook"
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        {/* Society Location */}
        <Text style={styles.fieldLabel}>{t('gatedSocietyLocationLabel', 'GATED SOCIETY / LOCATION NAME')}</Text>
        <TextInput 
          style={styles.textInput}
          placeholder="Adarsh Palm Retreat, Bellandur"
          placeholderTextColor="#94A3B8"
          value={society}
          onChangeText={setSociety}
        />

        {/* Offered Salary & Dietary Pref */}
        <View style={styles.twoColRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>{t('monthlyOfferedSalaryLabel', 'OFFERED SALARY (₹)')}</Text>
            <View style={styles.salaryInputWrap}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput 
                style={styles.salaryInput}
                keyboardType="numeric"
                value={salary}
                onChangeText={setSalary}
              />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>{t('dietaryFoodPrefLabel', 'DIETARY PREFERENCE')}</Text>
            <View style={styles.selectorPillsCol}>
              {['Both Veg & Non-Veg', 'Vegetarian Only'].map(opt => (
                <TouchableOpacity 
                  key={opt}
                  style={[styles.smallPillOpt, dietaryPref === opt && styles.smallPillOptSelected]}
                  onPress={() => setDietaryPref(opt)}
                >
                  <Text style={[styles.smallPillOptText, dietaryPref === opt && styles.smallPillOptTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Flat Type & Family Members */}
        <View style={styles.twoColRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>{t('flatResidenceTypeLabel', 'RESIDENCE TYPE')}</Text>
            <View style={styles.selectorPillsCol}>
              {['3BHK Apartment', '2BHK Apartment', '4BHK+ Villa'].map(opt => (
                <TouchableOpacity 
                  key={opt}
                  style={[styles.smallPillOpt, flatType === opt && styles.smallPillOptSelected]}
                  onPress={() => setFlatType(opt)}
                >
                  <Text style={[styles.smallPillOptText, flatType === opt && styles.smallPillOptTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>{t('totalFamilyMembersLabel', 'FAMILY MEMBERS')}</Text>
            <View style={styles.selectorPillsCol}>
              {['4 Members (2 Adults, 2 Kids)', '2 Members (Couple)', '5+ Members'].map(opt => (
                <TouchableOpacity 
                  key={opt}
                  style={[styles.smallPillOpt, familyMembers === opt && styles.smallPillOptSelected]}
                  onPress={() => setFamilyMembers(opt)}
                >
                  <Text style={[styles.smallPillOptText, familyMembers === opt && styles.smallPillOptTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Special Care Needs */}
        <Text style={styles.fieldLabel}>{t('infantElderlyCareLabel', 'INFANT / ELDERLY SPECIAL CARE NEEDS')}</Text>
        <View style={{ gap: 6 }}>
          {[
            'No Special Senior / Infant Care Required',
            'Infant Care Required (0-3 Yrs)',
            'Elderly / Senior Care Required'
          ].map(opt => (
            <TouchableOpacity 
              key={opt}
              style={[styles.pillBarOpt, careNeeds === opt && styles.pillBarOptSelected]}
              onPress={() => setCareNeeds(opt)}
            >
              <Text style={[styles.pillBarOptText, careNeeds === opt && styles.pillBarOptTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Perks & Allowances Selection Chips */}
        <Text style={styles.fieldLabel}>{t('perksAllowancesOfferedLabel', 'PERKS & ALLOWANCES OFFERED')}</Text>
        <View style={styles.chipsWrap}>
          {[
            'Meals Included on Duty', 
            'Tea & Snacks Provided', 
            'Sunday Off', 
            'Diwali Bonus',
            'Festival Bonus',
            'Uniform Allowance Provided',
            'Overtime Pay Allowance'
          ].map(perk => {
            const isSel = selectedPerks.includes(perk);
            return (
              <TouchableOpacity 
                key={perk}
                style={[styles.chipItem, isSel && styles.chipItemGreen]}
                onPress={() => togglePerk(perk)}
              >
                {isSel && <Check size={11} color="#15803D" />}
                <Text style={[styles.chipText, isSel && styles.chipTextGreen]}>{perk}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Candidate Requirements Selection Chips */}
        <Text style={styles.fieldLabel}>{t('candidatePrerequisitesLabel', 'CANDIDATE PREREQUISITES & REQUIREMENTS')}</Text>
        <View style={styles.chipsWrap}>
          {[
            'Aadhaar Verification Mandatory',
            '2+ Years Experience in Gated Societies',
            'Local Reference & Police Clearance',
            'Non-Smoker & Hygienic Work Habits',
            'Punctual & Honest'
          ].map(req => {
            const isSel = selectedRequirements.includes(req);
            return (
              <TouchableOpacity 
                key={req}
                style={[styles.chipItem, isSel && styles.chipItemBlue]}
                onPress={() => toggleRequirement(req)}
              >
                {isSel && <Check size={11} color="#1A73E8" />}
                <Text style={[styles.chipText, isSel && styles.chipTextBlue]}>{req}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Detailed Scope of Work */}
        <Text style={styles.fieldLabel}>{t('detailedScopeOfWorkLabel', 'DETAILED SCOPE OF WORK & INSTRUCTIONS')}</Text>
        <TextInput 
          style={[styles.textInput, { height: 84, textAlignVertical: 'top' }]}
          placeholder="Specify duties, household preferences, meal requirements, or infant care instructions..."
          placeholderTextColor="#94A3B8"
          multiline
          value={description}
          onChangeText={setDescription}
        />

      </View>

      {/* STEP 3 OF 4: LEAVE ENTITLEMENTS & DAILY DEDUCTION TERMS */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeaderRow}>
          <View style={styles.stepBadgeCircle}>
            <Text style={styles.stepBadgeText}>3</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{t('leaveEntitlementsDeductionTerms', 'LEAVE ENTITLEMENTS & DEDUCTION TERMS')}</Text>
          </View>
          <Text style={styles.stepCounter}>{t('step3of4', 'Step 3 of 4')}</Text>
        </View>

        <Text style={styles.fieldLabel}>{t('monthlyLeaveEntitlementLabel', 'MONTHLY LEAVE ENTITLEMENT')}</Text>
        <View style={{ gap: 6, marginBottom: 12 }}>
          {[
            '4 Sundays Off + 1 Paid Leave (Recommended)',
            '4 Sundays Off Only',
            '2 Sundays Off per Month'
          ].map(opt => (
            <TouchableOpacity 
              key={opt}
              style={[styles.pillBarOpt, leavePolicy === opt && styles.pillBarOptSelected]}
              onPress={() => setLeavePolicy(opt)}
            >
              <Text style={[styles.pillBarOptText, leavePolicy === opt && styles.pillBarOptTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>{t('unannouncedAbsenceDeductionLabel', 'UNANNOUNCED ABSENCE DEDUCTION POLICY')}</Text>
        <View style={{ gap: 6 }}>
          {[
            'Pro-rata Daily Rate (Salary ÷ 30)',
            'No Salary Deduction',
            'Double Daily Rate Deduction'
          ].map(opt => (
            <TouchableOpacity 
              key={opt}
              style={[styles.pillBarOpt, deductionPolicy === opt && styles.pillBarOptSelected]}
              onPress={() => setDeductionPolicy(opt)}
            >
              <Text style={[styles.pillBarOptText, deductionPolicy === opt && styles.pillBarOptTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* STEP 4 OF 4: WEEKLY WORK SCHEDULE SLOTS */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeaderRow}>
          <View style={styles.stepBadgeCircle}>
            <Text style={styles.stepBadgeText}>4</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{t('weeklyWorkScheduleSlots', 'WEEKLY WORK SCHEDULE SLOTS')}</Text>
          </View>
          <Text style={styles.stepCounter}>{t('step4of4', 'Step 4 of 4')}</Text>
        </View>

        <Text style={styles.stepSubDescription}>
          {t('selectShiftTimingSub', 'Select the shift timing slot required for your household. Domestic helpers will view this schedule when applying.')}
        </Text>

        <View style={styles.shiftSlotsGrid}>
          
          {/* Shift Slot 1: Morning */}
          <TouchableOpacity 
            style={[styles.shiftCard, selectedShiftSlot === 'morning' && styles.shiftCardSelected]}
            onPress={() => handleSelectShift('morning', 'Morning Shift (7:00 AM – 12:00 PM)')}
          >
            {selectedShiftSlot === 'morning' && (
              <View style={styles.selectedCheckCircle}>
                <Check size={10} color="#1A73E8" />
              </View>
            )}
            <Text style={styles.shiftEmoji}>🌅</Text>
            <Text style={styles.shiftTitle}>Morning Shift</Text>
            <Text style={styles.shiftTime}>7:00 AM – 12:00 PM</Text>
            <Text style={styles.shiftDesc}>Morning cooking breakfast, house cleaning &amp; dishwashing</Text>
          </TouchableOpacity>

          {/* Shift Slot 2: Full Day */}
          <TouchableOpacity 
            style={[styles.shiftCard, selectedShiftSlot === 'fullday' && styles.shiftCardSelected]}
            onPress={() => handleSelectShift('fullday', 'Full Day (8:00 AM – 4:00 PM)')}
          >
            {selectedShiftSlot === 'fullday' && (
              <View style={styles.selectedCheckCircle}>
                <Check size={10} color="#1A73E8" />
              </View>
            )}
            <Text style={styles.shiftEmoji}>☀️</Text>
            <Text style={styles.shiftTitle}>Full Day Shift</Text>
            <Text style={styles.shiftTime}>8:00 AM – 4:00 PM</Text>
            <Text style={styles.shiftDesc}>Standard 8-hour shift for cooking, childcare &amp; deep cleaning</Text>
          </TouchableOpacity>

          {/* Shift Slot 3: Split Shift */}
          <TouchableOpacity 
            style={[styles.shiftCard, selectedShiftSlot === 'split' && styles.shiftCardSelected]}
            onPress={() => handleSelectShift('split', 'Split Shift (7–10 AM & 6–9 PM)')}
          >
            {selectedShiftSlot === 'split' && (
              <View style={styles.selectedCheckCircle}>
                <Check size={10} color="#1A73E8" />
              </View>
            )}
            <Text style={styles.shiftEmoji}>⚡</Text>
            <Text style={styles.shiftTitle}>Split Shift (Cook/Maid)</Text>
            <Text style={styles.shiftTime}>7:00–10:00 AM &amp; 6:00–9:00 PM</Text>
            <Text style={styles.shiftDesc}>Morning breakfast + Evening dinner prep double slot</Text>
          </TouchableOpacity>

          {/* Shift Slot 4: Evening Shift */}
          <TouchableOpacity 
            style={[styles.shiftCard, selectedShiftSlot === 'evening' && styles.shiftCardSelected]}
            onPress={() => handleSelectShift('evening', 'Evening Shift (4:00 PM – 9:00 PM)')}
          >
            {selectedShiftSlot === 'evening' && (
              <View style={styles.selectedCheckCircle}>
                <Check size={10} color="#1A73E8" />
              </View>
            )}
            <Text style={styles.shiftEmoji}>🌆</Text>
            <Text style={styles.shiftTitle}>Evening Shift</Text>
            <Text style={styles.shiftTime}>4:00 PM – 9:00 PM</Text>
            <Text style={styles.shiftDesc}>Evening dinner preparation &amp; kitchen cleanup</Text>
          </TouchableOpacity>

          {/* Shift Slot 5: 24x7 Live-In */}
          <TouchableOpacity 
            style={[styles.shiftCard, selectedShiftSlot === 'livein' && styles.shiftCardSelected]}
            onPress={() => handleSelectShift('livein', '24x7 Live-In Resident Help')}
          >
            {selectedShiftSlot === 'livein' && (
              <View style={styles.selectedCheckCircle}>
                <Check size={10} color="#1A73E8" />
              </View>
            )}
            <Text style={styles.shiftEmoji}>🏠</Text>
            <Text style={styles.shiftTitle}>24x7 Live-In Help</Text>
            <Text style={styles.shiftTime}>24-Hour Resident</Text>
            <Text style={styles.shiftDesc}>Full-time resident helper with private room &amp; meals included</Text>
          </TouchableOpacity>

          {/* Shift Slot 6: Flexible / Custom */}
          <TouchableOpacity 
            style={[styles.shiftCard, selectedShiftSlot === 'custom' && styles.shiftCardSelected]}
            onPress={() => handleSelectShift('custom', 'Flexible / Custom Working Hours')}
          >
            {selectedShiftSlot === 'custom' && (
              <View style={styles.selectedCheckCircle}>
                <Check size={10} color="#1A73E8" />
              </View>
            )}
            <Text style={styles.shiftEmoji}>⏱️</Text>
            <Text style={styles.shiftTitle}>Flexible / Custom</Text>
            <Text style={styles.shiftTime}>Part-Time / On-Demand</Text>
            <Text style={styles.shiftDesc}>Custom working hours arranged mutually</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* 5. SUBMIT PUBLISH BUTTON */}
      <TouchableOpacity 
        style={[
          styles.submitBtn,
          (!isEmployerVerified || isSubmitting) && styles.submitBtnDisabled
        ]}
        onPress={handleSubmitPost}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : !isEmployerVerified ? (
          <>
            <Lock size={16} color="#64748B" />
            <Text style={styles.submitBtnTextDisabled}>
              {t('publishLockedVerificationPendingBtn', '🔒 Post Locked — Identity Verification Pending')}
            </Text>
          </>
        ) : (
          <>
            <PlusCircle size={16} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>
              {t('publishJobRequisitionBtn', 'Publish Job Requisition for Admin Audit')}
            </Text>
          </>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },

  // HEADER CARD
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  eyebrowPillBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  eyebrowTextBlue: { fontSize: 10, fontWeight: '900', color: '#1A73E8', letterSpacing: 0.5 },
  pageTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.3, marginBottom: 6 },
  pageSub: { fontSize: 12.5, fontWeight: '600', color: '#64748B', lineHeight: 18 },

  // LOCK WARNING CARD
  lockWarningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  lockIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  formInactiveTag: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  formInactiveText: { fontSize: 9.5, fontWeight: '900', color: '#92400E' },
  lockTitle: { fontSize: 13, fontWeight: '900', color: '#78350F' },
  lockSubText: { fontSize: 11.5, fontWeight: '600', color: '#B45309', lineHeight: 17, marginBottom: 6 },
  lockStatusFoot: { fontSize: 10.5, fontWeight: '700', color: '#92400E' },
  statusMono: { fontWeight: '900', color: '#78350F' },

  // STEP CARDS
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  stepHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  stepBadgeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
  stepTitle: { fontSize: 11, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
  stepCounter: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
  stepSubDescription: { fontSize: 11.5, fontWeight: '600', color: '#64748B', lineHeight: 17, marginBottom: 14 },

  // STEP 1 CATEGORIES
  categoryGrid: { flexDirection: 'row', gap: 8 },
  categoryCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  categoryCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1A73E8',
  },
  selectedCheckCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: { fontSize: 24, marginBottom: 6 },
  categoryCardTitle: { fontSize: 11.5, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginBottom: 2 },
  categoryCardSub: { fontSize: 9.5, fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: 12 },

  // STEP 2 INPUTS & PILLS
  fieldLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  twoColRow: { flexDirection: 'row', gap: 10 },
  salaryInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  rupeePrefix: { fontSize: 14, fontWeight: '900', color: '#15803D', marginRight: 4 },
  salaryInput: { flex: 1, paddingVertical: 10, fontSize: 14, fontWeight: '900', color: '#0F172A' },

  selectorPillsCol: { gap: 4 },
  smallPillOpt: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  smallPillOptSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1A73E8',
  },
  smallPillOptText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  smallPillOptTextSelected: { color: '#1A73E8', fontWeight: '900' },

  pillBarOpt: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pillBarOptSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1A73E8',
  },
  pillBarOptText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  pillBarOptTextSelected: { color: '#1A73E8', fontWeight: '900' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chipItemGreen: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  chipItemBlue: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  chipText: { fontSize: 10.5, fontWeight: '700', color: '#64748B' },
  chipTextGreen: { color: '#15803D', fontWeight: '900' },
  chipTextBlue: { color: '#1A73E8', fontWeight: '900' },

  // STEP 4 SHIFT CARDS
  shiftSlotsGrid: { gap: 8 },
  shiftCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 12,
    position: 'relative',
  },
  shiftCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1A73E8',
  },
  shiftEmoji: { fontSize: 18, marginBottom: 4 },
  shiftTitle: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  shiftTime: { fontSize: 11.5, fontWeight: '900', color: '#1A73E8', marginTop: 2, marginBottom: 4 },
  shiftDesc: { fontSize: 10.5, fontWeight: '600', color: '#64748B', lineHeight: 14 },

  // SUBMIT BUTTON
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A73E8',
    paddingVertical: 15,
    borderRadius: 18,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  submitBtnTextDisabled: { fontSize: 12, fontWeight: '900', color: '#64748B' },
});
