import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Platform, ScrollView 
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { LanguageProvider, useMobileLanguage, SUPPORTED_LANGUAGES } from './src/context/LanguageContext';

// Lucide Icons for 100% Web Parity Header & Nav
import { 
  Home, Briefcase, Users, PlusCircle, User, Calendar, 
  Building2, Bell, CheckCircle2, Globe, Menu, X, LogOut, ChevronDown, Lock
} from 'lucide-react-native';

import { SplashScreen } from './src/screens/SplashScreen';
import { IntroWalkthroughScreen } from './src/screens/IntroWalkthroughScreen';
import { LanguageSelectScreen } from './src/screens/LanguageSelectScreen';
import { AuthLoginScreen } from './src/screens/AuthLoginScreen';
import { RoleSelectScreen } from './src/screens/RoleSelectScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { EmployerJobsScreen } from './src/routes/employer/EmployerJobsScreen';
import { EmployerWorkersScreen } from './src/routes/employer/EmployerWorkersScreen';
import { EmployerPostJobScreen } from './src/routes/employer/EmployerPostJobScreen';
import { EmployerAccountScreen } from './src/routes/employer/EmployerAccountScreen';
import { EmployerRelocateScreen } from './src/routes/employer/EmployerRelocateScreen';
import { EmployerCheckoutScreen } from './src/routes/employer/EmployerCheckoutScreen';
import { EmployerPricingScreen } from './src/routes/employer/EmployerPricingScreen';
import { EmployerNotificationsScreen } from './src/routes/employer/EmployerNotificationsScreen';
import { EmployerOnboardingScreen } from './src/routes/employer/EmployerOnboardingScreen';

import { WorkerHomeScreen } from './src/routes/worker/WorkerHomeScreen';
import { WorkerJobsScreen } from './src/routes/worker/WorkerJobsScreen';
import { WorkerProfileScreen } from './src/routes/worker/WorkerProfileScreen';
import { WorkerSocietiesScreen } from './src/routes/worker/WorkerSocietiesScreen';
import { WorkerNotificationsScreen } from './src/routes/worker/WorkerNotificationsScreen';
import { WorkerOnboardingScreen } from './src/routes/worker/WorkerOnboardingScreen';
import { WorkerInterviewsScreen } from './src/routes/worker/WorkerInterviewsScreen';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from './src/services/pushNotificationService';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'as', name: 'অসমীয়া', flag: '🇮🇳' }
];

