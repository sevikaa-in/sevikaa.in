import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Alert 
} from 'react-native';
import { 
  PlusCircle, Sparkles, MapPin, IndianRupee, Briefcase, 
  Clock, ShieldCheck, CheckCircle2, Home, Users
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useMobileLanguage } from '../../context/LanguageContext';

export const EmployerPostJobScreen: React.FC<{ 
  user?: any;
  onPostSuccess?: () => void;
}> = ({ user, onPostSuccess }) => {
  const { t } = useMobileLanguage();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'cook' | 'maid' | 'nanny'>('cook');
  const [salary, setSalary] = useState('15000');
  const [society, setSociety] = useState('Adarsh Palm Retreat, Bellandur');
  const [shiftHours, setShiftHours] = useState('Full Day (8:00 AM – 4:00 PM)');
  const [flatType, setFlatType] = useState('3BHK Apartment');
  const [familyMembers, setFamilyMembers] = useState('4 Members (2 Adults, 2 Kids)');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitPost = async () => {
    if (!title.trim()) {
      Alert.alert("Required Field", "Please enter a job title for your requisition.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (user?.id) {
        await supabase.from('jobs').insert([{
          employer_id: user.id,
          employer_name: user.full_name || 'sharama house',
          title: title.trim(),
          category: category,
          salary_offered: Number(salary) || 15000,
          society_name: society,
          shift_hours: shiftHours,
          flat_type: flatType,
          family_members: familyMembers,
          description: description.trim() || 'Daily household work required.',
          status: 'active',
          created_at: new Date().toISOString()
        }]);
      }
    } catch (err) {
      console.warn("Post job error notice:", err);
    }
    setIsSubmitting(false);
    Alert.alert("Requisition Posted! 🟢", "Your job requisition is now live in your society feed.");
    if (onPostSuccess) onPostSuccess();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* PAGE HEADER */}
      <View style={styles.headerCard}>
        <View style={styles.eyebrowPill}>
          <PlusCircle size={11} color="#1A73E8" />
          <Text style={styles.eyebrowText}>NEW REQUISITION FORM</Text>
        </View>

        <Text style={styles.pageTitle}>Post Job Requisition</Text>
        <Text style={styles.pageSub}>
          Broadcast your domestic job requirement to background-verified helpers in your gated residential society.
        </Text>
      </View>

      {/* FORM CARD */}
      <View style={styles.formCard}>
        
        {/* Title */}
        <Text style={styles.inputLabel}>Job Requisition Title:</Text>
        <TextInput 
          style={styles.textInput}
          placeholder="e.g. North Indian Family Cook &amp; Housekeeping"
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        {/* Category Pills */}
        <Text style={styles.inputLabel}>Required Role Category:</Text>
        <View style={styles.categoryRow}>
          {[
            { id: 'cook', label: '🍳 Cook' },
            { id: 'maid', label: '🧹 Maid' },
            { id: 'nanny', label: '👶 Nanny' }
          ].map(c => (
            <TouchableOpacity 
              key={c.id}
              style={[styles.catPill, category === c.id && styles.catPillActive]}
              onPress={() => setCategory(c.id as any)}
            >
              <Text style={[styles.catPillText, category === c.id && styles.catPillTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Salary */}
        <Text style={styles.inputLabel}>Offered Monthly Salary (₹ / Mo):</Text>
        <View style={styles.inputBox}>
          <IndianRupee size={15} color="#15803D" />
          <TextInput 
            style={[styles.textInput, { color: '#15803D', fontWeight: '900', borderBottomWidth: 0 }]}
            keyboardType="number-pad"
            value={salary}
            onChangeText={setSalary}
          />
        </View>

        {/* Society Location */}
        <Text style={styles.inputLabel}>Society Location:</Text>
        <View style={styles.inputBox}>
          <MapPin size={15} color="#1A73E8" />
          <TextInput 
            style={[styles.textInput, { borderBottomWidth: 0 }]}
            value={society}
            onChangeText={setSociety}
          />
        </View>

        {/* Shift Hours */}
        <Text style={styles.inputLabel}>Shift Hours:</Text>
        <TextInput 
          style={styles.textInput}
          value={shiftHours}
          onChangeText={setShiftHours}
        />

        {/* Description */}
        <Text style={styles.inputLabel}>Job Description &amp; Requirements:</Text>
        <TextInput 
          style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
          multiline
          placeholder="e.g. Need experienced cook for 4 members family, hygiene focused..."
          placeholderTextColor="#94A3B8"
          value={description}
          onChangeText={setDescription}
        />

        {/* SUBMIT BUTTON */}
        <TouchableOpacity 
          style={styles.submitBtn}
          onPress={handleSubmitPost}
          disabled={isSubmitting}
        >
          <PlusCircle size={16} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Posting Requisition...' : 'Publish Job Requisition'}
          </Text>
        </TouchableOpacity>

      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },

  headerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  eyebrowText: { fontSize: 9.5, fontWeight: '900', color: '#1A73E8' },
  pageTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  pageSub: { fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 16 },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 16,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  catPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  catPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 18,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
