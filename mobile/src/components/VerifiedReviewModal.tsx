import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, Modal, TouchableOpacity, 
  TextInput, ScrollView, ActivityIndicator 
} from 'react-native';
import { 
  Star, ShieldCheck, Lock, X, CheckCircle2, 
  AlertCircle, Send, Sparkles 
} from 'lucide-react-native';
import { useMobileLanguage } from '../context/LanguageContext';

export interface MobileVerifiedReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: 'employer' | 'worker';
  targetId: string;
  targetName: string;
  targetRole: 'employer' | 'worker';
  interactionType: 'worked' | 'interviewed' | 'interacted' | null;
  onSubmitSuccess?: (newReview: any) => void;
}

export const VerifiedReviewModal: React.FC<MobileVerifiedReviewModalProps> = ({
  isOpen,
  onClose,
  reviewerId,
  reviewerName,
  reviewerRole,
  targetId,
  targetName,
  targetRole,
  interactionType,
  onSubmitSuccess
}) => {
  const { t } = useMobileLanguage();

  const [rating, setRating] = useState<number>(5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);
  const [hygieneBehaviorRating, setHygieneBehaviorRating] = useState<number>(5);
  const [workQualityRespectRating, setWorkQualityRespectRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const isEligible = Boolean(interactionType);

  const handleSubmit = async () => {
    if (!isEligible || isSubmitting) return;

    setIsSubmitting(true);

    const reviewData = {
      id: `rev-${Date.now()}`,
      reviewer_id: reviewerId,
      reviewer_name: reviewerName,
      reviewer_role: reviewerRole,
      target_id: targetId,
      target_name: targetName,
      target_role: targetRole,
      interaction_type: interactionType,
      rating,
      punctuality_rating: punctualityRating,
      hygiene_behavior_rating: hygieneBehaviorRating,
      work_quality_respect_rating: workQualityRespectRating,
      comment: comment || 'Verified rating submitted for platform audit.',
      status: 'pending_approval',
      created_at: new Date().toISOString()
    };

    setTimeout(() => {
      setIsSubmitting(false);
      if (onSubmitSuccess) onSubmitSuccess(reviewData);
      onClose();
    }, 600);
  };

  const renderStarSelector = (val: number, setVal: (n: number) => void) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(starNum => (
        <TouchableOpacity 
          key={starNum} 
          onPress={() => setVal(starNum)}
          style={styles.starTouch}
        >
          <Star 
            size={22} 
            color={starNum <= val ? "#EAB308" : "#CBD5E1"} 
            fill={starNum <= val ? "#EAB308" : "none"} 
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.badgePill}>
              <ShieldCheck size={11} color="#1A73E8" />
              <Text style={styles.badgePillText}>VERIFIED RATING &amp; REVIEW</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalTitle}>
            Rate {targetName || 'User'}
          </Text>
          <Text style={styles.modalSub}>
            {targetRole === 'worker' ? 'Domestic Helper Experience' : 'Household Employer Experience'}
          </Text>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            
            {/* Overall Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Overall Rating</Text>
              {renderStarSelector(rating, setRating)}
            </View>

            {/* Punctuality Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Punctuality &amp; Timeliness</Text>
              {renderStarSelector(punctualityRating, setPunctualityRating)}
            </View>

            {/* Hygiene & Behavior Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Hygiene &amp; Professional Conduct</Text>
              {renderStarSelector(hygieneBehaviorRating, setHygieneBehaviorRating)}
            </View>

            {/* Work Quality Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Work Quality &amp; Care</Text>
              {renderStarSelector(workQualityRespectRating, setWorkQualityRespectRating)}
            </View>

            {/* Feedback Comment Input */}
            <Text style={styles.inputLabel}>Detailed Feedback (Optional)</Text>
            <TextInput 
              style={styles.textArea}
              multiline
              numberOfLines={3}
              value={comment}
              onChangeText={setComment}
              placeholder="Share details about punctuality, honesty, and work quality..."
              placeholderTextColor="#94A3B8"
            />

          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            disabled={isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Send size={14} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Submit Verified Review</Text>
              </>
            )}
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgePillText: { fontSize: 9.5, fontWeight: '900', color: '#1A73E8' },
  closeBtn: { padding: 4, borderRadius: 10, backgroundColor: '#F1F5F9' },

  modalTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  modalSub: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 12 },

  ratingSection: { marginBottom: 10 },
  ratingLabel: { fontSize: 11, fontWeight: '800', color: '#334155', marginBottom: 4 },
  starRow: { flexDirection: 'row', gap: 6 },
  starTouch: { padding: 2 },

  inputLabel: { fontSize: 11, fontWeight: '800', color: '#334155', marginTop: 6, marginBottom: 4 },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 10,
    fontSize: 12,
    color: '#0F172A',
    minHeight: 64,
    textAlignVertical: 'top',
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 14,
  },
  submitBtnDisabled: { backgroundColor: '#94A3B8' },
  submitBtnText: { fontSize: 12.5, fontWeight: '900', color: '#FFFFFF' },
});
