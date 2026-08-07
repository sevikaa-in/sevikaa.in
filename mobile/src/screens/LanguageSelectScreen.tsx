import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, SafeAreaView, StatusBar, Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  badgeSymbol: string;
  icon?: any;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', badgeSymbol: 'A', icon: require('../../assets/icons/languages/en.png') },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', badgeSymbol: 'अ', icon: require('../../assets/icons/languages/hi.png') },
  { code: 'hn', name: 'Hinglish', nativeName: 'Hinglish', badgeSymbol: 'A/अ', icon: require('../../assets/icons/languages/hn.png') },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', badgeSymbol: 'ಅ', icon: require('../../assets/icons/languages/kn.png') },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', badgeSymbol: 'அ', icon: require('../../assets/icons/languages/ta.png') },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', badgeSymbol: 'ಅ', icon: require('../../assets/icons/languages/te.png') },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', badgeSymbol: 'অ', icon: require('../../assets/icons/languages/as.png') },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', badgeSymbol: 'অ', icon: require('../../assets/icons/languages/ne.png') },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', badgeSymbol: 'অ', icon: require('../../assets/icons/languages/bn.jpg') },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', badgeSymbol: 'अ', icon: require('../../assets/icons/languages/mr.png') },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', badgeSymbol: 'അ', icon: require('../../assets/icons/languages/ml.png') },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', badgeSymbol: 'ଅ', icon: require('../../assets/icons/languages/or.png') },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', badgeSymbol: 'અ', icon: require('../../assets/icons/languages/gu.png') },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', badgeSymbol: 'ਅ', icon: require('../../assets/icons/languages/pa.png') },
];

interface LanguageSelectProps {
  onSelectLanguage?: (langCode: string) => void;
  onLanguageSelect?: (langCode?: string) => void;
}

export const LanguageSelectScreen: React.FC<LanguageSelectProps> = ({ onSelectLanguage, onLanguageSelect }) => {
  const insets = useSafeAreaInsets();
  const [selectedCode, setSelectedCode] = useState<string>('en');

  const selectedObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedCode) || SUPPORTED_LANGUAGES[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER BRANDING */}
        <View style={styles.header}>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>🌐 LANGUAGE PREFERENCE</Text>
          </View>
          
          <View style={styles.logoRow}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </View>
          <Text style={styles.title}>Choose Your Preferred Language</Text>
          <Text style={styles.subtitle}>
            Select your language to view worker profiles, audio bios &amp; gated society job posts in your regional script.
          </Text>
        </View>

        {/* CENTER-ALIGNED 2-COLUMN LANGUAGE CARDS GRID */}
        <View style={styles.languageGrid}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedCode === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                activeOpacity={0.85}
                style={[styles.langCard, isSelected && styles.langCardSelected]}
                onPress={() => setSelectedCode(lang.code)}
              >
                {/* CORNER SELECTION BADGE */}
                <View style={styles.cornerBadgeWrapper}>
                  {isSelected ? (
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  ) : (
                    <View style={styles.radioUnchecked} />
                  )}
                </View>

                {/* CENTERED LARGE ICON / BADGE */}
                {lang.icon ? (
                  <Image source={lang.icon} style={styles.langIcon} resizeMode="contain" />
                ) : (
                  <View style={styles.badgeSymbolCircle}>
                    <Text style={styles.badgeSymbolText}>{lang.badgeSymbol}</Text>
                  </View>
                )}

                {/* CENTERED PROMINENT NATIVE SCRIPT TEXT */}
                <Text style={[styles.langNativeName, isSelected && styles.langNativeNameSelected]}>
                  {lang.nativeName}
                </Text>
                <Text style={styles.langEnglishName}>{lang.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* FOOTER & CONTINUE BUTTON - ADAPTIVE SAFE AREA PADDING */}
      <View style={[
        styles.footerContainer, 
        { paddingBottom: Math.max(insets.bottom, 28) }
      ]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.continueBtn}
          onPress={() => {
            if (onLanguageSelect) onLanguageSelect(selectedCode);
            if (onSelectLanguage) onSelectLanguage(selectedCode);
          }}
        >
          <Text style={styles.continueBtnText}>
            Continue in {selectedObj.name} ({selectedObj.nativeName}) →
          </Text>
        </TouchableOpacity>
        <Text style={styles.stepFooter}>Step 1 of 4 • Sevikaa Multi-Lingual Setup</Text>
      </View>
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
    paddingHorizontal: 16,
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
    marginBottom: 8,
  },
  logoImage: {
    width: 140,
    height: 44,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  langCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  langCardSelected: {
    borderColor: '#1A73E8',
    backgroundColor: '#F0F6FF',
    borderWidth: 2,
    shadowColor: '#1A73E8',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cornerBadgeWrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  langIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeSymbolCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeSymbolText: {
    color: '#1A73E8',
    fontSize: 20,
    fontWeight: '900',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  radioUnchecked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  langNativeName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  langNativeNameSelected: {
    color: '#1A73E8',
  },
  langEnglishName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  continueBtn: {
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
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  stepFooter: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 10,
  },
});
