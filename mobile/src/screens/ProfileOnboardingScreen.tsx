import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';

interface ProfileOnboardingProps {
  role: 'employer' | 'worker';
  onComplete: () => void;
}

export const ProfileOnboardingScreen: React.FC<ProfileOnboardingProps> = ({ role, onComplete }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [society, setSociety] = useState('DLF Westend Heights');
  const [category, setCategory] = useState('Cook');

  const handleFinish = () => {
    if (!fullName.trim()) {
      Alert.alert("Missing Name", "Please enter your full name to complete setup.");
      return;
    }
    onComplete();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.brand}>Sevikaa</Text>
        <Text style={styles.title}>
          {role === 'employer' ? 'Household Employer Profile' : 'Domestic Helper Profile'}
        </Text>
        <Text style={styles.subtitle}>Complete your profile details to unlock verified platform access.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>FULL NAME</Text>
        <TextInput 
          style={styles.input}
          placeholder="e.g. Verma Household or Lakshmi Devi"
          placeholderTextColor="#94A3B8"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>EMAIL ADDRESS (OPTIONAL)</Text>
        <TextInput 
          style={styles.input}
          placeholder="user@sevikaa.in"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>PRIMARY GATED SOCIETY</Text>
        <TextInput 
          style={styles.input}
          placeholder="e.g. DLF Westend Heights, Begur Road"
          placeholderTextColor="#94A3B8"
          value={society}
          onChangeText={setSociety}
        />

        {role === 'worker' && (
          <>
            <Text style={styles.label}>PRIMARY ROLE / SKILL</Text>
            <TextInput 
              style={styles.input}
              placeholder="Cook, Maid, Nanny"
              placeholderTextColor="#94A3B8"
              value={category}
              onChangeText={setCategory}
            />
          </>
        )}

        <TouchableOpacity 
          style={[styles.finishBtn, role === 'worker' && styles.finishBtnWorker]}
          onPress={handleFinish}
        >
          <Text style={styles.finishBtnText}>Complete Profile &amp; Launch Dashboard 🚀</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Step 4 of 4 • Profile Setup Complete</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24, justifyContent: 'space-between', flexGrow: 1 },
  header: { marginTop: 24 },
  brand: { fontSize: 32, fontWeight: '900', color: '#1A73E8', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  form: { marginTop: 24 },
  label: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.8, marginBottom: 6 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  finishBtn: {
    backgroundColor: '#1A73E8',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  finishBtnWorker: { backgroundColor: '#34A853' },
  finishBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  footer: { textAlign: 'center', color: '#94A3B8', fontSize: 11, fontWeight: '700', marginVertical: 16 },
});
