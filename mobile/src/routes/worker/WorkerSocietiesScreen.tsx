import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, Platform, Alert
} from 'react-native';
import {
  Building2, MapPin, Search, Check, ShieldCheck,
  Briefcase, Users, Star, Plus, X, Globe, Home,
  Compass, Sparkles, Send, Clock, CheckCircle2
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { apiClient } from '../../services/apiClient';
import { useMobileLanguage } from '../../context/LanguageContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { SocietyCard, SocietyItem } from '../../components/SocietyCard';

// Haversine formula to compute exact distance in km between two GPS coordinates
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Known Geo-Coordinates for Gated Societies in Bengaluru
const SOCIETY_GEO_MAP: Record<string, { lat: number; lng: number }> = {
  'DLF Westend Heights': { lat: 12.8720, lng: 77.6105 },
  'Prestige Song of the South': { lat: 12.8685, lng: 77.6152 },
  'SNN Raj Serenity': { lat: 12.8612, lng: 77.6198 },
  'Mantri Pinnacle': { lat: 12.8850, lng: 77.5975 },
  'Purva Westend': { lat: 12.8940, lng: 77.6410 },
  'Adarsh Palm Retreat': { lat: 12.9180, lng: 77.6850 },
  'Brigade Gateway': { lat: 13.0110, lng: 77.5550 },
  'Prestige Shantiniketan': { lat: 12.9900, lng: 77.7280 },
  'Sobha Royal Pavilion': { lat: 12.9100, lng: 77.7000 }
};

// Shape returned by GET /api/worker/societies
interface WorkerSocietyContext {
  primarySocietyId: string | null;
  primarySocietyName: string | null;
  secondarySocietyNames: string[];
}

interface Society {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  securityType: string;
  activeJobsCount: number;
  employersCount: number;
}

interface WorkerSocietiesApiResponse {
  success: boolean;
  workerSocietyContext: WorkerSocietyContext;
  societies: Society[];
}

// Internal shape: extends the SocietyCard's SocietyItem with GPS fields used for distance calculation.
// lat/lng/rawDistance are kept in state but are NOT part of the SocietyItem surface that SocietyCard sees.
interface MappedSociety extends SocietyItem {
  rawDistance: string;
  lat: number;
  lng: number;
}

export const WorkerSocietiesScreen: React.FC<{ user?: any }> = ({ user }) => {
  const { t } = useMobileLanguage();
  const { user: ctxUser, profile: ctxProfile, workerProfile: ctxWp, refreshProfile } = useUserProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'selected' | 'high_hiring'>('all');
  const [societies, setSocieties] = useState<MappedSociety[]>([]);
  const [loading, setLoading] = useState(false);

  // Real GPS Geolocation State
  const [userGeoLocation, setUserGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Dynamic primary and secondary workplace selection
  const [primarySocietyId, setPrimarySocietyId] = useState<string>('');
  const [secondarySocietyIds, setSecondarySocietyIds] = useState<string[]>([]);

  // Request Unlisted Society Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newSocietyName, setNewSocietyName] = useState('');
  const [newSocietyLocality, setNewSocietyLocality] = useState('');
  const [newSocietyTower, setNewSocietyTower] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // In-app Toast Banner State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  useEffect(() => {
    fetchWorkerSocieties();
  }, []);

  /**
   * Single authenticated API call — GET /api/worker/societies
   *
   * The server:
   *  - verifies the JWT and resolves the worker identity
   *  - fetches the worker's primary/secondary society assignments
   *  - computes active_jobs_count per society via a DB subquery
   *  - returns everything in one response
   *
   * No direct Supabase calls. No silent fallback to the database.
   * On failure: log the error and leave the list empty so the UI shows
   * its existing empty/error state. Do NOT bypass the API architecture.
   */
  const fetchWorkerSocieties = async () => {
    setLoading(true);
    try {
      const data: WorkerSocietiesApiResponse = await apiClient.get('api/worker/societies');

      if (!data.success) {
        console.error('[WorkerSocietiesScreen] API returned success=false');
        setSocieties([]);
        return;
      }

      // Map API societies to UI shape
      const mapped: MappedSociety[] = data.societies.map(soc => ({
        id: soc.id,
        name: soc.name,
        locality: soc.city || 'Bangalore',
        distance: 'Near you',   // required by SocietyItem; overwritten by GPS useMemo
        rawDistance: 'Near you',
        lat: soc.latitude,
        lng: soc.longitude,
        activeJobsCount: soc.activeJobsCount,
        employersCount: soc.employersCount,
        securityType: soc.securityType || 'Physical Gate Security',
      }));


      setSocieties(mapped);

      // ── Resolve primary society ─────────────────────────────────────────
      const { primarySocietyId: apiPrimId, primarySocietyName: apiPrimName, secondarySocietyNames } =
        data.workerSocietyContext;

      let matchedPrimaryId = '';

      if (apiPrimId) {
        const hit = mapped.find(s => s.id.toLowerCase() === apiPrimId.toLowerCase());
        if (hit) matchedPrimaryId = hit.id;
      }

      if (!matchedPrimaryId && apiPrimName) {
        const cleanP = apiPrimName.toLowerCase().trim();
        const hit = mapped.find(s => {
          const n = s.name.toLowerCase().trim();
          return n === cleanP || n.includes(cleanP) || cleanP.includes(n);
        });
        if (hit) matchedPrimaryId = hit.id;
      }

      setPrimarySocietyId(matchedPrimaryId);

      // ── Resolve secondary societies ─────────────────────────────────────
      if (secondarySocietyNames.length > 0) {
        const secMatches = mapped
          .filter(
            s =>
              s.id !== matchedPrimaryId &&
              secondarySocietyNames.some(secName => {
                if (!secName) return false;
                const cleanSec = secName.toLowerCase().trim();
                const sName = s.name.toLowerCase().trim();
                return cleanSec === sName || sName.includes(cleanSec) || cleanSec.includes(sName);
              })
          )
          .map(s => s.id);
        setSecondarySocietyIds(secMatches);
      } else {
        setSecondarySocietyIds([]);
      }
    } catch (err: any) {
      // Hard failure — do NOT fall back to Supabase or any other source.
      console.error('[WorkerSocietiesScreen] Failed to fetch societies:', err?.message || err);
      setSocieties([]);
    } finally {
      setLoading(false);
    }
  };

  // Real GPS Native Location Permission Handler via Expo Location
  const handleRequestLiveLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const permissionRes = await Location.requestForegroundPermissionsAsync();
        status = permissionRes.status;
      }

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setUserGeoLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
        Alert.alert('GPS Location Active', 'Live GPS location activated! Nearby societies updated.');
      } else {
        setUserGeoLocation(null);
        Alert.alert(
          'Location Permission Denied',
          'Location permission was denied. Please allow location access in your device settings to detect nearby societies.'
        );
      }
    } catch (error: any) {
      console.warn('GPS Location error:', error);
      setUserGeoLocation(null);
      Alert.alert(
        'GPS Location Error',
        'Could not access live GPS position. Please ensure location services are enabled on your device.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  // Dynamically calculate GPS distances when user location changes
  const societiesWithDistance = useMemo(() => {
    const mapped = societies.map(soc => {
      let distanceStr = 'Near you';
      let distanceKm = 99999;
      if (userGeoLocation) {
        const geo = SOCIETY_GEO_MAP[soc.name];
        const hasRealCoords =
          geo ||
          (soc.lat && soc.lat !== 12.9716) ||
          (soc.lng && soc.lng !== 77.5946);

        if (hasRealCoords) {
          const lat = geo?.lat ?? soc.lat;
          const lng = geo?.lng ?? soc.lng;
          const km = calculateHaversineKm(userGeoLocation.lat, userGeoLocation.lng, lat, lng);
          distanceKm = km;
          distanceStr = `${km} km away`;
        } else {
          distanceStr = 'Distance unavailable';
        }
      }
      return { ...soc, distance: distanceStr, distanceKm };
    });

    if (userGeoLocation) {
      return [...mapped].sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return mapped;
  }, [societies, userGeoLocation]);

  // High hiring threshold (top 25% percentile by active jobs)
  const highHiringThreshold = useMemo(() => {
    if (!societiesWithDistance || societiesWithDistance.length === 0) return 3;
    const sortedCounts = societiesWithDistance.map(s => s.activeJobsCount).sort((a, b) => b - a);
    const top25Index = Math.max(0, Math.floor(sortedCounts.length * 0.25) - 1);
    return Math.max(1, sortedCounts[top25Index] || 1);
  }, [societiesWithDistance]);

  const filteredSocieties = useMemo(() => {
    return societiesWithDistance.filter(soc => {
      const matchesSearch =
        soc.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        soc.locality.toLowerCase().includes(searchQuery.toLowerCase().trim());

      if (!matchesSearch) return false;

      if (activeTab === 'selected') {
        return soc.id === primarySocietyId || secondarySocietyIds.includes(soc.id);
      }
      if (activeTab === 'high_hiring') {
        return soc.activeJobsCount >= highHiringThreshold;
      }
      return true;
    });
  }, [societiesWithDistance, searchQuery, activeTab, primarySocietyId, secondarySocietyIds, highHiringThreshold]);

  const handleSetPrimary = async (society: SocietyItem) => {
    // Optimistic update: apply the change to local state immediately
    const prevPrimaryId = primarySocietyId;
    const prevSecondaryIds = secondarySocietyIds;

    const newSecondary = secondarySocietyIds.filter(id => id !== society.id);
    setPrimarySocietyId(society.id);
    setSecondarySocietyIds(newSecondary);

    const secNames = newSecondary
      .map(id => societies.find(s => s.id === id)?.name)
      .filter(Boolean) as string[];

    try {
      await apiClient.post('api/worker/profile/update', {
        primary_gated_society: society.name,
        primary_society_name: society.name,
        primary_society_id: society.id,
        society: society.name,
        secondary_gated_society: secNames.join(', '),
        secondary_societies: secNames,
        preferred_areas: [society.name, ...secNames]
      });
      showToast(`Primary Workplace Updated 🟢 ${society.name} set as primary.`);
      refreshProfile().catch(() => {});
    } catch (e: any) {
      // API failed — roll back the optimistic UI update
      console.error('[WorkerSocietiesScreen] Primary society update failed:', e);
      setPrimarySocietyId(prevPrimaryId);
      setSecondarySocietyIds(prevSecondaryIds);
      showToast(`⚠️ Failed to update primary workplace. Please try again.`);
    }
  };

  const handleToggleSecondary = async (society: SocietyItem) => {
    if (society.id === primarySocietyId) {
      showToast(`⚠️ ${society.name} is already your Primary workplace!`);
      return;
    }

    // Optimistic update: apply change locally, then persist; roll back on failure
    const prevSecondaryIds = secondarySocietyIds;
    let updatedSecIds: string[];
    let toastOnSuccess: string;

    if (secondarySocietyIds.includes(society.id)) {
      updatedSecIds = secondarySocietyIds.filter(id => id !== society.id);
      toastOnSuccess = `Removed 🟢 ${society.name} from secondary workplaces.`;
    } else {
      if (secondarySocietyIds.length >= 5) {
        showToast('⚠️ Limit Reached: You can select up to 5 secondary workplace societies.');
        return;
      }
      updatedSecIds = [...secondarySocietyIds, society.id];
      toastOnSuccess = `Secondary Workplace Added 🟢 Added ${society.name}`;
    }

    // Apply optimistic change
    setSecondarySocietyIds(updatedSecIds);

    const secNames = updatedSecIds
      .map(id => societies.find(s => s.id === id)?.name)
      .filter(Boolean) as string[];
    const primarySocObj = societies.find(s => s.id === primarySocietyId);
    const primaryName = primarySocObj?.name || '';

    try {
      await apiClient.post('api/worker/profile/update', {
        primary_gated_society: primaryName,
        primary_society_name: primaryName,
        secondary_gated_society: secNames.join(', '),
        secondary_societies: secNames,
        preferred_areas: primaryName ? [primaryName, ...secNames] : secNames
      });
      showToast(toastOnSuccess);
      refreshProfile().catch(() => {});
    } catch (e: any) {
      // API failed — roll back the optimistic UI update
      console.error('[WorkerSocietiesScreen] Secondary society update failed:', e);
      setSecondarySocietyIds(prevSecondaryIds);
      showToast(`⚠️ Failed to update secondary workplaces. Please try again.`);
    }
  };

  const handleRequestSocietySubmit = async () => {
    if (!newSocietyName.trim()) {
      showToast('⚠️ Please enter the society name.');
      return;
    }
    setIsSubmittingRequest(true);
    try {
      await apiClient.post('api/societies', {
        name: newSocietyName.trim(),
        area: newSocietyLocality.trim() || 'Bengaluru',
        city: 'Bengaluru'
      });
      // Success — close modal and show confirmation
      setShowRequestModal(false);
      setNewSocietyName('');
      setNewSocietyLocality('');
      setNewSocietyTower('');
      showToast('Request Submitted 🟢 Onboarding request sent to Sevikaa Admin.');
    } catch (err: any) {
      // Failure — keep modal open so the user can retry; show the actual error
      const errMsg = err?.message || 'Request failed. Please try again.';
      console.error('[WorkerSocietiesScreen] Society request failed:', err);
      showToast(`⚠️ ${errMsg}`);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const primarySocietyObj = societiesWithDistance.find(s => s.id === primarySocietyId);
  const totalSelectedCount = (primarySocietyId ? 1 : 0) + secondarySocietyIds.length;

  return (
    <View style={{ flex: 1 }}>
      {toastMsg && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastBannerText}>{toastMsg}</Text>
        </View>
      )}

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* PAGE HEADER */}
      <View style={styles.pageHeader}>
        <View style={styles.eyebrowPill}>
          <Compass size={11} color="#1A73E8" />
          <Text style={styles.eyebrowText}>
            {t('workerSocietiesEyebrow', 'WORKPLACE PROXIMITY NETWORK')}
          </Text>
        </View>

        <View style={styles.pageTitleRow}>
          <MapPin size={18} color="#1A73E8" />
          <Text style={styles.pageTitle}>
            {t('preferredSocietiesTitle', 'Preferred Working Societies')}
          </Text>
        </View>

        <Text style={styles.pageSub}>
          {t('preferredSocietiesSub', 'Select gated communities near you to receive instant job alerts and priority matching from resident employers.')}
        </Text>
      </View>

      {/* 🌟 1. HERO COVERAGE BANNER */}
      <View style={styles.heroBanner}>
        <View style={styles.heroHeaderRow}>
          <View style={[styles.liveDot, primarySocietyObj ? styles.liveDotActive : styles.liveDotAmber]} />
          <Text style={styles.liveText}>
            {t('activeCoverageBadge', 'ACTIVE WORKPLACE COVERAGE')}
          </Text>
        </View>

        <View style={styles.heroBodyRow}>
          <View style={styles.heroLeftCol}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {primarySocietyObj ? primarySocietyObj.name : 'No Primary Workplace Selected'}
            </Text>
            {primarySocietyObj && (
              <View style={styles.primaryPillTag}>
                <Text style={styles.primaryPillTagText}>{t('primaryBadge', 'PRIMARY')}</Text>
              </View>
            )}
          </View>

          {/* Right Glass Pill Box */}
          <View style={styles.glassStatBox}>
            <View style={styles.glassStatCol}>
              <Text style={styles.glassStatLabel}>SELECTED</Text>
              <Text style={styles.glassStatVal}>{totalSelectedCount}</Text>
            </View>
            <View style={styles.glassStatDivider} />
            <View style={styles.glassStatCol}>
              <Text style={styles.glassStatLabel}>LIVE JOBS</Text>
              <Text style={styles.glassStatVal}>{primarySocietyObj ? primarySocietyObj.activeJobsCount : 0}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 🔍 2. SEARCH & FILTER TOOLBAR */}
      <View style={styles.toolbarContainer}>

        {/* Row 1: Search Input */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchSocietyPlaceholder', 'Search society name, locality, or landmark...')}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Row 2: Live GPS Location Button */}
        <TouchableOpacity
          style={[styles.gpsBtn, userGeoLocation && styles.gpsBtnActive]}
          onPress={handleRequestLiveLocation}
          disabled={isLocating}
        >
          <Compass size={14} color={userGeoLocation ? '#15803D' : '#1A73E8'} />
          <Text style={[styles.gpsBtnText, userGeoLocation && styles.gpsBtnTextActive]}>
            {isLocating
              ? t('locatingBtn', 'Locating...')
              : userGeoLocation
              ? t('gpsActiveBtn', 'GPS Live Active 🟢')
              : t('useLiveLocationBtn', '📍 Use Live Location')}
          </Text>
        </TouchableOpacity>

      </View>

      {/* 📊 3. HORIZONTAL SCROLLABLE TAB FILTERS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScrollView}>
        <View style={styles.tabsRow}>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
            onPress={() => setActiveTab('all')}
          >
            <Building2 size={14} color={activeTab === 'all' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabBtnText, activeTab === 'all' && styles.tabBtnTextActive]}>
              {t('tabAllSocieties', 'All Partner Societies')} ({societiesWithDistance.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'selected' && styles.tabBtnActive]}
            onPress={() => setActiveTab('selected')}
          >
            <Star size={14} color={activeTab === 'selected' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabBtnText, activeTab === 'selected' && styles.tabBtnTextActive]}>
              {t('tabSelected', 'Selected')} ({totalSelectedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'high_hiring' && styles.tabBtnActive]}
            onPress={() => setActiveTab('high_hiring')}
          >
            <Sparkles size={14} color={activeTab === 'high_hiring' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabBtnText, activeTab === 'high_hiring' && styles.tabBtnTextActive]}>
              {t('tabHighHiring', 'High Hiring')} ({societiesWithDistance.filter(s => s.activeJobsCount >= 1).length})
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* 🏢 4. SOCIETIES LIST GRID */}
      {loading ? (
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginVertical: 30 }} />
      ) : filteredSocieties.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyCard}>
          <Building2 size={36} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>{t('noSocietiesFoundTitle', 'No Societies Found')}</Text>
          <Text style={styles.emptySub}>
            {t('noSocietiesFoundSub', 'No gated community matches your search. Try a different keyword or request an unlisted society.')}
          </Text>

          <TouchableOpacity
            style={styles.requestNewBtn}
            onPress={() => setShowRequestModal(true)}
          >
            <Plus size={14} color="#FFFFFF" />
            <Text style={styles.requestNewBtnText}>{t('requestNewSocietyBtn', 'Request New Society')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Society Cards */
        filteredSocieties.map(soc => (
          <SocietyCard
            key={soc.id}
            society={{
              ...soc,
              isHighHiring: soc.activeJobsCount >= highHiringThreshold
            }}
            isPrimary={primarySocietyId === soc.id}
            isSecondary={secondarySocietyIds.includes(soc.id)}
            onSelectPrimary={handleSetPrimary}
            onToggleSecondary={handleToggleSecondary}
          />
        ))
      )}

      {/* ℹ️ COMPACT HELP NOTE */}
      <View style={styles.helpNoteBox}>
        <Text style={styles.helpNoteTitle}>
          {t('dontSeeSocietyTitle', "Can't find your working society listed?")}
        </Text>
        <Text style={styles.helpNoteSub}>
          Resident Employers can request society onboarding directly when posting job requisitions on Sevikaa.
        </Text>
        <TouchableOpacity
          style={styles.helpNoteRequestBtn}
          onPress={() => setShowRequestModal(true)}
        >
          <Plus size={13} color="#1A73E8" />
          <Text style={styles.helpNoteRequestText}>{t('requestNewSocietyBtn', '+ Request New Society')}</Text>
        </TouchableOpacity>
      </View>

      {/* 📩 REQUEST NEW SOCIETY MODAL */}
      {showRequestModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={styles.modalIconBox}>
                    <Building2 size={16} color="#1A73E8" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>{t('requestModalTitle', 'Request Society Onboarding')}</Text>
                    <Text style={styles.modalSub}>{t('requestModalSub', 'Sevikaa Admin directory request')}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>{t('societyNameLabel', 'GATED SOCIETY / APARTMENT NAME')}:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t('societyNamePlaceholder', 'e.g. Sobha Royal Pavilion')}
                placeholderTextColor="#94A3B8"
                value={newSocietyName}
                onChangeText={setNewSocietyName}
              />

              <Text style={styles.inputLabel}>{t('localityLabel', 'LOCALITY / AREA / LANDMARK')}:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t('localityPlaceholder', 'e.g. Sarjapur Main Road, HSR Layout')}
                placeholderTextColor="#94A3B8"
                value={newSocietyLocality}
                onChangeText={setNewSocietyLocality}
              />

              <Text style={styles.inputLabel}>{t('towerLabel', 'TOWER / BLOCK OR GATE NUMBER (OPTIONAL)')}:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t('towerPlaceholder', 'e.g. Tower 3 / Gate 2')}
                placeholderTextColor="#94A3B8"
                value={newSocietyTower}
                onChangeText={setNewSocietyTower}
              />

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowRequestModal(false)}
                >
                  <Text style={styles.modalCancelText}>{t('cancelBtn', 'Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleRequestSocietySubmit}
                  disabled={isSubmittingRequest || !newSocietyName.trim()}
                >
                  <Send size={13} color="#FFFFFF" />
                  <Text style={styles.modalSubmitText}>
                    {isSubmittingRequest ? t('submittingState', 'Submitting...') : t('submitRequestBtn', 'Submit Request')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },

  toastBanner: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },

  pageHeader: { marginBottom: 14 },
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
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  pageSub: { fontSize: 11, color: '#64748B', marginTop: 3, lineHeight: 16 },

  // 1. Hero Coverage Banner
  heroBanner: {
    backgroundColor: '#1A73E8',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  liveDotActive: { backgroundColor: '#4ADE80' },
  liveDotAmber: { backgroundColor: '#FCD34D' },
  liveText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#DBEAFE',
    letterSpacing: 0.5,
  },
  heroBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroLeftCol: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  primaryPillTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  primaryPillTagText: { fontSize: 8.5, fontWeight: '900', color: '#FFFFFF' },
  glassStatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  glassStatCol: {
    alignItems: 'center',
  },
  glassStatLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#DBEAFE',
    marginBottom: 2,
  },
  glassStatVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  glassStatDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  // 2. Toolbar & GPS
  toolbarContainer: {
    gap: 8,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    color: '#0F172A',
    fontWeight: '600',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    borderRadius: 16,
  },
  gpsBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  gpsBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#1A73E8',
  },
  gpsBtnTextActive: {
    color: '#15803D',
  },

  // 3. Filter Tabs
  tabsScrollView: {
    marginBottom: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
  },
  tabBtnActive: {
    backgroundColor: '#1A73E8',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },

  // Empty Card
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  requestNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  requestNewBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // 4. Society Cards List
  societyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  societyCardPrimary: {
    borderColor: '#93C5FD',
    backgroundColor: '#F0F6FF',
    borderWidth: 1.5,
  },
  societyCardSecondary: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  socHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socMainCol: {
    flex: 1,
  },
  socTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  socName: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  primaryBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgePillText: { fontSize: 8.5, fontWeight: '900', color: '#1A73E8' },
  secondaryBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  secondaryBadgePillText: { fontSize: 8.5, fontWeight: '900', color: '#15803D' },
  highHiringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  highHiringBadgeText: { fontSize: 8.5, fontWeight: '900', color: '#FFFFFF' },
  socLocalityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  socLocalityText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  distancePill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  distancePillText: { fontSize: 10.5, fontWeight: '700', color: '#475569' },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },

  metricsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
  },
  metricLabel: { fontSize: 8.5, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.3 },
  metricValRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metricValTextBlue: { fontSize: 11.5, fontWeight: '900', color: '#1A73E8' },
  metricValText: { fontSize: 11.5, fontWeight: '900', color: '#0F172A' },
  metricValTextGreen: { fontSize: 11, fontWeight: '900', color: '#15803D', marginTop: 4 },

  socFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 4,
  },
  selectionSubText: { fontSize: 10, fontWeight: '600', color: '#94A3B8', flex: 1 },
  socActionsRight: { flexDirection: 'row', gap: 6 },
  makePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  makePrimaryBtnText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
  toggleSecBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  toggleSecBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  toggleSecBtnText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  toggleSecBtnTextActive: { color: '#DC2626' },

  // Help Note
  helpNoteBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  helpNoteTitle: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
  helpNoteSub: { fontSize: 10.5, color: '#64748B', textAlign: 'center', lineHeight: 15 },
  helpNoteRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  helpNoteRequestText: { fontSize: 11.5, fontWeight: '900', color: '#1A73E8' },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  modalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  modalSub: { fontSize: 10.5, color: '#64748B', marginTop: 1 },
  inputLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 11.5,
    color: '#0F172A',
    marginBottom: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#1A73E8',
  },
  modalSubmitText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
});
