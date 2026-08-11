import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { getApiUrl } from '../config/api';

const PROFILE_CACHE_KEY = 'sevikaa_profile_cache_v3';

// Helper to strip out base64 images and huge blobs so AsyncStorage stays under SQLite CursorWindow 2MB limit
const sanitizeForCache = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForCache);

  const clean: any = {};
  for (const key in obj) {
    const val = obj[key];
    if (typeof val === 'string') {
      if (val.startsWith('data:') || val.length > 20000) {
        // Exclude massive base64 URIs from disk cache
        continue;
      }
    }
    if (val && typeof val === 'object') {
      clean[key] = sanitizeForCache(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

export interface UserProfileContextType {
  user: any | null;
  role: 'employer' | 'worker' | null;
  profile: any | null;
  workerProfile: any | null;
  employerProfile: any | null;
  isVerified: boolean;
  workerSkills: string[];
  primarySociety: string;
  secondarySocieties: string[];
  isLoading: boolean;
  setUser: (user: any | null) => void;
  setRole: (role: 'employer' | 'worker' | null) => void;
  refreshProfile: () => Promise<void>;
  clearProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType>({
  user: null,
  role: null,
  profile: null,
  workerProfile: null,
  employerProfile: null,
  isVerified: false,
  workerSkills: [],
  primarySociety: '',
  secondarySocieties: [],
  isLoading: true,
  setUser: () => {},
  setRole: () => {},
  refreshProfile: async () => {},
  clearProfile: async () => {},
});

export const UserProfileProvider: React.FC<{
  children: React.ReactNode;
  initialUser?: any;
  initialRole?: 'employer' | 'worker';
}> = ({ children, initialUser, initialRole }) => {
  const [user, setUserState] = useState<any | null>(initialUser || null);
  const [role, setRoleState] = useState<'employer' | 'worker' | null>(initialRole || null);
  const [profile, setProfile] = useState<any | null>(null);
  const [workerProfile, setWorkerProfile] = useState<any | null>(null);
  const [employerProfile, setEmployerProfile] = useState<any | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [workerSkills, setWorkerSkills] = useState<string[]>([]);
  const [primarySociety, setPrimarySociety] = useState<string>('');
  const [secondarySocieties, setSecondarySocieties] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync initial user/role props if passed
  useEffect(() => {
    if (initialUser) setUserState(initialUser);
    if (initialRole) setRoleState(initialRole);
  }, [initialUser, initialRole]);

  // Load from AsyncStorage cache on mount
  useEffect(() => {
    const loadCachedProfile = async () => {
      try {
        const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.profile) setProfile(parsed.profile);
          if (parsed.workerProfile) setWorkerProfile(parsed.workerProfile);
          if (parsed.employerProfile) setEmployerProfile(parsed.employerProfile);
          if (typeof parsed.isVerified === 'boolean') setIsVerified(parsed.isVerified);
          if (Array.isArray(parsed.workerSkills)) setWorkerSkills(parsed.workerSkills);
          if (parsed.primarySociety) setPrimarySociety(parsed.primarySociety);
          if (Array.isArray(parsed.secondarySocieties)) setSecondarySocieties(parsed.secondarySocieties);
        }
      } catch (e) {
        console.warn("Purging bloated profile cache:", e);
        // Automatically purge oversized/corrupted SQLite row
        AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
        AsyncStorage.removeItem('sevikaa_profile_cache_v2').catch(() => {});
      } finally {
        setIsLoading(false);
      }
    };
    loadCachedProfile();
  }, []);

  // Fetch fresh profile data whenever user changes or refreshProfile is called
  const fetchFreshProfile = async (targetUser?: any) => {
    const activeUser = targetUser || user;
    const activeUserId = activeUser?.id;
    const activePhone = activeUser?.phone || '';
    const activeEmail = activeUser?.email || '';

    if (!activeUserId && !activePhone && !activeEmail) {
      return;
    }

    try {
      const { apiClient } = await import('../services/apiClient');
      const data = await apiClient.get('api/auth/me');
      if (data) {
        const prof = data.profile || data.user || null;
        const wp = data.workerProfile || null;
        const ep = data.employerProfile || null;

        setProfile(prof);
        setWorkerProfile(wp);
        setEmployerProfile(ep);

        const verified = prof?.status === 'approved' || prof?.status === 'live' || wp?.status === 'approved' || wp?.status === 'live';
        setIsVerified(verified);

        const rawSkills = Array.isArray(wp?.skills) ? wp.skills
          : Array.isArray(wp?.category) ? wp.category
          : wp?.skills ? [wp.skills] : [];
        const skillsArr = rawSkills.map((s: any) => String(s).toLowerCase());
        setWorkerSkills(skillsArr);

        const pSoc = prof?.society || wp?.preferred_society_name || wp?.primary_gated_society || wp?.primary_society_name || wp?.society || (Array.isArray(wp?.preferred_areas) ? wp.preferred_areas[0] : '') || ep?.society || '';
        setPrimarySociety(pSoc);

        let sSocList: string[] = [];
        if (prof?.secondary_societies) {
          sSocList = Array.isArray(prof.secondary_societies) ? prof.secondary_societies : String(prof.secondary_societies).split(',');
        } else if (wp?.secondary_society_name) {
          sSocList = String(wp.secondary_society_name).split(',');
        } else if (wp?.secondary_gated_society) {
          sSocList = String(wp.secondary_gated_society).split(',');
        } else if (Array.isArray(wp?.preferred_areas) && wp.preferred_areas.length > 1) {
          sSocList = wp.preferred_areas.slice(1);
        }
        const sSoc = [...new Set(sSocList.map(s => String(s).trim()).filter(s => Boolean(s) && s.toLowerCase() !== pSoc.toLowerCase()))];
        setSecondarySocieties(sSoc);

        // Cache lightweight data locally (stripped of base64 images to prevent SQLite CursorWindow limit errors)
        const cacheData = {
          profile: sanitizeForCache(prof),
          workerProfile: sanitizeForCache(wp),
          employerProfile: sanitizeForCache(ep),
          isVerified: verified,
          workerSkills: skillsArr,
          primarySociety: pSoc,
          secondarySocieties: sSoc,
          timestamp: Date.now()
        };
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
      }
    } catch (e) {
      console.warn("Error fetching fresh profile:", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFreshProfile(user);
    }
  }, [user]);

  const setUser = (newUser: any | null) => {
    setUserState(newUser);
    if (newUser) {
      fetchFreshProfile(newUser);
    }
  };

  const setRole = (newRole: 'employer' | 'worker' | null) => {
    setRoleState(newRole);
  };

  const refreshProfile = async () => {
    await fetchFreshProfile();
  };

  const clearProfile = async () => {
    setUserState(null);
    setRoleState(null);
    setProfile(null);
    setWorkerProfile(null);
    setEmployerProfile(null);
    setIsVerified(false);
    setWorkerSkills([]);
    setPrimarySociety('');
    setSecondarySocieties([]);
    try {
      await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
      await AsyncStorage.removeItem('sevikaa_profile_cache_v2');
    } catch (e) {}
  };

  return (
    <UserProfileContext.Provider value={{
      user,
      role,
      profile,
      workerProfile,
      employerProfile,
      isVerified,
      workerSkills,
      primarySociety,
      secondarySocieties,
      isLoading,
      setUser,
      setRole,
      refreshProfile,
      clearProfile,
    }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext);
