import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, Text, View, Animated, StatusBar, Image, SafeAreaView, Easing 
} from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pulseRingScale = useRef(new Animated.Value(1)).current;
  const pulseRingOpacity = useRef(new Animated.Value(0.6)).current;
  
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  
  const rolesTranslateY = useRef(new Animated.Value(25)).current;
  const rolesOpacity = useRef(new Animated.Value(0)).current;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  const loadingMessages = [
    'Connecting to Sevikaa Secure Network...',
    'Loading Verified Household Profiles...',
    'Initializing Multi-Lingual Engine...',
    'Welcome to Sevikaa!'
  ];

  useEffect(() => {
    let hasFinished = false;
    const safeFinish = () => {
      if (!hasFinished) {
        hasFinished = true;
        onFinish();
      }
    };

    // 1. Continuous pulsing glow ring loop
    Animated.loop(
      Animated.parallel([
        Animated.timing(pulseRingScale, {
          toValue: 1.35,
          duration: 1600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseRingOpacity, {
          toValue: 0,
          duration: 1600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // 2. Staggered logo & text animations
    Animated.sequence([
      // Logo bounce in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 50,
          useNativeDriver: false,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
      ]),
      // Title slide up
      Animated.parallel([
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: false,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
      // Role chips slide up
      Animated.parallel([
        Animated.timing(rolesTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(rolesOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    // 3. Smooth Progress Bar fill (0% -> 100% in 3.2s)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3200,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      setTimeout(safeFinish, 400);
    });

    // Cycle status messages
    const msgInterval = setInterval(() => {
      setLoadingTextIndex(prev => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 750);

    const fallbackTimer = setTimeout(safeFinish, 3800);

    return () => {
      clearInterval(msgInterval);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* AMBIENT BACKGROUND GLOW BLOBS */}
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      {/* MAIN CENTERED LOGO & BRANDING */}
      <View style={styles.centerContainer}>
        
        {/* LOGO WITH PULSING RING */}
        <View style={styles.logoWrapper}>
          <Animated.View 
            style={[
              styles.pulseRing, 
              { transform: [{ scale: pulseRingScale }], opacity: pulseRingOpacity }
            ]} 
          />
          <Animated.View 
            style={[
              styles.logoCircle, 
              { transform: [{ scale: logoScale }], opacity: logoOpacity }
            ]}
          >
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </Animated.View>
        </View>

        {/* BRAND TITLE & VERIFIED BADGE */}
        <Animated.View 
          style={{
            transform: [{ translateY: titleTranslateY }],
            opacity: titleOpacity,
            alignItems: 'center',
          }}
        >
          <View style={styles.trustTag}>
            <Text style={styles.trustTagText}>🛡️ GOVT AADHAAR VERIFIED</Text>
          </View>

          <Text style={styles.brandTitle}>Sevikaa</Text>
          <Text style={styles.brandSubtitle}>India's Trusted Domestic Helper Platform</Text>
        </Animated.View>

        {/* 3 CORE DOMESTIC ROLES */}
        <Animated.View 
          style={[
            styles.rolesRow, 
            { transform: [{ translateY: rolesTranslateY }], opacity: rolesOpacity }
          ]}
        >
          <View style={[styles.roleChip, { backgroundColor: '#E8F0FE', borderColor: '#BFDBFE' }]}>
            <Text style={styles.roleEmoji}>🍳</Text>
            <Text style={[styles.roleChipText, { color: '#1A73E8' }]}>COOK</Text>
          </View>

          <View style={[styles.roleChip, { backgroundColor: '#E6F4EA', borderColor: '#BBF7D0' }]}>
            <Text style={styles.roleEmoji}>🧹</Text>
            <Text style={[styles.roleChipText, { color: '#137333' }]}>MAID</Text>
          </View>

          <View style={[styles.roleChip, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <Text style={styles.roleEmoji}>👶</Text>
            <Text style={[styles.roleChipText, { color: '#B45309' }]}>NANNY</Text>
          </View>
        </Animated.View>
      </View>

      {/* BOTTOM LOADING PROGRESS BAR */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <Text style={styles.progressMessage}>{loadingMessages[loadingTextIndex]}</Text>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>POWERED BY</Text>
        <Image 
          source={require('../../assets/ygayatra.png')} 
          style={styles.ygayatraLogo} 
          resizeMode="contain" 
        />
        <Text style={styles.footerCompany}>YugaYatra Retail (OPC) Pvt.Ltd</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  brandAccentBar: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  accentStrip: {
    flex: 1,
    height: '100%',
  },
  bgGlowTop: {
    position: 'absolute',
    top: -80,
    left: '20%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(26, 115, 232, 0.08)',
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: 40,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(52, 168, 83, 0.06)',
  },
  centerContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(26, 115, 232, 0.3)',
  },
  logoCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  trustTag: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  trustTagText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  rolesRow: {
    flexDirection: 'row',
    marginTop: 26,
    gap: 10,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  roleEmoji: {
    fontSize: 14,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  progressContainer: {
    width: '82%',
    alignItems: 'center',
    marginVertical: 20,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1A73E8',
    borderRadius: 3,
  },
  progressMessage: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  ygayatraLogo: {
    width: 130,
    height: 30,
  },
  footerCompany: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});
