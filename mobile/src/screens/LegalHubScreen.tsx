import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Alert 
} from 'react-native';
import { 
  ShieldCheck, FileText, Lock, RefreshCw, Truck, ArrowLeft, 
  ChevronRight, Building, Mail, Phone, Trash2, AlertTriangle, HelpCircle, CheckCircle2, EyeOff, KeyRound, Zap
} from 'lucide-react-native';

interface LegalHubScreenProps {
  onBack?: () => void;
}

export const LegalHubScreen: React.FC<LegalHubScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<string>('directory');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const legalItems = [
    {
      id: 'privacy',
      title: '🔒 Privacy Policy',
      subtitle: 'How we collect, encrypt, and protect your personal data & Aadhaar proofs.',
      badge: 'Data Protection',
      badgeBg: '#DCFCE7',
      badgeText: '#15803D'
    },
    {
      id: 'terms',
      title: '📜 Terms & Conditions',
      subtitle: 'Platform rules, employer subscriptions, and worker verification terms.',
      badge: 'User Agreement',
      badgeBg: '#DBEAFE',
      badgeText: '#1D4ED8'
    },
    {
      id: 'refunds',
      title: '💳 Refund & Cancellation Policy',
      subtitle: 'Razorpay billing, subscription refunds, and payment cancellation rules.',
      badge: 'Billing Terms',
      badgeBg: '#FEF3C7',
      badgeText: '#D97706'
    },
    {
      id: 'shipping',
      title: '🚚 Service Fulfillment Policy',
      subtitle: 'Digital service delivery, instant plan activation & store compliance.',
      badge: 'Service Delivery',
      badgeBg: '#F3E8FF',
      badgeText: '#7E22CE'
    },
    {
      id: 'safety',
      title: '🛡️ Safety Guidelines',
      subtitle: 'Aadhaar verification audit standards and safety protocols.',
      badge: 'Trust & Safety',
      badgeBg: '#CCFBF1',
      badgeText: '#0F766E'
    },
    {
      id: 'faq',
      title: '❓ Frequently Asked Questions',
      subtitle: 'Common questions on hiring, candidate profiles, and subscriptions.',
      badge: 'Help Center',
      badgeBg: '#F1F5F9',
      badgeText: '#475569'
    }
  ];

  const handleHeaderBack = () => {
    if (activeTab !== 'directory') {
      setActiveTab('directory');
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={handleHeaderBack}
        >
          <ArrowLeft size={16} color="#1A73E8" />
          <Text style={styles.backBtnText}>
            {activeTab === 'directory' ? 'Back' : 'Back to Hub'}
          </Text>
        </TouchableOpacity>

        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedBadgeText}>✓ VERIFIED PLATFORM</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* ============================================================ */}
        {/* DIRECTORY HUB LIST                                           */}
        {/* ============================================================ */}
        {activeTab === 'directory' && (
          <>
            {/* Header Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroTitleRow}>
                <ShieldCheck size={22} color="#1A73E8" />
                <Text style={styles.heroTitle}>Legal &amp; Privacy Center</Text>
              </View>
              <Text style={styles.heroSub}>
                Official platform policies, data protection guidelines &amp; corporate operating disclosures.
              </Text>
            </View>

            {/* Policy Items List Card */}
            <View style={styles.policyCard}>
              <View style={styles.policyCardHeader}>
                <Text style={styles.policyCardHeaderTitle}>OFFICIAL PLATFORM POLICIES</Text>
                <Text style={styles.policyCardHeaderCount}>{legalItems.length} Policies</Text>
              </View>

              {legalItems.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.itemRow}
                  onPress={() => setActiveTab(item.id)}
                >
                  <View style={styles.itemLeftCol}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <View style={[styles.itemBadge, { backgroundColor: item.badgeBg }]}>
                        <Text style={[styles.itemBadgeText, { color: item.badgeText }]}>{item.badge}</Text>
                      </View>
                    </View>
                    <Text style={styles.itemSub}>{item.subtitle}</Text>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Corporate Entity Disclosure Card */}
            <View style={styles.entityCard}>
              <View style={styles.entityHeader}>
                <View style={styles.entityIconBox}>
                  <Building size={18} color="#475569" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entityTitle}>Corporate &amp; Merchant Ownership</Text>
                  <Text style={styles.entitySub}>Registered Operating Entity Details</Text>
                </View>
              </View>

              <View style={styles.entityGrid}>
                <View style={styles.entityCell}>
                  <Text style={styles.entityCellLabel}>LEGAL ENTITY NAME</Text>
                  <Text style={styles.entityCellValue}>YugaYatra Retail (OPC) Private Limited</Text>
                  <Text style={styles.entityCellTag}>✓ DPIIT-Recognized Startup</Text>
                </View>

                <View style={styles.entityCell}>
                  <Text style={styles.entityCellLabel}>GSTIN NUMBER</Text>
                  <Text style={styles.entityCellValue}>29AABCY8389C1ZT</Text>
                  <Text style={styles.entityCellSub}>Karnataka, India</Text>
                </View>

                <View style={styles.entityCell}>
                  <Text style={styles.entityCellLabel}>EMAIL SUPPORT</Text>
                  <Text style={styles.entityCellEmail}>✉ support@sevikaa.in</Text>
                </View>

                <View style={styles.entityCell}>
                  <Text style={styles.entityCellLabel}>HELPLINE</Text>
                  <Text style={styles.entityCellPhone}>📞 +91 87577 28679</Text>
                </View>
              </View>
            </View>

            {/* Data Erasure Rights Card */}
            <View style={styles.erasureCard}>
              <View style={styles.erasureHeader}>
                <View style={styles.erasureIconBox}>
                  <Trash2 size={18} color="#92400E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.erasureTitle}>Account Deletion &amp; Data Erasure Rights</Text>
                  <Text style={styles.erasureSub}>
                    Request permanent erasure of your profile and Aadhaar documents at any time.
                  </Text>
                </View>
              </View>

              <View style={styles.erasureFooterRow}>
                <Text style={styles.erasureFooterText}>Self-service deletion available inside Danger Zone.</Text>
                <TouchableOpacity 
                  style={styles.requestDeleteBtn}
                  onPress={() => setShowDeleteModal(true)}
                >
                  <Trash2 size={12} color="#FFFFFF" />
                  <Text style={styles.requestDeleteBtnText}>Request Data Deletion</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* ============================================================ */}
        {/* SUB-VIEW 1: PRIVACY POLICY                                   */}
        {/* ============================================================ */}
        {activeTab === 'privacy' && (
          <View style={styles.policyViewContainer}>
            <Text style={styles.policyViewTitle}>🔒 Privacy Policy</Text>
            <Text style={styles.policyViewIntro}>
              At Sevikaa (operated by YugaYatra Retail OPC Private Limited), we respect your privacy. This policy details our data protection practices.
            </Text>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>1. Information We Collect</Text>
              <Text style={styles.bodyText}>• Profile Info: Full Name, Phone Number, Email Address.</Text>
              <Text style={styles.bodyText}>• Verification Documents: Aadhaar images stored in encrypted private storage.</Text>
              <Text style={styles.bodyText}>• Preferences: Skills, salary expectations, preferred gated societies.</Text>
            </View>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>2. Data Masking &amp; Protection</Text>
              <Text style={styles.bodyText}>• Exact flat numbers and GPS locations are NEVER publicly displayed.</Text>
              <Text style={styles.bodyText}>• Phone numbers remain masked until an employer unlocks verified access.</Text>
            </View>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>3. User Rights</Text>
              <Text style={styles.bodyText}>Request profile updates or permanent account/document erasure anytime by emailing support@sevikaa.in.</Text>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* SUB-VIEW 2: TERMS & CONDITIONS                               */}
        {/* ============================================================ */}
        {activeTab === 'terms' && (
          <View style={styles.policyViewContainer}>
            <Text style={styles.policyViewTitle}>📜 Terms &amp; Conditions</Text>
            <Text style={styles.policyViewIntro}>
              By using Sevikaa, you agree to comply with these terms governing platform usage.
            </Text>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>1. Eligibility &amp; Verification</Text>
              <Text style={styles.bodyText}>• Helpers must submit valid government Aadhaar identity proofs.</Text>
              <Text style={styles.bodyText}>• Employers must state genuine household requirements.</Text>
            </View>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>2. Zero Worker Commission</Text>
              <Text style={styles.bodyText}>• Helper registration and job applications are 100% free.</Text>
              <Text style={styles.bodyText}>• Employers purchase hiring subscriptions to unlock candidate contacts.</Text>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* SUB-VIEW 3: REFUNDS & CANCELLATION                           */}
        {/* ============================================================ */}
        {activeTab === 'refunds' && (
          <View style={styles.policyViewContainer}>
            <Text style={styles.policyViewTitle}>💳 Refund &amp; Cancellation Policy</Text>
            <Text style={styles.policyViewIntro}>
              Transparent refund guidelines for employer subscription plans.
            </Text>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>1. Free Worker Access</Text>
              <Text style={styles.bodyText}>Worker registration is 100% free with zero fees or commissions.</Text>
            </View>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>2. Employer Refund SLA</Text>
              <Text style={styles.bodyText}>• Duplicate billing glitches or technical failure to unlock subscription are eligible for a 100% refund.</Text>
              <Text style={styles.bodyText}>• Approved refunds are credited to original payment method within 5–7 business days.</Text>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* SUB-VIEW 4: SERVICE FULFILLMENT                              */}
        {/* ============================================================ */}
        {activeTab === 'shipping' && (
          <View style={styles.policyViewContainer}>
            <Text style={styles.policyViewTitle}>🚚 Service Fulfillment Policy</Text>
            <Text style={styles.policyViewIntro}>
              Sevikaa delivers services digitally. No physical goods are shipped.
            </Text>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>1. Instant Activation SLA</Text>
              <Text style={styles.bodyText}>99% of subscription plan activations occur within 1–2 seconds of Razorpay payment completion.</Text>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* SUB-VIEW 5: SAFETY GUIDELINES                                */}
        {/* ============================================================ */}
        {activeTab === 'safety' && (
          <View style={styles.policyViewContainer}>
            <Text style={styles.policyViewTitle}>🛡️ Safety &amp; Audit Standards</Text>
            <Text style={styles.policyViewIntro}>
              Multi-tier verification and society-level safety audits.
            </Text>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>1. Aadhaar Identity Audit</Text>
              <Text style={styles.bodyText}>Every verified helper submits front &amp; back Aadhaar card images cross-checked before receiving the Sevikaa Verified Badge.</Text>
            </View>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>2. Police Clearance Badges</Text>
              <Text style={styles.bodyText}>Workers can voluntarily upload Police Clearance Certificates (PCC) to earn an additional PCC Verified Badge.</Text>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* SUB-VIEW 6: FAQ                                              */}
        {/* ============================================================ */}
        {activeTab === 'faq' && (
          <View style={styles.policyViewContainer}>
            <Text style={styles.policyViewTitle}>❓ Frequently Asked Questions</Text>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>Q: Is Sevikaa free for workers?</Text>
              <Text style={styles.bodyText}>Yes. Registration is 100% free with zero salary commissions.</Text>
            </View>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>Q: How do employers connect with candidates?</Text>
              <Text style={styles.bodyText}>Employers unlock candidate contacts immediately after activating a subscription plan.</Text>
            </View>

            <View style={styles.policySection}>
              <Text style={styles.sectionHeading}>Q: Is my personal information safe?</Text>
              <Text style={styles.bodyText}>Yes. Exact flat numbers and document images are protected and never publicly exposed.</Text>
            </View>
          </View>
        )}

        {/* Brand Footer */}
        <View style={styles.brandFooter}>
          <Text style={styles.brandFooterTag}>POWERED BY</Text>
          <Text style={styles.brandFooterCompany}>YugaYatra Retail OPC Private Limited</Text>
        </View>
      </ScrollView>

      {/* Account Deletion Request Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={18} color="#D97706" />
              <Text style={styles.modalTitle}>Data Erasure Instructions</Text>
            </View>
            <Text style={styles.modalBody}>
              To request permanent erasure of your profile and Aadhaar document images:
            </Text>
            <Text style={styles.modalBullet}>1. Use Danger Zone → Account Deletion inside app settings.</Text>
            <Text style={styles.modalBullet}>2. Email support@sevikaa.in with your registered phone number.</Text>
            <Text style={styles.modalNote}>
              All documents will be permanently purged within 7 business days.
            </Text>
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A73E8',
  },
  verifiedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#047857',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  heroSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18,
  },
  policyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  policyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  policyCardHeaderTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#334155',
    letterSpacing: 0.5,
  },
  policyCardHeaderCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemLeftCol: {
    flex: 1,
    marginRight: 12,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  itemBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  itemSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  policyViewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  policyViewTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  policyViewIntro: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  policySection: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  entityCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  entityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  entityIconBox: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  entityTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  entitySub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  entityGrid: {
    gap: 8,
  },
  entityCell: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  entityCellLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 2,
  },
  entityCellValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  entityCellTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
    marginTop: 2,
  },
  entityCellSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  entityCellEmail: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A73E8',
  },
  entityCellPhone: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  erasureCard: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  erasureHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  erasureIconBox: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FDE68A',
  },
  erasureTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#78350F',
  },
  erasureSub: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 2,
  },
  erasureFooterRow: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  erasureFooterText: {
    fontSize: 10,
    color: '#78350F',
    fontWeight: '600',
    flex: 1,
  },
  requestDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#78350F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  requestDeleteBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  brandFooterTag: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  brandFooterCompany: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalBody: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalBullet: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: 4,
  },
  modalNote: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 8,
    marginBottom: 16,
  },
  modalCloseBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
