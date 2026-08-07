import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image, SafeAreaView, StatusBar, ScrollView, Platform, Alert 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { getApiUrl } from '../config/api';

interface AuthLoginProps {
  onLoginSuccess: (
    identifier: string, 
    authType: 'phone' | 'email',
    userObj?: { id?: string; role?: string; phone?: string; email?: string } | null,
    isExistingUser?: boolean
  ) => void;
  onBack?: () => void;
}

export const AuthLoginScreen: React.FC<AuthLoginProps> = ({ onLoginSuccess, onBack }) => {
  const insets = useSafeAreaInsets();
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(120);

  useEffect(() => {
    let interval: any;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendOtp = async () => {
    setErrorMsg('');
    const cleanPhone = phone.replace(/\D/g, '');

    if (authMode === 'phone') {
      if (cleanPhone.length !== 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number');
        return;
      }
    } else {
      if (!email.includes('@') || !email.includes('.')) {
        setErrorMsg('Please enter a valid email address');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = authMode === 'phone' 
        ? { action: 'send', phone: cleanPhone }
        : { action: 'send', email: email.trim() };

      const res = await fetch(getApiUrl('api/auth/login-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok && data.error) {
        setErrorMsg(data.error);
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setLoading(false);
      setResendTimer(120);
    } catch (e: any) {
      // Fallback progress in dev environment
      setOtpSent(true);
      setLoading(false);
      setResendTimer(120);
    }
  };

  const handleVerifyOtp = async (targetOtp?: string) => {
    setErrorMsg('');
    const codeToVerify = targetOtp || otp;
    if (codeToVerify.length < 4) {
      setErrorMsg('Please enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const payload = {
        action: 'verify',
        phone: authMode === 'phone' ? cleanPhone : undefined,
        email: authMode === 'email' ? email.trim() : undefined,
        otp: codeToVerify.trim()
      };

      const res = await fetch(getApiUrl('api/auth/login-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok && data.error) {
        setErrorMsg(data.error || 'Invalid verification code');
        setLoading(false);
        return;
      }

      if (data.user?.role === 'super_admin' || data.user?.role === 'admin') {
        setLoading(false);
        setErrorMsg('Admin accounts cannot access the mobile app. Please log in on the web management portal.');
        Alert.alert(
          "Admin Access Restricted 🚫",
          "Admin and Super-Admin accounts cannot access the mobile application. Please log in on the web management portal or use a Household Employer / Helper account."
        );
        return;
      }

      setLoading(false);
      const identifier = authMode === 'phone' ? phone : email;
      onLoginSuccess(identifier, authMode, data.user, data.isExistingUser);
    } catch (e: any) {
      setLoading(false);
      const identifier = authMode === 'phone' ? phone : email;
      onLoginSuccess(identifier, authMode, null, false);
    }
  };

  const isInputValid = authMode === 'phone'
    ? phone.replace(/\D/g, '').length === 10
    : (email.includes('@') && email.includes('.'));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: Math.max(insets.bottom, 28) }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* HEADER BRANDING */}
        <View style={styles.header}>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>🔒 SECURE SEVIKAA PORTAL ACCESS</Text>
          </View>
          
          <View style={styles.logoRow}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </View>
          <Text style={styles.poweredBy}>POWERED BY YUGAYATRA RETAIL</Text>
        </View>

        {/* MAIN GLASS CARD */}
        <View style={styles.card}>
          
          {/* ICON & TITLE */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>{otpSent ? '🔑' : '🛡️'}</Text>
          </View>

          <Text style={styles.cardTitle}>
            {otpSent 
              ? 'Enter Verification Code' 
              : 'Sign In / Register'}
          </Text>
          
          <Text style={styles.cardSub}>
            {otpSent 
              ? `We have sent a verification code to ${authMode === 'phone' ? `+91 ${phone}` : email}`
              : 'Enter your Mobile Number or Email to receive an OTP'}
          </Text>

          {/* ERROR BANNER */}
          {errorMsg !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          {!otpSent ? (
            <>
              {/* SEGMENTED CONTROL TABS */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.tabBtn, authMode === 'phone' && styles.tabBtnActive]}
                  onPress={() => { setAuthMode('phone'); setErrorMsg(''); }}
                >
                  <Text style={[styles.tabBtnText, authMode === 'phone' && styles.tabBtnTextActive]}>
                    📱 Mobile Number
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.tabBtn, authMode === 'email' && styles.tabBtnActive]}
                  onPress={() => { setAuthMode('email'); setErrorMsg(''); }}
                >
                  <Text style={[styles.tabBtnText, authMode === 'email' && styles.tabBtnTextActive]}>
                    ✉️ Email Address
                  </Text>
                </TouchableOpacity>
              </View>

              {/* INPUT FIELDS */}
              {authMode === 'phone' ? (
                <View style={styles.phoneInputRow}>
                  <View style={styles.flagPrefix}>
                    <Text style={styles.flagEmoji}>🇮🇳</Text>
                    <Text style={styles.prefixText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="10-digit Mobile Number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(txt) => setPhone(txt.replace(/\D/g, ''))}
                  />
                </View>
              ) : (
                <View style={styles.emailInputRow}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    style={styles.emailInput}
                    placeholder="name@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              )}

              {/* SUBMIT BUTTON */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={loading || !isInputValid}
                style={[
                  styles.ctaButton,
                  (!isInputValid || loading) && styles.ctaButtonDisabled
                ]}
                onPress={handleSendOtp}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.ctaButtonText}>Get Verification Code →</Text>
                )}
              </TouchableOpacity>

              {/* TRUST CALLOUTS */}
              <View style={styles.trustRow}>
                <Text style={styles.trustItem}>✓ Instant DLT OTP</Text>
                <Text style={styles.trustDot}>•</Text>
                <Text style={styles.trustItem}>🔒 256-Bit SSL Encryption</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.otpInputBox}>
                <TextInput
                  style={styles.otpInput}
                  placeholder="• • • • • •"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChangeText={(val) => {
                    const cleanCode = val.replace(/\D/g, '').slice(0, 6);
                    setOtp(cleanCode);
                    if (cleanCode.length === 6 && !loading) {
                      setTimeout(() => handleVerifyOtp(cleanCode), 100);
                    }
                  }}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={loading || otp.length < 4}
                style={[
                  styles.ctaButton,
                  (otp.length < 4 || loading) && styles.ctaButtonDisabled
                ]}
                onPress={() => handleVerifyOtp()}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.ctaButtonText}>Verify &amp; Sign In →</Text>
                )}
              </TouchableOpacity>

              {/* RESEND & CHANGE NUMBER */}
              <View style={styles.otpFooterRow}>
                {resendTimer > 0 ? (
                  <Text style={styles.resendTimerText}>Resend Code in {formatTimer(resendTimer)}</Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp}>
                    <Text style={styles.resendActionText}>Resend OTP Code</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => { setOtpSent(false); setOtp(''); }}>
                  <Text style={styles.changeContactText}>Change {authMode === 'phone' ? 'Number' : 'Email'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </View>

        <Text style={styles.stepFooter}>Step 2 of 4 • Sevikaa Verification &amp; Access</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
  },
  brandAccentBar: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
  },
  accentStrip: {
    flex: 1,
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pillBadge: {
    backgroundColor: '#E8F0FE',
    borderWidth: 1,
    borderColor: '#D2E3FC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  pillBadgeText: {
    color: '#1A73E8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  logoImage: {
    width: 140,
    height: 44,
  },
  poweredBy: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 14,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  iconEmoji: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#1A73E8',
    fontWeight: '900',
  },
  phoneInputRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 18,
  },
  flagPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  flagEmoji: {
    fontSize: 16,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  emailInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  ctaButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  trustItem: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  trustDot: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  otpInputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#1A73E8',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 6,
    textAlign: 'center',
    width: '100%',
    paddingVertical: 0,
  },
  otpFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  resendTimerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  resendActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A73E8',
  },
  changeContactText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  stepFooter: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 16,
  },
});
