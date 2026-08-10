import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Platform, ScrollView, Image 
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { LanguageProvider, useMobileLanguage, SUPPORTED_LANGUAGES } from './src/context/LanguageContext';
import { UserProfileProvider, useUserProfile } from './src/context/UserProfileContext';

// Lucide Icons for 100% Web Parity Header & Nav
import { 
  Home, Briefcase, Users, PlusCircle, User, Calendar, 
  Building2, Bell, CheckCircle2, Globe, Menu, X, LogOut, ChevronDown, Lock, ArrowLeft, Sparkles
} from 'lucide-react-native';

import { SplashScreen } from './src/screens/SplashScreen';
import { IntroWalkthroughScreen } from './src/screens/IntroWalkthroughScreen';
import { LanguageSelectScreen } from './src/screens/LanguageSelectScreen';
import { AuthLoginScreen } from './src/screens/AuthLoginScreen';
import { RoleSelectScreen } from './src/screens/RoleSelectScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InviteWorkersScreen } from './src/screens/InviteWorkersScreen';
import { EmployerJobsScreen } from './src/routes/employer/EmployerJobsScreen';
import { EmployerWorkersScreen } from './src/routes/employer/EmployerWorkersScreen';
import { EmployerPostJobScreen } from './src/routes/employer/EmployerPostJobScreen';
import { EmployerAccountScreen } from './src/routes/employer/EmployerAccountScreen';
import { EmployerRelocateScreen } from './src/routes/employer/EmployerRelocateScreen';
import { EmployerCheckoutScreen } from './src/routes/employer/EmployerCheckoutScreen';
import { EmployerPricingScreen } from './src/routes/employer/EmployerPricingScreen';
import { EmployerNotificationsScreen } from './src/routes/employer/EmployerNotificationsScreen';
import { EmployerOnboardingScreen } from './src/routes/employer/EmployerOnboardingScreen';
import { InvoicesScreen } from './src/screens/InvoicesScreen';

import { WorkerHomeScreen } from './src/routes/worker/WorkerHomeScreen';
import { WorkerJobsScreen } from './src/routes/worker/WorkerJobsScreen';
import { WorkerProfileScreen } from './src/routes/worker/WorkerProfileScreen';
import { WorkerSocietiesScreen } from './src/routes/worker/WorkerSocietiesScreen';
import { WorkerNotificationsScreen } from './src/routes/worker/WorkerNotificationsScreen';
import { WorkerOnboardingScreen } from './src/routes/worker/WorkerOnboardingScreen';
import { WorkerInterviewsScreen } from './src/routes/worker/WorkerInterviewsScreen';
import { WorkerJobDetailsScreen } from './src/routes/worker/WorkerJobDetailsScreen';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from './src/services/pushNotificationService';

