import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, SafeAreaView } from 'react-native';

interface IntroWalkthroughProps {
  onFinishIntro?: () => void;
  onDone?: () => void;
  onFinish?: () => void;
}

export const IntroWalkthroughScreen: React.FC<IntroWalkthroughProps> = ({ onFinishIntro, onDone, onFinish }) => {
  const handleComplete = () => {
    if (onDone) onDone();
    if (onFinishIntro) onFinishIntro();
    if (onFinish) onFinish();
  };
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: "Verified Domestic Help in Gated Societies",
      sub: "Find background-checked Cooks, Maids, and Nannies near your society.",
      icon: "🏢"
    },
    {
      title: "1-on-1 Gate Interview Scheduling",
      sub: "Schedule gate meetings directly with verified helpers with instant DLT SMS alerts.",
      icon: "⚡"
    },
    {
      title: "Executive GST Tax Invoices",
      sub: "Download ITR-compliant tax invoices issued by YugaYatra Retail (OPC) Pvt.Ltd.",
      icon: "🧾"
    }
  ];

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      handleComplete();
    }
  };

  const current = slides[slide];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brand}>Sevikaa</Text>
        <Text style={styles.icon}>{current.icon}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.sub}>{current.sub}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, slide === i && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {slide === slides.length - 1 ? 'Get Started →' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24, justifyContent: 'space-between' },
  content: { marginTop: 60, alignItems: 'center' },
  brand: { fontSize: 36, fontWeight: '900', color: '#1A73E8', letterSpacing: 0.5, marginBottom: 40 },
  icon: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A', textAlign: 'center', lineHeight: 28 },
  sub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 18, paddingHorizontal: 20 },
  footer: { marginBottom: 24, alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  dotActive: { width: 24, backgroundColor: '#1A73E8' },
  nextBtn: { backgroundColor: '#1A73E8', width: '100%', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  nextBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
