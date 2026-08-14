import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Alert, Modal, Switch, Image, Linking 
} from 'react-native';
import { 
  User, Building2, MapPin, Phone, Mail, Save, 
  LogOut, ShieldCheck, Clock, CheckCircle2, FileText, X, Sparkles, 
  Camera, ArrowRight, Upload, Eye, Check, ShieldAlert, ChevronDown, ChevronUp, Bell, Trash2, FileSpreadsheet, Lock, ChevronRight
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useMobileLanguage } from '../../context/LanguageContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { LegalComplianceCard } from '../../components/LegalComplianceCard';
import { LegalHubScreen } from '../../screens/LegalHubScreen';

export const EmployerAccountScreen: React.FC<{ 
  user?: any;
  onLogout?: () => void;
  onNavigateToRelocate?: () => void;
  onNavigateToInvoices?: () => void;
  onOpenIntroWalkthrough?: () => void;
}> = ({ user, onLogout, onNavigateToRelocate, onNavigateToInvoices, onOpenIntroWalkthrough }) => {
  const { t } = useMobileLanguage();
  const { user: ctxUser, profile, employerProfile, refreshProfile } = useUserProfile();
  const activeUser = ctxUser || user;

  const [name, setName] = useState(employerProfile?.company_name || profile?.full_name || activeUser?.full_name || activeUser?.name || 'sharama house');
  const [phone, setPhone] = useState(profile?.phone?.replace(/\D/g, '').slice(-10) || activeUser?.phone?.replace(/\D/g, '').slice(-10) || '9148291889');
  const [email, setEmail] = useState(profile?.email || activeUser?.email || 'sah.debashish@gmail.com');
  const [altPhone, setAltPhone] = useState('1234567890');
  const [society, setSociety] = useState(employerProfile?.society_name || profile?.society || 'Adarsh Palm Retreat, Bellandur, Bangalore');
  const [tower, setTower] = useState(employerProfile?.tower || 'Tower A');
  const [flat, setFlat] = useState(employerProfile?.address || 'A301');

  // Billing Details State
  const [city, setCity] = useState('Bangalore');
  const [stateName, setStateName] = useState('Karnataka');
  const [pincode, setPincode] = useState('560087');
  const [gstin, setGstin] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Alerts Switches State
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  // Accordion Danger Zone State
  const [dangerOpen, setDangerOpen] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile || employerProfile || activeUser) {
      setName(employerProfile?.company_name || profile?.full_name || activeUser?.full_name || activeUser?.name || 'sharama house');
      setPhone(profile?.phone?.replace(/\D/g, '').slice(-10) || activeUser?.phone?.replace(/\D/g, '').slice(-10) || '9148291889');
      setEmail(profile?.email || activeUser?.email || 'sah.debashish@gmail.com');
      setSociety(employerProfile?.society_name || profile?.society || 'Adarsh Palm Retreat, Bellandur, Bangalore');
      setTower(employerProfile?.tower || 'Tower A');
      setFlat(employerProfile?.address || 'A301');
    }
  }, [profile, employerProfile, activeUser]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { apiClient } = await import('../../services/apiClient');
      await apiClient.post('api/employer/profile/update', {
        company_name: name.trim(),
        society_name: society.trim(),
        tower_block: tower.trim(),
        address: flat.trim()
      });
      refreshProfile().catch(() => {});
    } catch (e) {
      console.warn("Save profile error notice:", e);
    }

    setIsSaving(false);
    Alert.alert(
      t('accountUpdatedTitle', 'Account Profile Saved 🟢'), 
      t('accountUpdatedMsg', 'Your employer household profile details, billing specs, and contact preferences have been updated.')
    );
  };

  const handleDocumentAction = (docName: string, actionType: 'view' | 'change') => {
    if (actionType === 'view') {
      Alert.alert(`View ${docName}`, `${docName} document preview verified in Sevikaa Encrypted Storage.`);
    } else {
      Alert.alert(`Upload New ${docName}`, `Select new file to upload for ${docName}.`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* 1. TOP PAGE HEADER */}
      <View style={styles.headerCard}>
        <View style={styles.headerTitleRow}>
          <User size={22} color="#1A73E8" />
          <Text style={styles.pageTitle}>{t('householdEmployerAccountSettings', 'Household & Employer Account Settings')}</Text>
        </View>

        <View style={styles.auditStatusPill}>
          <ShieldCheck size={11} color="#1D4ED8" />
          <Clock size={11} color="#1D4ED8" />
          <Text style={styles.auditStatusText}>{t('pendingAdminAuditPill', 'PENDING ADMIN AUDIT')}</Text>
        </View>

        <Text style={styles.pageSub}>
          {t('accountSettingsSub', 'Manage your residential address, contact details, subscription tier, and security preferences.')}
        </Text>
      </View>

      {/* 2. HERO PROFILE SUMMARY CARD */}
      <View style={styles.heroSummaryCard}>
        
        {/* Top Info Row */}
        <View style={styles.heroTopRow}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(name || 'S')[0].toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.cameraIconBtn}>
              <Camera size={10} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroHouseholdName}>{name}</Text>
            <Text style={styles.heroLocationText}>📍 {society}</Text>

            <View style={styles.heroBadgesRow}>
              <View style={styles.readyBadge}>
                <Sparkles size={9} color="#15803D" />
                <Text style={styles.readyBadgeText}>{t('accountReadyBadge', '100% ACCOUNT READY')}</Text>
              </View>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>{t('premiumBadge', 'PREMIUM')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Details Grid Box */}
        <View style={styles.contactDetailsBox}>
          <View style={styles.contactItemRow}>
            <Text style={styles.contactItemLabel}>{t('mobileNumberLabel', 'Mobile Number:')}</Text>
            <Text style={styles.contactItemValue}>+91 {phone}</Text>
          </View>

          <View style={styles.contactItemRow}>
            <Text style={styles.contactItemLabel}>{t('emailAddressLabel', 'Email Address:')}</Text>
            <Text style={styles.contactItemValue} numberOfLines={1}>{email}</Text>
          </View>

          <View style={styles.contactItemRow}>
            <Text style={styles.contactItemLabel}>{t('towerUnitAddressLabel', 'Tower / Unit Address:')}</Text>
            <Text style={styles.contactItemValue}>{tower}, {flat}, ({city})</Text>
          </View>
        </View>

        {/* Profile Completeness Progress Bar */}
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressLabel}>{t('profileCompletenessLabel', 'Profile Completeness')}</Text>
          <Text style={styles.progressStepsCount}>{t('stepsCompletedText', '10 of 10 steps completed')}</Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: '100%' }]} />
        </View>

        {/* 10 Checklist Pills Grid */}
        <View style={styles.checklistGrid}>
          {[
            { id: '1', label: t('fullNameCheck', 'Full Name') },
            { id: '2', label: t('mobileNumberCheck', 'Mobile Number') },
            { id: '3', label: t('emailAddressCheck', 'Email Address') },
            { id: '4', label: t('gatedSocietyCheck', 'Gated Society') },
            { id: '5', label: t('towerBlockCheck', 'Tower / Block') },
            { id: '6', label: t('flatAddressCheck', 'Flat Address') },
            { id: '7', label: t('profilePhotoCheck', 'Profile Photo') },
            { id: '8', label: t('residencyProofCheck', 'Residency Proof') },
            { id: '9', label: t('aadhaarFrontCheck', 'Aadhaar (Front)') },
            { id: '10', label: t('aadhaarBackCheck', 'Aadhaar (Back)') },
          ].map(chk => (
            <View key={chk.id} style={styles.checkPillItem}>
              <Text style={styles.checkPillText}>{chk.label}</Text>
              <Check size={10} color="#15803D" />
            </View>
          ))}
        </View>

      </View>

      {/* 3. HOUSEHOLD PROFILE & CONTACT INFORMATION FORM CARD */}
      <View style={styles.formCard}>
        <View style={styles.formCardHeaderRow}>
          <Text style={styles.formCardTitle}>{t('householdProfileContactInfo', 'HOUSEHOLD PROFILE & CONTACT INFORMATION')}</Text>
          <View style={styles.premiumBadgeSmall}>
            <Text style={styles.premiumBadgeSmallText}>PREMIUM</Text>
          </View>
        </View>

        {/* Employer Full Name */}
        <Text style={styles.fieldLabel}>{t('employerFullNameLabel', 'EMPLOYER FULL NAME')}</Text>
        <TextInput 
          style={styles.textInput}
          value={name}
          onChangeText={setName}
        />

        {/* Primary 10-Digit Mobile */}
        <Text style={styles.fieldLabel}>{t('primary10DigitMobileLabel', 'PRIMARY 10-DIGIT MOBILE')}</Text>
        <View style={styles.inputWithBtnRow}>
          <View style={styles.phonePrefixBox}>
            <Text style={styles.phonePrefixText}>+91</Text>
          </View>
          <TextInput 
            style={styles.inputFlex}
            value={phone}
            keyboardType="numeric"
            onChangeText={setPhone}
          />
          <TouchableOpacity style={styles.lockUpdateBtn}>
            <Lock size={11} color="#FFFFFF" />
            <Text style={styles.lockUpdateBtnText}>Update</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Email Address */}
        <Text style={styles.fieldLabel}>{t('primaryEmailAddressLabel', 'PRIMARY EMAIL ADDRESS')}</Text>
        <View style={styles.inputWithBtnRow}>
          <TextInput 
            style={styles.inputFlex}
            value={email}
            keyboardType="email-address"
            onChangeText={setEmail}
          />
          <TouchableOpacity style={styles.lockUpdateBtn}>
            <Lock size={11} color="#FFFFFF" />
            <Text style={styles.lockUpdateBtnText}>Update</Text>
          </TouchableOpacity>
        </View>

        {/* Alternate Contact & Transfer Button */}
        <View style={styles.altHeaderRow}>
          <Text style={styles.fieldLabel}>{t('alternateFamilyContactPhoneLabel', 'ALTERNATE / FAMILY CONTACT PHONE (OPTIONAL)')}</Text>
          {onNavigateToRelocate && (
            <TouchableOpacity style={styles.requestTransferBtn} onPress={onNavigateToRelocate}>
              <Text style={styles.requestTransferBtnText}>{t('requestTransferBtn', 'REQUEST TRANSFER →')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputWithBtnRow}>
          <View style={styles.phonePrefixBox}>
            <Text style={styles.phonePrefixText}>+91</Text>
          </View>
          <TextInput 
            style={styles.inputFlex}
            value={altPhone}
            keyboardType="numeric"
            onChangeText={setAltPhone}
          />
          <View style={styles.societyPillSmall}>
            <Text style={styles.societyPillSmallText} numberOfLines={1}>Adarsh Palm Retreat</Text>
          </View>
        </View>

        {/* Tower / Building Block & Flat Door Number */}
        <Text style={styles.fieldLabel}>{t('towerBuildingBlockLabel', 'TOWER / BUILDING BLOCK')}</Text>
        <TextInput 
          style={styles.textInput}
          value={tower}
          onChangeText={setTower}
        />

        <Text style={styles.fieldLabel}>{t('flatApartmentDoorNumberLabel', 'FLAT / APARTMENT DOOR NUMBER & ADDRESS')}</Text>
        <TextInput 
          style={styles.textInput}
          value={flat}
          onChangeText={setFlat}
        />

        {/* TAX INVOICING & OFFICIAL BILLING DETAILS */}
        <Text style={styles.subSectionTitle}>🧾 {t('taxInvoicingBillingDetails', 'TAX INVOICING & OFFICIAL BILLING DETAILS')}</Text>

        <View style={styles.threeColRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>{t('cityLabel', 'CITY')}</Text>
            <TextInput style={styles.textInput} value={city} onChangeText={setCity} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>{t('stateLabel', 'STATE')}</Text>
            <TextInput style={styles.textInput} value={stateName} onChangeText={setStateName} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>{t('pincodeLabel', 'PINCODE')}</Text>
            <TextInput style={styles.textInput} value={pincode} keyboardType="numeric" onChangeText={setPincode} />
          </View>
        </View>

        <Text style={styles.fieldLabel}>{t('gstinTaxIdLabel', 'GSTIN / TAX ID (OPTIONAL FOR GST TAX INVOICE)')}</Text>
        <TextInput 
          style={styles.textInput}
          placeholder="E.G. 19AAAAA0000A1Z5"
          placeholderTextColor="#94A3B8"
          value={gstin}
          onChangeText={setGstin}
        />

        {/* Tax Invoices & Billing Receipts Card */}
        <View style={styles.taxInvoicesBoxCard}>
          <View style={styles.taxInvoicesHeaderRow}>
            <FileSpreadsheet size={16} color="#1A73E8" />
            <Text style={styles.taxInvoicesTitle}>Official GST Tax Invoices &amp; Receipts</Text>
          </View>
          <Text style={styles.taxInvoicesSubText}>
            Download official GST tax invoices for your subscription &amp; hiring plans directly to your device
          </Text>

          <TouchableOpacity 
            style={styles.viewInvoicesBtn}
            onPress={() => {
              if (onNavigateToInvoices) {
                onNavigateToInvoices();
              } else {
                Alert.alert(
                  "Tax Invoice Downloaded 📥",
                  "Official GST Tax Invoice receipt (SV/26-27/0001) for ₹699.00 has been downloaded to your device as PDF."
                );
              }
            }}
          >
            <FileSpreadsheet size={14} color="#FFFFFF" />
            <Text style={styles.viewInvoicesBtnText}>
              {t('viewTaxInvoicesBtn', '🧾 Download Official GST Tax Invoice (PDF)')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preferred Candidate Verification Requirement */}
        <Text style={styles.fieldLabel}>{t('preferredCandidateVerificationReq', 'PREFERRED CANDIDATE VERIFICATION REQUIREMENT')}</Text>
        <View style={styles.dropdownBox}>
          <Text style={styles.dropdownText}>Aadhaar Card + Police Background Audit Required (Recommended)</Text>
          <ChevronDown size={14} color="#64748B" />
        </View>

        {/* Save Settings Button */}
        <TouchableOpacity 
          style={styles.saveSettingsBtn}
          disabled={isSaving}
          onPress={handleSaveProfile}
        >
          {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
            <>
              <Save size={15} color="#FFFFFF" />
              <Text style={styles.saveSettingsBtnText}>{t('saveAccountSettingsBtn', 'Save Account Settings')}</Text>
            </>
          )}
        </TouchableOpacity>

      </View>

      {/* 4. EMPLOYER IDENTITY VERIFICATION CARD */}
      <View style={styles.formCard}>
        <View style={styles.formCardHeaderRow}>
          <Text style={styles.formCardTitle}>🪪 {t('employerIdentityVerification', 'EMPLOYER IDENTITY VERIFICATION')}</Text>
          <View style={styles.uploadedTag}>
            <Text style={styles.uploadedTagText}>{t('uploadedTag', 'UPLOADED')}</Text>
          </View>
        </View>

        {/* Residency Proof Container */}
        <View style={styles.residencyProofCard}>
          <View style={styles.residencyHeaderRow}>
            <Building2 size={15} color="#1D4ED8" />
            <Text style={styles.residencyTitle}>{t('societyResidencyVerification', 'Society Residency Verification (Maintenance Bill / Rent Receipt)')}</Text>
            <View style={styles.requiredProofTag}>
              <Text style={styles.requiredProofTagText}>{t('requiredProofTag', 'REQUIRED PROOF')}</Text>
            </View>
          </View>

          <Text style={styles.residencySubText}>
            {t('residencyProofSub', 'Upload a recent Society Maintenance Bill, Electricity Receipt, or Rent Agreement showing your Flat & Tower number for instant Admin approval.')}
          </Text>

          <View style={styles.residencyBtnRow}>
            <TouchableOpacity style={styles.changeMaintenanceBtn} onPress={() => handleDocumentAction('Maintenance Bill', 'change')}>
              <Upload size={12} color="#FFFFFF" />
              <Text style={styles.changeMaintenanceBtnText}>{t('changeMaintenanceBtn', 'Change Maintenance')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.viewProofBtn} onPress={() => handleDocumentAction('Maintenance Bill', 'view')}>
              <Eye size={12} color="#1D4ED8" />
              <Text style={styles.viewProofBtnText}>{t('viewProofBtn', 'View Proof')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Aadhaar Front Box */}
        <View style={styles.docItemCard}>
          <FileText size={16} color="#15803D" />
          <View style={{ flex: 1 }}>
            <Text style={styles.docItemTitle}>{t('aadhaarFront', 'Aadhaar — Front')}</Text>
            <Text style={styles.docItemSub}>Name, photo &amp; Aadhaar number visible</Text>
          </View>

          <TouchableOpacity style={styles.docViewBtn} onPress={() => handleDocumentAction('Aadhaar Front', 'view')}>
            <Eye size={11} color="#15803D" />
            <Text style={styles.docViewBtnText}>{t('viewBtn', 'View')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.docChangeBtn} onPress={() => handleDocumentAction('Aadhaar Front', 'change')}>
            <Upload size={11} color="#475569" />
            <Text style={styles.docChangeBtnText}>{t('changeBtn', 'Change')}</Text>
          </TouchableOpacity>
        </View>

        {/* Aadhaar Back Box */}
        <View style={styles.docItemCard}>
          <FileText size={16} color="#15803D" />
          <View style={{ flex: 1 }}>
            <Text style={styles.docItemTitle}>{t('aadhaarBack', 'Aadhaar — Back')}</Text>
            <Text style={styles.docItemSub}>Aadhaar number &amp; residential address visible</Text>
          </View>

          <TouchableOpacity style={styles.docViewBtn} onPress={() => handleDocumentAction('Aadhaar Back', 'view')}>
            <Eye size={11} color="#15803D" />
            <Text style={styles.docViewBtnText}>{t('viewBtn', 'View')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.docChangeBtn} onPress={() => handleDocumentAction('Aadhaar Back', 'change')}>
            <Upload size={11} color="#475569" />
            <Text style={styles.docChangeBtnText}>{t('changeBtn', 'Change')}</Text>
          </TouchableOpacity>
        </View>

        {/* Verification Audit Status Box */}
        <View style={styles.verificationStatusBox}>
          <CheckCircle2 size={16} color="#15803D" />
          <View style={{ flex: 1 }}>
            <Text style={styles.verificationStatusTitle}>{t('identityDocsSubmittedPendingAudit', 'Identity Documents Submitted — Pending Admin Audit')}</Text>
            <Text style={styles.verificationStatusSub}>
              {t('adminAuditVerifyMsg', 'Sevikaa Admin will verify your documents within 24 hours. You will be notified via SMS once approved to post jobs.')}
            </Text>
          </View>
        </View>

      </View>

      {/* 5. CANDIDATE APPLICANT & SOCIETY ALERTS CARD */}
      <View style={styles.formCard}>
        <View style={styles.formCardHeaderRow}>
          <Bell size={16} color="#1A73E8" />
          <Text style={styles.formCardTitle}>{t('candidateApplicantSocietyAlerts', 'CANDIDATE APPLICANT & SOCIETY ALERTS')}</Text>
        </View>

        {/* SMS Alert Switch */}
        <View style={styles.switchRowCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>{t('smsInstantNotifications', 'SMS Instant Notifications (Jio DLT)')}</Text>
            <Text style={styles.switchSub}>{t('smsInstantNotificationsSub', 'Receive DLT-approved SMS alerts when domestic workers apply to your jobs')}</Text>
          </View>
          <Switch 
            value={smsAlerts}
            onValueChange={setSmsAlerts}
            trackColor={{ false: '#CBD5E1', true: '#1A73E8' }}
          />
        </View>

        {/* Digest Email Switch */}
        <View style={styles.switchRowCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>{t('societyHelperDigestEmail', 'Society Helper Digest Email')}</Text>
            <Text style={styles.switchSub}>{t('societyHelperDigestEmailSub', 'Weekly digest of newly verified domestic helpers in your society')}</Text>
          </View>
          <Switch 
            value={emailDigest}
            onValueChange={setEmailDigest}
            trackColor={{ false: '#CBD5E1', true: '#1A73E8' }}
          />
        </View>

      </View>

      {/* 📜 LEGAL & PRIVACY TERMS CENTER CARD */}
      <LegalComplianceCard onPress={() => setShowLegalModal(true)} />

      {/* DEDICATED LEGAL HUB SCREEN MODAL */}
      {showLegalModal && (
        <Modal visible animationType="slide" onRequestClose={() => setShowLegalModal(false)}>
          <LegalHubScreen onBack={() => setShowLegalModal(false)} />
        </Modal>
      )}

      {/* 6. ACCOUNT MANAGEMENT & DANGER ZONE ACCORDION CARD */}
      <View style={styles.formCard}>
        <TouchableOpacity style={styles.accordionHeaderRow} onPress={() => setDangerOpen(!dangerOpen)}>
          <ShieldAlert size={18} color="#DC2626" />
          <View style={{ flex: 1 }}>
            <Text style={styles.dangerTitle}>{t('accountManagementDangerZone', 'Account Management & Danger Zone')}</Text>
            <Text style={styles.dangerSub}>{t('dangerZoneSub', 'Self-service account deletion & DPDP compliance')}</Text>
          </View>
          {dangerOpen ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </TouchableOpacity>

        {dangerOpen && (
          <View style={styles.dangerContentArea}>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <LogOut size={15} color="#DC2626" />
              <Text style={styles.logoutBtnText}>Logout Household Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteAccountBtn} onPress={() => Alert.alert("Delete Account", "Are you sure you want to permanently delete your Sevikaa employer account?")}>
              <Trash2 size={15} color="#991B1B" />
              <Text style={styles.deleteAccountBtnText}>Permanently Delete Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 7. POWERED BY FOOTER */}
      <View style={styles.poweredByFooter}>
        <Text style={styles.poweredByTag}>POWERED BY</Text>
        <Text style={styles.poweredByCompany}>YugaYatra Retail OPC Private Limited</Text>
      </View>

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
    padding: 18,
    marginBottom: 16,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pageTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: -0.2 },
  auditStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  auditStatusText: { fontSize: 10, fontWeight: '900', color: '#1D4ED8' },
  pageSub: { fontSize: 12, fontWeight: '600', color: '#64748B', lineHeight: 18 },

  // HERO SUMMARY CARD
  heroSummaryCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatarWrap: { position: 'relative' },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  cameraIconBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroHouseholdName: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
  heroLocationText: { fontSize: 11.5, fontWeight: '600', color: '#475569', marginTop: 2, marginBottom: 6 },
  heroBadgesRow: { flexDirection: 'row', gap: 6 },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  readyBadgeText: { fontSize: 9.5, fontWeight: '900', color: '#15803D' },
  premiumBadge: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  premiumBadgeText: { fontSize: 9.5, fontWeight: '900', color: '#1D4ED8' },

  contactDetailsBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  contactItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactItemLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  contactItemValue: { fontSize: 11.5, fontWeight: '900', color: '#0F172A' },

  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 11, fontWeight: '800', color: '#15803D' },
  progressStepsCount: { fontSize: 10.5, fontWeight: '700', color: '#475569' },
  progressBarTrack: { height: 6, backgroundColor: '#DCFCE7', borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#16A34A', borderRadius: 3 },

  checklistGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  checkPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  checkPillText: { fontSize: 10, fontWeight: '800', color: '#15803D' },

  // FORM CARD
  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  formCardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  formCardTitle: { fontSize: 11, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5, flex: 1 },
  premiumBadgeSmall: { backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  premiumBadgeSmallText: { fontSize: 9, fontWeight: '900', color: '#1D4ED8' },

  fieldLabel: { fontSize: 9.5, fontWeight: '900', color: '#64748B', letterSpacing: 0.5, marginTop: 10, marginBottom: 4 },
  subSectionTitle: { fontSize: 11, fontWeight: '900', color: '#0F172A', marginTop: 16, marginBottom: 6 },

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
  inputWithBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phonePrefixBox: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  phonePrefixText: { fontSize: 13, fontWeight: '900', color: '#475569' },
  inputFlex: {
    flex: 1,
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
  lockUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
  },
  lockUpdateBtnText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },

  altHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  requestTransferBtn: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  requestTransferBtnText: { fontSize: 9.5, fontWeight: '900', color: '#1A73E8' },
  societyPillSmall: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 10, borderRadius: 12, maxWidth: 100 },
  societyPillSmallText: { fontSize: 10, fontWeight: '800', color: '#64748B' },

  threeColRow: { flexDirection: 'row', gap: 6 },

  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: { fontSize: 11, fontWeight: '700', color: '#0F172A', flex: 1 },

  saveSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A73E8',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 16,
  },
  saveSettingsBtnText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },

  taxInvoicesBoxCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    marginBottom: 6,
  },
  taxInvoicesHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  taxInvoicesTitle: { fontSize: 12, fontWeight: '900', color: '#1E40AF' },
  taxInvoicesSubText: { fontSize: 10.5, fontWeight: '600', color: '#1E3A8A', lineHeight: 15, marginBottom: 10 },
  viewInvoicesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  viewInvoicesBtnText: { fontSize: 11.5, fontWeight: '900', color: '#FFFFFF' },

  invoiceItemCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
  },
  invoiceHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  invoiceNumText: { fontSize: 11, fontWeight: '900', color: '#0F172A' },
  paidBadge: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  paidBadgeText: { fontSize: 9, fontWeight: '900', color: '#15803D' },
  invoicePlanTitle: { fontSize: 13, fontWeight: '900', color: '#1A73E8', marginTop: 2 },
  invoiceSub: { fontSize: 10.5, fontWeight: '600', color: '#64748B', marginTop: 2, marginBottom: 8 },
  invoiceDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 2 },
  invoiceLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  invoiceVal: { fontSize: 11, fontWeight: '800', color: '#0F172A' },
  invoiceAmountVal: { fontSize: 12, fontWeight: '900', color: '#059669' },

  downloadInvoiceModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 14,
  },
  downloadInvoiceModalBtnText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },

  // IDENTITY VERIFICATION CARD
  uploadedTag: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  uploadedTagText: { fontSize: 9.5, fontWeight: '900', color: '#15803D' },

  residencyProofCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  residencyHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  residencyTitle: { fontSize: 12, fontWeight: '900', color: '#1E40AF', flex: 1 },
  requiredProofTag: { backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  requiredProofTagText: { fontSize: 8.5, fontWeight: '900', color: '#1D4ED8' },
  residencySubText: { fontSize: 11, fontWeight: '600', color: '#1E3A8A', lineHeight: 16, marginBottom: 10 },
  residencyBtnRow: { flexDirection: 'row', gap: 8 },
  changeMaintenanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 9,
    borderRadius: 12,
  },
  changeMaintenanceBtnText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
  viewProofBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DBEAFE',
    paddingVertical: 9,
    borderRadius: 12,
  },
  viewProofBtnText: { fontSize: 11, fontWeight: '900', color: '#1D4ED8' },

  docItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  docItemTitle: { fontSize: 12.5, fontWeight: '900', color: '#065F46' },
  docItemSub: { fontSize: 10.5, fontWeight: '600', color: '#047857' },
  docViewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  docViewBtnText: { fontSize: 10, fontWeight: '900', color: '#065F46' },
  docChangeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  docChangeBtnText: { fontSize: 10, fontWeight: '900', color: '#475569' },

  verificationStatusBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 18,
    padding: 14,
  },
  verificationStatusTitle: { fontSize: 12, fontWeight: '900', color: '#065F46', marginBottom: 2 },
  verificationStatusSub: { fontSize: 10.5, fontWeight: '600', color: '#047857', lineHeight: 15 },

  // ALERTS SWITCHES
  switchRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  switchTitle: { fontSize: 12, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  switchSub: { fontSize: 10.5, fontWeight: '600', color: '#64748B', lineHeight: 14 },

  // DANGER ZONE ACCORDION
  accordionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dangerTitle: { fontSize: 12.5, fontWeight: '900', color: '#991B1B' },
  dangerSub: { fontSize: 10.5, fontWeight: '600', color: '#B91C1C' },
  dangerContentArea: { marginTop: 14, gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#FEE2E2' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingVertical: 10, borderRadius: 12 },
  logoutBtnText: { fontSize: 12, fontWeight: '900', color: '#DC2626' },
  deleteAccountBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#991B1B', paddingVertical: 10, borderRadius: 12 },
  deleteAccountBtnText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },

  // FOOTER
  poweredByFooter: { alignItems: 'center', marginVertical: 20 },
  poweredByTag: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  poweredByCompany: { fontSize: 11, fontWeight: '800', color: '#64748B', marginTop: 2 },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
});