function AppMainContent() {
  const insets = useSafeAreaInsets();
  const { setUser, clearProfile } = useUserProfile();
  const [onboardingStep, setOnboardingStep] = useState<
    'splash' | 'intro' | 'language' | 'login' | 'role-select' | 'onboarding' | 'authenticated'
  >('splash');

  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);
  const [role, setRole] = useState<'employer' | 'worker'>('employer');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('standard');
  const [selectedInviteJob, setSelectedInviteJob] = useState<any | null>(null);
  const { language, setLanguage, selectedLangObj, t } = useMobileLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Slide-Down Mobile Header Menu Drawer & Language Dropdown State
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

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
            setUser(parsed);
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
    if (currentUser) {
      setOnboardingStep('authenticated');
    } else {
      setOnboardingStep('language');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('sevikaa_user_session');
      await clearProfile();
    } catch (e) {}
    setShowMobileMenu(false);
    setOnboardingStep('login');
  };

  const [selectedWorkerJobDetail, setSelectedWorkerJobDetail] = useState<any | null>(null);

  const renderActiveScreen = () => {
    if (role === 'employer') {
      switch (activeTab) {
        case 'home':
          return (
            <HomeScreen 
              onNavigateToPostJob={() => setActiveTab('post-job')}
              onNavigateToWorkers={() => setActiveTab('workers')}
              onNavigateToPricing={() => setActiveTab('pricing')}
              onNavigateToRelocate={() => setActiveTab('relocate')}
            />
          );
        case 'post-job':
          return (
            <EmployerPostJobScreen 
              onSuccess={() => setActiveTab('jobs')}
              onNavigateToInvite={(job) => {
                setSelectedInviteJob(job);
                setActiveTab('invite-workers');
              }}
            />
          );
        case 'jobs':
          return (
            <EmployerJobsScreen 
              onNavigateToPostJob={() => setActiveTab('post-job')}
              onNavigateToInvite={(job) => {
                setSelectedInviteJob(job);
                setActiveTab('invite-workers');
              }}
            />
          );
        case 'invite-workers':
          return (
            <InviteWorkersScreen
              job={selectedInviteJob}
              onBack={() => setActiveTab('jobs')}
              onSuccess={() => setActiveTab('jobs')}
            />
          );
        case 'workers':
          return <EmployerWorkersScreen />;
        case 'account':
          return (
            <EmployerAccountScreen 
              user={currentUser}
              onLogout={handleLogout}
              onNavigateToRelocate={() => setActiveTab('relocate')}
              onNavigateToInvoices={() => setActiveTab('invoices')}
              onOpenIntroWalkthrough={() => setOnboardingStep('intro')}
            />
          );
        case 'invoices':
          return <InvoicesScreen onBack={() => setActiveTab('account')} />;
        case 'relocate':
          return (
            <EmployerRelocateScreen 
              onBack={() => setActiveTab('account')}
              onRelocateSuccess={() => setActiveTab('account')}
            />
          );
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
      if (selectedWorkerJobDetail) {
        return (
          <WorkerJobDetailsScreen 
            job={selectedWorkerJobDetail} 
            onBack={() => setSelectedWorkerJobDetail(null)} 
          />
        );
      }

      switch (activeTab) {
        case 'home':
          return (
            <WorkerHomeScreen 
              user={currentUser}
              onNavigateToJobs={() => setActiveTab('jobs')}
              onSelectJobDetail={(job) => setSelectedWorkerJobDetail(job)}
            />
          );
        case 'jobs':
          return (
            <WorkerJobsScreen 
              onSelectJobDetail={(job) => setSelectedWorkerJobDetail(job)}
            />
          );
        case 'interviews':
          return <WorkerInterviewsScreen onNavigateToJobs={() => setActiveTab('jobs')} />;
        case 'societies':
          return <WorkerSocietiesScreen user={currentUser} />;
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
          return (
            <WorkerHomeScreen 
              user={currentUser}
              onNavigateToJobs={() => setActiveTab('jobs')}
              onSelectJobDetail={(job) => setSelectedWorkerJobDetail(job)}
            />
          );
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
    return (
      <LanguageSelectScreen 
        onLanguageSelect={(langCode) => {
          if (langCode) setLanguage(langCode);
          setOnboardingStep('login');
        }} 
      />
    );
  }

  if (onboardingStep === 'login') {
    return (
      <AuthLoginScreen 
        onLoginSuccess={async (identifier, authType, userObj, isExistingUser) => {
          if (userObj) {
            setCurrentUser(userObj);
            setUser(userObj);
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

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0);
  const bottomInset = Math.max(insets.bottom, 10) + (Platform.OS === 'android' ? 8 : 4);

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP EXECUTIVE HEADER */}
      <View style={[styles.header, { paddingTop: topInset + 4 }]}>
        <View style={styles.headerTitleRow}>
          
          {/* Left Side: Back Arrow + Sevikaa Logo + Title */}
          <View style={styles.headerLeftBrandGroup}>
            {activeTab !== 'home' && (
              <TouchableOpacity 
                style={styles.headerBackBtn}
                onPress={() => setActiveTab('home')}
              >
                <ArrowLeft size={18} color="#475569" />
              </TouchableOpacity>
            )}
            <Image 
              source={require('./assets/icon.png')} 
              style={styles.headerBrandLogo} 
              resizeMode="contain" 
            />
            <Text style={styles.headerBrandRoleTitle}>
              {role === 'employer' ? t('roleEmployer', 'Employer') : t('roleWorker', 'Worker')}
            </Text>
          </View>

          {/* Right Side: Status Badge + Bell Notification + Hamburger Menu */}
          <View style={styles.headerRightGroup}>
            {/* Status Badge */}
            <TouchableOpacity 
              style={[
                styles.statusBadgePill, 
                currentUser?.status === 'approved' || currentUser?.status === 'live' ? styles.statusBadgePillVerified : null
              ]}
              onPress={() => setActiveTab('profile')}
            >
              <Lock size={12} color={currentUser?.status === 'approved' || currentUser?.status === 'live' ? '#15803D' : '#B45309'} />
              <Text style={[
                styles.statusBadgeText,
                currentUser?.status === 'approved' || currentUser?.status === 'live' ? styles.statusBadgeTextVerified : null
              ]}>
                {currentUser?.status === 'approved' || currentUser?.status === 'live' ? t('statusVerified', 'Verified') : t('statusPendingAudit', 'Pending Admin Audit')}
              </Text>
            </TouchableOpacity>

            {/* Notifications Bell */}
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => setActiveTab('notifications')}
            >
              <Bell size={18} color="#334155" />
              <View style={styles.headerBellBadgeDot} />
            </TouchableOpacity>

            {/* Hamburger Mobile Menu Button */}
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X size={18} color="#334155" /> : <Menu size={18} color="#334155" />}
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
              <Text style={styles.langLabel}>{t('appLanguageLabel', 'App Language:')}</Text>
              <TouchableOpacity 
                style={styles.langSelectorBtn}
                onPress={() => setShowLangDropdown(!showLangDropdown)}
              >
                {selectedLangObj.icon ? (
                  <Image source={selectedLangObj.icon} style={selectedLangObj.icon ? styles.langIconTiny : undefined} resizeMode="contain" />
                ) : (
                  <Text style={styles.langFlagText}>{selectedLangObj.flag}</Text>
                )}
                <Text style={styles.langFlagText}>{selectedLangObj.name}</Text>
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
                        setShowLangDropdown(false);
                      }}
                    >
                      <View style={styles.langItemLeft}>
                        {l.icon ? (
                          <Image source={l.icon} style={styles.langIconTiny} resizeMode="contain" />
                        ) : (
                          <Text style={styles.langFlagText}>{l.flag}</Text>
                        )}
                        <Text style={styles.langItemText}>{l.name} ({l.nativeName})</Text>
                      </View>
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
              <Text style={styles.logoutText}>{t('logoutSessionBtn', 'Log Out Session')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* MAIN SCREEN BODY */}
      <View style={styles.body}>
        {renderActiveScreen()}
      </View>

      {/* BOTTOM NAVIGATION TAB BAR WITH EXACT WEB PARITY & LUCIDE ICONS */}
      <View style={[styles.bottomNavContainer, { paddingBottom: bottomInset }]}>
        <View style={styles.bottomNavRow}>
          {role === 'employer' ? (
            <>
              {/* Employer Web NavItem 1: Home */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('home')}>
                <Home size={20} color={activeTab === 'home' ? '#1A73E8' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'home' && styles.navTabLabelActiveEmployer]}>{t('navHome', 'Home')}</Text>
              </TouchableOpacity>

              {/* Employer Web NavItem 2: Post Job */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('post-job')}>
                <PlusCircle size={20} color={activeTab === 'post-job' ? '#1A73E8' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'post-job' && styles.navTabLabelActiveEmployer]}>{t('navPostJob', 'Post Job')}</Text>
              </TouchableOpacity>

              {/* Employer Web NavItem 3: My Jobs */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('jobs')}>
                <Briefcase size={20} color={activeTab === 'jobs' ? '#1A73E8' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'jobs' && styles.navTabLabelActiveEmployer]}>{t('navMyJobs', 'My Jobs')}</Text>
              </TouchableOpacity>

              {/* Employer Web NavItem 4: Applicants */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('workers')}>
                <Users size={20} color={activeTab === 'workers' ? '#1A73E8' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'workers' && styles.navTabLabelActiveEmployer]}>{t('navApplicants', 'Applicants')}</Text>
              </TouchableOpacity>

              {/* Employer Web NavItem 5: Account */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('account')}>
                <User size={20} color={activeTab === 'account' ? '#1A73E8' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'account' && styles.navTabLabelActiveEmployer]}>{t('navAccount', 'Account')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Worker Web NavItem 1: Home */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('home')}>
                <Home size={20} color={activeTab === 'home' ? '#34A853' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'home' && styles.navTabLabelActiveWorker]}>{t('navHome', 'Home')}</Text>
              </TouchableOpacity>

              {/* Worker Web NavItem 2: Jobs */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('jobs')}>
                <Briefcase size={20} color={activeTab === 'jobs' ? '#34A853' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'jobs' && styles.navTabLabelActiveWorker]}>{t('navJobs', 'Jobs')}</Text>
              </TouchableOpacity>

              {/* Worker Web NavItem 3: Interviews */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('interviews')}>
                <Calendar size={20} color={activeTab === 'interviews' ? '#34A853' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'interviews' && styles.navTabLabelActiveWorker]}>{t('navInterviews', 'Interviews')}</Text>
              </TouchableOpacity>

              {/* Worker Web NavItem 4: Societies */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('societies')}>
                <Building2 size={20} color={activeTab === 'societies' ? '#34A853' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'societies' && styles.navTabLabelActiveWorker]}>{t('navSocieties', 'Societies')}</Text>
              </TouchableOpacity>

              {/* Worker Web NavItem 5: Settings (Profile) */}
              <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('profile')}>
                <User size={20} color={activeTab === 'profile' ? '#34A853' : '#64748B'} />
                <Text style={[styles.navTabLabel, activeTab === 'profile' && styles.navTabLabelActiveWorker]}>{t('navSettings', 'Settings')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 16, 
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
    zIndex: 9999,
    position: 'relative',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeftBrandGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBackBtn: { paddingRight: 2, paddingVertical: 2 },
  headerBrandLogo: { width: 28, height: 28 },
  headerBrandRoleTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', letterSpacing: -0.2 },
  headerRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusBadgePill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: '#FFFBEB', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  statusBadgePillVerified: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statusBadgeText: { fontSize: 11, fontWeight: '900', color: '#B45309' },
  statusBadgeTextVerified: { color: '#15803D' },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  headerBellBadgeDot: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  menuDrawer: { 
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    zIndex: 10000,
    backgroundColor: '#FFFFFF', 
    marginTop: 8, 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
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
  langIconTiny: { width: 20, height: 20, borderRadius: 5 },
  langItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langDropdownList: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', marginTop: 8, padding: 4 },
  langItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  langItemActive: { backgroundColor: '#E8F0FE' },
  langItemText: { fontSize: 12, fontWeight: '600', color: '#0F172A' },
  introTourBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingVertical: 10, borderRadius: 12 },
  introTourText: { fontSize: 12, fontWeight: '800', color: '#1A73E8' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', paddingVertical: 10, borderRadius: 12 },
  logoutText: { fontSize: 12, fontWeight: '800', color: '#DC2626' },
  body: { flex: 1, backgroundColor: '#F8FAFC', zIndex: 1 },
  bottomNavContainer: { 
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0', 
    paddingTop: 8,
    paddingBottom: 8,
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
        <UserProfileProvider>
          <AppMainContent />
        </UserProfileProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
