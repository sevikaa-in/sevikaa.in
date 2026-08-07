import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView 
} from 'react-native';
import { DocumentUploadCard } from '../../components/DocumentUploadCard';

export const EmployerOnboardingScreen: React.FC = () => {
  const [step, setStep] = useState<number>(1);

  // Step 1: Personal & Contact Details
  const [fullName, setFullName] = useState('Verma Household');
  const [phone, setPhone] = useState('9876543210');
  const [altPhone, setAltPhone] = useState('9876511223');
  const [email, setEmail] = useState('employer@sevikaa.in');
  const [phoneVerified, setPhoneVerified] = useState(true);

  // Step 2: Gated Society Address
  const [society, setSociety] = useState('DLF Westend Heights');
  const [towerBlock, setTowerBlock] = useState('Tower B - Flat 402');
  const [address, setAddress] = useState('Flat 402, Begur Main Road, Bengaluru');

  // Step 3: Required Roles & Budget
  const [requiredRoles, setRequiredRoles] = useState<string[]>(['Cook', 'Maid']);
  const [monthlyBudget, setMonthlyBudget] = useState('18000');

  // Step 4: Residency Proof Upload
  const [residencyUrl, setResidencyUrl] = useState('');

  const DEFAULT_SOCIETIES = [
    'DLF Westend Heights',
    'Prestige Shantiniketan',
    'Sobha Royal Pavilion',
    'Godrej Eternity',
    'Brigade Metropolis',
    'Purva Venezia',
    'Adarsh Palm Retreat',
  ];

  const toggleRole = (role: string) => {
    setRequiredRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        Alert.alert("Missing Name", "Please enter your full name.");
        return;
      }
      if (phone.replace(/\D/g, '').length !== 10) {
        Alert.alert("Invalid Phone", "Please enter a valid 10-digit mobile number.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim() || !emailRegex.test(email.trim())) {
        Alert.alert("Invalid Email", "Please enter a valid email address for receiving tax invoices.");
        return;
      }
    }

    if (step === 2 && !society.trim()) {
      Alert.alert("Missing Society", "Please enter or select your primary gated society.");
      return;
    }

    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      Alert.alert("Onboarding Completed! 🟢", "Your gated society residency details & employer profile have been verified.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* FUNNEL HEADER & PROGRESS TRACK */}
        <View style={styles.header}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>STEP {step} OF 4 • HOUSEHOLD VERIFICATION ONBOARDING</Text>
          </View>
          <Text style={styles.title}>Complete Your Employer Profile</Text>
          <Text style={styles.subtitle}>
            Verify your gated society residency details to hire verified Cooks, Maids &amp; Nannies.
          </Text>

          {/* STEP PROGRESS BAR */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
          </View>
        </View>

        {/* STEP 1: PERSONAL & CONTACT DETAILS */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>👤 Step 1: Employer Contact Details</Text>

            <Text style={styles.label}>FULL NAME / HOUSEHOLD NAME</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Verma Household" 
              placeholderTextColor="#94A3B8"
              value={fullName} 
              onChangeText={(txt) => setFullName(txt.replace(/[^a-zA-Z\s]/g, ''))} 
            />

            <View style={styles.labelRowBetween}>
              <Text style={styles.label}>PRIMARY MOBILE NUMBER (+91)</Text>
              {phoneVerified && <Text style={styles.verifiedText}>✓ Verified 🟢</Text>}
            </View>
            <TextInput 
              style={styles.input} 
              placeholder="10-digit Mobile Number" 
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone} 
              onChangeText={(txt) => setPhone(txt.replace(/\D/g, ''))} 
            />

            <Text style={styles.label}>ALTERNATE CONTACT NUMBER (OPTIONAL)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="10-digit Alternate Phone" 
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={altPhone} 
              onChangeText={(txt) => setAltPhone(txt.replace(/\D/g, ''))} 
            />

            <Text style={styles.label}>EMAIL ADDRESS (FOR TAX INVOICES &amp; RECEIPTS)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="name@domain.com" 
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email} 
              onChangeText={setEmail} 
            />
          </View>
        )}

        {/* STEP 2: GATED SOCIETY ADDRESS */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>🏙️ Step 2: Gated Society Address</Text>

            <Text style={styles.label}>PRIMARY GATED SOCIETY NAME</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. DLF Westend Heights" 
              placeholderTextColor="#94A3B8"
              value={society} 
              onChangeText={setSociety} 
            />

            {/* POPULAR SOCIETIES CHIPS */}
            <Text style={styles.label}>POPULAR VERIFIED SOCIETIES</Text>
            <View style={styles.chipRow}>
              {DEFAULT_SOCIETIES.map((soc) => (
                <TouchableOpacity
                  key={soc}
                  style={[styles.chip, society === soc && styles.chipActive]}
                  onPress={() => setSociety(soc)}
                >
                  <Text style={[styles.chipText, society === soc && styles.chipTextActive]}>
                    {society === soc ? '✓ ' : ''}{soc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>TOWER / FLAT NUMBER</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Tower B - Flat 402" 
              placeholderTextColor="#94A3B8"
              value={towerBlock} 
              onChangeText={setTowerBlock} 
            />

            <Text style={styles.label}>COMPLETE RESIDENTIAL ADDRESS</Text>
            <TextInput 
              style={[styles.input, { height: 60 }]} 
              multiline
              placeholder="Flat address, road name, locality..." 
              placeholderTextColor="#94A3B8"
              value={address} 
              onChangeText={setAddress} 
            />
          </View>
        )}

        {/* STEP 3: REQUIRED HELP & BUDGET */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>🧹 Step 3: Staff Requirements &amp; Budget</Text>

            <Text style={styles.label}>WHAT STAFF DO YOU NEED?</Text>
            <View style={styles.chipRow}>
              {['Cook', 'Maid', 'Nanny'].map((role) => {
                const isSelected = requiredRoles.includes(role);
                return (
                  <TouchableOpacity
                    key={role}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => toggleRole(role)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {isSelected ? '✓ ' : ''}{role}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>ESTIMATED MONTHLY BUDGET (INR ₹)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="18000" 
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={monthlyBudget} 
              onChangeText={setMonthlyBudget} 
            />
          </View>
        )}

        {/* STEP 4: RESIDENCY PROOF */}
        {step === 4 && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>📄 Step 4: Society Residency Verification</Text>
            <Text style={styles.cardSub}>Upload your maintenance bill or RWA entry pass to verify residency.</Text>

            <DocumentUploadCard 
              title="Residency Proof / Maintenance Bill"
              description="Upload maintenance bill or society pass photo."
              docType="residency_proof"
              currentUrl={residencyUrl}
              onUploadSuccess={setResidencyUrl}
            />
          </View>
        )}

        {/* NAVIGATION BUTTONS */}
        <View style={styles.btnRow}>
          {step > 1 && (
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={() => setStep(prev => prev - 1)}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.nextBtn, step === 1 && { flex: 1 }]}
            onPress={handleNextStep}
          >
            <Text style={styles.nextBtnText}>
              {step === 4 ? 'Complete Onboarding & Start Hiring 🚀' : `Continue to Step ${step + 1} →`}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 28 },
  header: { marginBottom: 16 },
  stepBadge: {
    backgroundColor: '#E8F0FE',
    borderWidth: 1,
    borderColor: '#D2E3FC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  stepBadgeText: { color: '#1A73E8', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 12 },
  progressTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#1A73E8', borderRadius: 3 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 18, marginBottom: 16 },
  cardHeader: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.8, marginTop: 12, marginBottom: 6 },
  labelRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 6 },
  verifiedText: { color: '#137333', fontSize: 10, fontWeight: '900' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontWeight: '700', color: '#0F172A' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: '#E8F0FE', borderColor: '#1A73E8' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: '#1A73E8', fontWeight: '900' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  backBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center' },
  backBtnText: { color: '#475569', fontSize: 14, fontWeight: '800' },
  nextBtn: { flex: 1, backgroundColor: '#1A73E8', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  nextBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