function AppMainContent() {
  const insets = useSafeAreaInsets();
  const [onboardingStep, setOnboardingStep] = useState<
    'splash' | 'intro' | 'language' | 'login' | 'role-select' | 'onboarding' | 'authenticated'
  >('splash');

  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);
  const [role, setRole] = useState<'employer' | 'worker'>('employer');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('standard');
  const { setLanguage, selectedLangObj } = useMobileLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Slide-Down Mobile Header Menu Drawer & Language Dropdown State
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);

  useEffect(() => {
    const initApp = async () => {
      try {
        if (Platform.OS === 'android') {
          await NavigationBar.setButtonStyleAsync('dark').catch(() => {});
        }
        await registerForPushNotificationsAsync();
        
        // Restore real logged-in user session
        const savedSession = await AsyncStorage.getItem('sevikaa_user_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && (parsed.id || parsed.phone || parsed.email)) {
            setCurrentUser(parsed);
            if (parsed.role === 'employer' || parsed.role === 'worker') {
              setRole(parsed.role);
              setOnboardingStep('authenticated');
            }
          }
        }

        const value = await AsyncStorage.getItem('has_seen_intro_v1');
        if (!value) {
          setIsFirstTime(true);
        }
      } catch (e) {
        // ignore
      }
    };
    initApp();
  }, []);

  const handleSplashFinish = () => {
    if (isFirstTime) {
      setOnboardingStep('intro');
    } else {
      setOnboardingStep('language');
    }
  };

  const handleIntroDone = async () => {
    try {
      await AsyncStorage.setItem('has_seen_intro_v1', 'true');
    } catch (e) {}
    setOnboardingStep('language');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('sevikaa_user_session');
    } catch (e) {}
    setShowMobileMenu(false);
    setOnboardingStep('login');
  };

  const renderActiveScreen = () => {
    if (role === 'employer') {
      switch (activeTab) {
        case 'home':
          return <HomeScreen />;
        case 'post-job':
          return <EmployerPostJobScreen onPostSuccess={() => setActiveTab('jobs')} />;
        case 'jobs':
          return <EmployerJobsScreen />;
        case 'workers':
          return <EmployerWorkersScreen />;
        case 'account':
          return (
            <EmployerAccountScreen 
              user={currentUser}
              onLogout={handleLogout}
              onNavigateToRelocate={() => setActiveTab('relocate')}
              onOpenIntroWalkthrough={() => setOnboardingStep('intro')}
            />
          );
        case 'relocate':
          return <EmployerRelocateScreen />;
        case 'pricing':
          return (
            <EmployerPricingScreen 
              onSelectPlan={(planId) => {
                setSelectedPlanId(planId);
                setActiveTab('checkout');
              }}
            />
          );
        case 'checkout':
          return <EmployerCheckoutScreen selectedPlanId={selectedPlanId} />;
        case 'notifications':
          return <EmployerNotificationsScreen onNavigateToJobs={() => setActiveTab('jobs')} />;
        case 'onboarding':
          return <EmployerOnboardingScreen />;
        default:
          return <HomeScreen />;
      }
    } else {
      switch (activeTab) {
        case 'home':
          return <WorkerHomeScreen />;
        case 'jobs':
          return <WorkerJobsScreen />;
        case 'interviews':
          return <WorkerInterviewsScreen onNavigateToJobs={() => setActiveTab('jobs')} />;
        case 'societies':
          return <WorkerSocietiesScreen />;
        case 'profile':
          return <WorkerProfileScreen user={currentUser} onLogout={handleLogout} />;
        case 'notifications':
          return (
            <WorkerNotificationsScreen 
              onNavigateToInterviews={() => setActiveTab('interviews')}
              onNavigateToJobs={() => setActiveTab('jobs')}
              onNavigateToProfile={() => setActiveTab('profile')}
            />
          );
        case 'onboarding':
          return <WorkerOnboardingScreen onComplete={() => setActiveTab('home')} />;
        default:
          return <WorkerHomeScreen />;
      }
    }
  };

  if (onboardingStep === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (onboardingStep === 'intro') {
    return <IntroWalkthroughScreen onDone={handleIntroDone} />;
  }

  if (onboardingStep === 'language') {
    return <LanguageSelectScreen onLanguageSelect={() => setOnboardingStep('login')} />;
  }

  if (onboardingStep === 'login') {
    return (
      <AuthLoginScreen 
        onLoginSuccess={async (identifier, authType, userObj, isExistingUser) => {
          if (userObj) {
            setCurrentUser(userObj);
            try {
              await AsyncStorage.setItem('sevikaa_user_session', JSON.stringify(userObj));
            } catch (e) {}
          }
          if (isExistingUser && userObj?.role) {
            if (userObj.role === 'employer' || userObj.role === 'worker') {
              setRole(userObj.role as 'employer' | 'worker');
              setOnboardingStep('authenticated');
              setActiveTab('home');
              return;
            }
          }
          setOnboardingStep('role-select');
        }} 
      />
    );
  }

  if (onboardingStep === 'role-select') {
    return (
      <RoleSelectScreen 
        onSelectEmployer={() => {
          setRole('employer');
          setOnboardingStep('authenticated');
          setActiveTab('home');
        }}
        onSelectWorker={() => {
          setRole('worker');
          setOnboardingStep('authenticated');
          setActiveTab('home');
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP EXECUTIVE HEADER - 1:1 WEB COPY FROM layout.tsx */}
      <View style={[
        styles.header, 
        { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 12) }
      ]}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerLeftCol}>
            <Text style={styles.brandTitle}>Sevikaa</Text>
            <Text style={styles.brandSubtitle}>
              {role === 'employer' ? 'Employer Hub' : 'Worker Hub'}
            </Text>
          </View>

          <View style={styles.headerRightCol}>
            {/* Status Badge */}
            <View style={[styles.verifiedPill, role === 'worker' && styles.verifiedPillWorker]}>
              <CheckCircle2 size={10} color={role === 'employer' ? '#15803D' : '#166534'} />
              <Text style={[styles.verifiedPillText, role === 'worker' && styles.verifiedPillTextWorker]}>
                {role === 'employer' ? 'Subscribed' : 'Aadhaar Verified'}
              </Text>
            </View>

            {/* Notifications Bell */}
            <TouchableOpacity 
              style={styles.bellBtn}
              onPress={() => setActiveTab('notifications')}
            >
              <Bell size={18} color="#475569" />
              <View style={styles.bellDot} />
            </TouchableOpacity>

            {/* Hamburger Mobile Menu Toggle Button (EXACT WEB MATCH) */}
            <TouchableOpacity 
              style={styles.menuBtn}
              onPress={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X size={18} color="#0F172A" /> : <Menu size={18} color="#0F172A" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* SLIDE-DOWN MOBILE HEADER MENU OVERLAY DRAWER (100% WEB MATCH) */}
        {showMobileMenu && (
          <View style={styles.menuDrawer}>
            <View style={styles.menuDrawerHeader}>
              <View>
                <Text style={styles.menuUserTitle}>
                  {currentUser?.full_name || currentUser?.company_name || currentUser?.phone || currentUser?.email || (role === 'employer' ? 'Employer Household' : 'Domestic Helper')}
                </Text>
                <Text style={styles.menuUserSub}>
                  {role === 'employer' ? 'Gated Society Employer' : 'Verified Domestic Worker'}
                </Text>
              </View>
              <View style={[styles.activeStatusTag, role === 'worker' && styles.activeStatusTagWorker]}>
                <Text style={[styles.activeStatusText, role === 'worker' && styles.activeStatusTextWorker]}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            {/* INLINE LANGUAGE SELECTOR DROPDOWN (100% WEB MATCH) */}
            <View style={styles.langSection}>
              <Text style={styles.langLabel}>App Language:</Text>
              <TouchableOpacity 
                style={styles.langSelectorBtn}
                onPress={() => setShowLangDropdown(!showLangDropdown)}
              >
                <Text style={styles.langFlagText}>{selectedLangObj.flag} {selectedLangObj.name}</Text>
                <ChevronDown size={14} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Expanded Language Choices */}
            {showLangDropdown && (
              <View style={styles.langDropdownList}>
                <ScrollView style={{ maxHeight: 160 }}>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <TouchableOpacity 
                      key={l.code} 
                      style={[styles.langItem, selectedLangObj.code === l.code && styles.langItemActive]}
                      onPress={() => {
                        setLanguage(l.code);
                        setSelectedLang(l);
                        setShowLangDropdown(false);
                      }}
                    >
                      <Text style={styles.langItemText}>{l.flag} {l.name}</Text>
                      {selectedLangObj.code === l.code && <CheckCircle2 size={12} color="#1A73E8" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.menuDivider} />

            {/* LOG OUT SESSION BUTTON (100% WEB MATCH) */}
            <TouchableOpacity 
              style={styles.logoutBtn}
              onPress={handleLogout}
            >
              <LogOut size={16} color="#DC2626" />
              <Text style={styles.logoutText}>Log Out Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* MAIN SCREEN BODY */}
      <View style={styles.body}>
        {renderActiveScreen()}
      </View>

      {/* BOTTOM NAVIGATION TAB BAR WITH EXACT WEB PARITY & LUCIDE ICONS */}
      <View style={[
        styles.bottomNavContainer, 
        { paddingBottom: Math.max(insets.bottom, 12) }
      ]}>
        <View style={styles.bottomNavRow}>
          {role === 'employer' ? (
            <>
              {/* Employer Web NavItem 1: Home */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('home')}>
                <Home size={20} color={activeTab === 'home' ? '#1A73E8' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'home' && styles.navTabLabelActiveEmployer]}>Home</Text>
              </TouchableOpacity>

              {/* Employer Web NavItem 2: Post Job */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('post-job')}>
                <PlusCircle size={20} color={activeTab === 'post-job' ? '#1A73E8' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'post-job' && styles.navTabLabelActiveEmployer]}>Post Job</Text>
              </TouchableOpacity>

              {/* Employer Web NavItem 3: My Jobs */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('jobs')}>
                <Briefcase size={20} color={activeTab === 'jobs' ? '#1A73E8' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'jobs' && styles.navTabLabelActiveEmployer]}>My Jobs</Text>
              </TouchableOpacity>

              {/* Employer Web NavItem 4: Applicants */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('workers')}>
                <Users size={20} color={activeTab === 'workers' ? '#1A73E8' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'workers' && styles.navTabLabelActiveEmployer]}>Applicants</Text>
              </TouchableOpacity>

              {/* Employer Web NavItem 5: Account */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('account')}>
                <User size={20} color={activeTab === 'account' ? '#1A73E8' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'account' && styles.navTabLabelActiveEmployer]}>Account</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Worker Web NavItem 1: Home */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('home')}>
                <Home size={20} color={activeTab === 'home' ? '#34A853' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'home' && styles.navTabLabelActiveWorker]}>Home</Text>
              </TouchableOpacity>

              {/* Worker Web NavItem 2: Jobs */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('jobs')}>
                <Briefcase size={20} color={activeTab === 'jobs' ? '#34A853' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'jobs' && styles.navTabLabelActiveWorker]}>Jobs</Text>
              </TouchableOpacity>

              {/* Worker Web NavItem 3: Interviews */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('interviews')}>
                <Calendar size={20} color={activeTab === 'interviews' ? '#34A853' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'interviews' && styles.navTabLabelActiveWorker]}>Interviews</Text>
              </TouchableOpacity>

              {/* Worker Web NavItem 4: Societies */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('societies')}>
                <Building2 size={20} color={activeTab === 'societies' ? '#34A853' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'societies' && styles.navTabLabelActiveWorker]}>Societies</Text>
              </TouchableOpacity>

              {/* Worker Web NavItem 5: Settings (Profile) */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('profile')}>
                <User size={20} color={activeTab === 'profile' ? '#34A853' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'profile' && styles.navTabLabelActiveWorker]}>Settings</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 16, 
    paddingBottom: 12,
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
    zIndex: 50,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeftCol: { flex: 1 },
  brandTitle: { fontSize: 22, fontWeight: '900', color: '#1A73E8', letterSpacing: 0.5 },
  brandSubtitle: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 1 },
  headerRightCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifiedPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: '#DCFCE7', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  verifiedPillWorker: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  verifiedPillText: { fontSize: 10, fontWeight: '900', color: '#15803D' },
  verifiedPillTextWorker: { color: '#166534' },
  bellBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellDot: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#EA4335' },
  menuBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  menuDrawer: { 
    backgroundColor: '#FFFFFF', 
    marginTop: 12, 
    padding: 14, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  menuDrawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuUserTitle: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  menuUserSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  activeStatusTag: { backgroundColor: '#E8F0FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  activeStatusTagWorker: { backgroundColor: '#E6F4EA' },
  activeStatusText: { fontSize: 9, fontWeight: '900', color: '#1A73E8' },
  activeStatusTextWorker: { color: '#34A853' },
  menuDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  langSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  langLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  langSelectorBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  langFlagText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  langDropdownList: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', marginTop: 8, padding: 4 },
  langItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  langItemActive: { backgroundColor: '#E8F0FE' },
  langItemText: { fontSize: 12, fontWeight: '600', color: '#0F172A' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', paddingVertical: 10, borderRadius: 12 },
  logoutText: { fontSize: 12, fontWeight: '800', color: '#DC2626' },
  body: { flex: 1, backgroundColor: '#F8FAFC' },
  bottomNavContainer: { 
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0', 
    paddingTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  navTab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  navTabLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 4 },
  navTabLabelActiveEmployer: { color: '#1A73E8', fontWeight: '800' },
  navTabLabelActiveWorker: { color: '#34A853', fontWeight: '800' },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppMainContent />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
