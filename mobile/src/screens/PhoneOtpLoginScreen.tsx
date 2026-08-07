import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

interface PhoneOtpLoginProps {
  onLoginSuccess: (phone: string) => void;
}

export const PhoneOtpLoginScreen: React.FC<PhoneOtpLoginProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert("Invalid Phone Number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      // Simulate DLT SMS OTP dispatch
      setTimeout(() => {
        setOtpSent(true);
        setLoading(false);
        Alert.alert("OTP Sent 📩", `Verification code sent to +91 ${phone.slice(-10)}.`);
      }, 1000);
    } catch (e) {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) {
      Alert.alert("Invalid OTP", "Please enter the verification code sent to your phone.");
      return;
    }
    onLoginSuccess(phone);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Sevikaa</Text>
        <Text style={styles.title}>{otpSent ? 'Enter OTP Code' : 'Mobile Login & Sign Up'}</Text>
        <Text style={styles.subtitle}>
          {otpSent 
            ? `Enter 6-digit code sent to +91 ${phone.slice(-10)}` 
            : 'Enter your 10-digit mobile number to receive OTP'}
        </Text>
      </View>

      <View style={styles.form}>
        {!otpSent ? (
          <View style={styles.inputBox}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput 
              style={styles.input}
              placeholder="98765 43210"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        ) : (
          <View style={styles.inputBox}>
            <TextInput 
              style={[styles.input, { letterSpacing: 8, fontSize: 20, textAlign: 'center' }]}
              placeholder="••••••"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
          </View>
        )}

        <TouchableOpacity 
          style={styles.primaryBtn}
          onPress={!otpSent ? handleSendOtp : handleVerifyOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>{!otpSent ? 'Send OTP Code ⚡' : 'Verify & Continue →'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Step 2 of 4 • DLT SMS Verified Registration</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24, justifyContent: 'space-between' },
  header: { marginTop: 40 },
  brand: { fontSize: 32, fontWeight: '900', color: '#1A73E8', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
  form: { marginTop: 32 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  prefix: { fontSize: 16, fontWeight: '800', color: '#1A73E8', marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0F172A' },
  primaryBtn: {
    backgroundColor: '#1A73E8',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  footer: { textAlign: 'center', color: '#94A3B8', fontSize: 11, fontWeight: '700', marginBottom: 12 },
});
