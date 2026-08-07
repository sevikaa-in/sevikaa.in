import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, Alert 
} from 'react-native';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  reviewerRole: 'employer' | 'worker';
  revieweeName: string;
  revieweeRole: 'worker' | 'employer';
  onSubmitSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  reviewerRole,
  revieweeName,
  revieweeRole,
  onSubmitSuccess
}) => {
  const [rating, setRating] = useState<number>(5);
  const [interactionType, setInteractionType] = useState<'interview_impression' | 'worked_together'>('interview_impression');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!visible) return null;

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Review Submitted! ⭐",
        `Thank you! Your verified rating and feedback for ${revieweeName} has been saved.`
      );
      if (onSubmitSuccess) onSubmitSuccess();
      onClose();
    }, 800);
  };

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>⭐ Verified Rating &amp; Feedback</Text>
              <Text style={styles.modalSub}>
                Feedback for <Text style={{ fontWeight: '900', color: '#0F172A' }}>{revieweeName}</Text> ({revieweeRole})
              </Text>
            </View>

            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* INTERACTION TYPE PILLS */}
          <Text style={styles.label}>INTERACTION TYPE</Text>
          <View style={styles.pillRow}>
            <TouchableOpacity 
              style={[
                styles.pillBtn, 
                interactionType === 'interview_impression' && styles.pillBtnActive
              ]}
              onPress={() => setInteractionType('interview_impression')}
            >
              <Text style={[
                styles.pillBtnText,
                interactionType === 'interview_impression' && styles.pillBtnTextActive
              ]}>
                🚪 Gate Meeting
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.pillBtn, 
                interactionType === 'worked_together' && styles.pillBtnActive
              ]}
              onPress={() => setInteractionType('worked_together')}
            >
              <Text style={[
                styles.pillBtnText,
                interactionType === 'worked_together' && styles.pillBtnTextActive
              ]}>
                💼 Worked Together
              </Text>
            </TouchableOpacity>
          </View>

          {/* 5-STAR RATING SELECTOR */}
          <Text style={styles.label}>OVERALL RATING (1 TO 5 STARS)</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={[styles.starEmoji, rating >= star ? styles.starActive : styles.starInactive]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingValText}>{rating} out of 5 Stars</Text>

          {/* CATEGORY BREAKDOWN */}
          <Text style={styles.label}>CATEGORY RATINGS</Text>
          {reviewerRole === 'employer' ? (
            <View style={styles.categoryBox}>
              <Text style={styles.categoryItem}>✓ Punctuality &amp; Timing: 5/5</Text>
              <Text style={styles.categoryItem}>✓ Skill &amp; Cooking/Hygiene: 5/5</Text>
              <Text style={styles.categoryItem}>✓ Polite &amp; Respectful Behavior: 5/5</Text>
            </View>
          ) : (
            <View style={styles.categoryBox}>
              <Text style={styles.categoryItem}>✓ Respectful Household Behavior: 5/5</Text>
              <Text style={styles.categoryItem}>✓ Clear Job Terms &amp; Scope: 5/5</Text>
              <Text style={styles.categoryItem}>✓ Timely Monthly Payment: 5/5</Text>
            </View>
          )}

          {/* FEEDBACK COMMENT */}
          <Text style={styles.label}>WRITTEN FEEDBACK (OPTIONAL)</Text>
          <TextInput 
            style={styles.commentInput}
            multiline
            placeholder="Share details about punctuality, behavior, hygiene..."
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
          />

          {/* SUBMIT BUTTON */}
          <TouchableOpacity 
            style={styles.submitBtn} 
            disabled={isSubmitting}
            onPress={handleSubmit}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'Submitting Review...' : 'Submit Verified Review ⭐'}
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeText: { fontSize: 20, color: '#64748B', fontWeight: '900' },
  label: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.8, marginTop: 12, marginBottom: 6 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pillBtn: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  pillBtnActive: { backgroundColor: '#E8F0FE', borderColor: '#1A73E8' },
  pillBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  pillBtnTextActive: { color: '#1A73E8', fontWeight: '900' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 8 },
  starEmoji: { fontSize: 36 },
  starActive: { color: '#F59E0B' },
  starInactive: { color: '#CBD5E1' },
  ratingValText: { textAlign: 'center', fontSize: 12, fontWeight: '800', color: '#B45309', marginBottom: 4 },
  categoryBox: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 10, gap: 4 },
  categoryItem: { fontSize: 11, fontWeight: '700', color: '#334155' },
  commentInput: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, fontWeight: '700', color: '#0F172A', height: 70, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#1A73E8', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
