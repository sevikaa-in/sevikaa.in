import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Alert, Modal, Image 
} from 'react-native';
import { 
  User, CheckCircle2, ShieldCheck, Clock, Save, Phone, 
  IndianRupee, Briefcase, Languages, ChevronDown, ChevronRight, 
  Camera, FileText, Sparkles, Lock, LogOut, Trash2, MapPin, X, Star, Upload, Mail, AlertTriangle, Eye, Play, Shield, Check
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { supabase } from '../../lib/supabase';
import { getApiUrl } from '../../config/api';
import { useMobileLanguage } from '../../context/LanguageContext';
import { useUserProfile } from '../../context/UserProfileContext';

const SKILL_CATEGORIES = [
  { id: 'cook', label: 'Cook / Chef', icon: '🍳' },
  { id: 'maid', label: 'Housekeeping / Maid', icon: '🧹' },
  { id: 'nanny', label: 'Childcare / Nanny', icon: '👶' }
];

// Inline video player using expo-av (works in Expo Go, no native build required)
const InlineVideoPlayer: React.FC<{ url: string }> = ({ url }) => {
  return (
    <Video
      source={{ uri: url }}
      style={{ width: '100%', height: 220, borderRadius: 14, backgroundColor: '#0F172A' }}
      useNativeControls
      resizeMode={ResizeMode.CONTAIN}
      shouldPlay={false}
    />
  );
};



const LANGUAGE_OPTIONS = [
  'Hindi', 'English', 'Hinglish', 'Kannada', 'Tamil', 'Telugu', 
  'Assamese', 'Nepali', 'Bengali', 'Marathi', 'Malayalam', 'Odia', 'Gujarati', 'Punjabi'
];

const SHIFT_SLOT_OPTIONS = [
  { label: 'Full Day (8–12 Hours)', icon: '🕒', sub: 'Standard daily shifts (8 AM – 7 PM)' },
  { label: 'Early Morning (6 AM – 9 AM)', icon: '☀️', sub: 'Breakfast & morning cleaning' },
  { label: 'Morning Shift (9 AM – 12 PM)', icon: '🌅', sub: 'Mid-morning household chores' },
  { label: 'Afternoon Shift (12 PM – 3 PM)', icon: '🌤️', sub: 'Lunch prep & afternoon help' },
  { label: 'Evening Shift (3 PM – 6 PM)', icon: '🌆', sub: 'Evening snacks & dinner prep' },
  { label: 'Night Shift (6 PM – 9 PM)', icon: '🌙', sub: 'Dinner serving & night security' },
  { label: 'Live-In (24x7 Residence)', icon: '🏠', sub: 'Full residence with room & meals' },
  { label: 'Part-Time Flexible Hours', icon: '⚡', sub: 'Hourly or multi-client visits' },
];

const EXPERIENCE_OPTIONS = [
  { value: '0', label: 'Fresher (0 Years)' },
  { value: '1', label: '1 Year Experience' },
  { value: '2', label: '2 Years Experience' },
  { value: '3', label: '3 Years Experience' },
  { value: '4', label: '4 Years Experience' },
  { value: '5', label: '5 Years Experience' },
  { value: '6', label: '6 Years Experience' },
  { value: '7', label: '7 Years Experience' },
  { value: '8', label: '8 Years Experience' },
  { value: '9', label: '9 Years Experience' },
  { value: '10', label: '10+ Years Experience (Senior Expert)' },
];

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' }
];

export const WorkerProfileScreen: React.FC<{ 
  user?: any; 
  onLogout?: () => void 
}> = ({ user, onLogout }) => {
  const { t } = useMobileLanguage();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSkillsLoading, setSaveSkillsLoading] = useState(false);

  // Profile Form States (Initialized empty - NO MOCK FALLBACK DATA)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [society, setSociety] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [experience, setExperience] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [preferredShift, setPreferredShift] = useState('');
  const [bio, setBio] = useState('');

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);

  // Verification Document URLs
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState<string | null>(null);
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState<string | null>(null);
  const [policeDocUrl, setPoliceDocUrl] = useState<string | null>(null);
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);

  // Native Bottom Sheet Picker Modal State (Zero form layout shift)
  const [activePickerModal, setActivePickerModal] = useState<'gender' | 'experience' | 'shift' | null>(null);

  // Accordion State for Danger Zone
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [activeInlinePreview, setActiveInlinePreview] = useState<'front' | 'back' | 'police' | 'video' | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Phone & Email Update Inline Drawers State
  const [showPhoneUpdateBox, setShowPhoneUpdateBox] = useState(false);
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

  const [showEmailUpdateBox, setShowEmailUpdateBox] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  const handleSaveNewPhone = async () => {
    const cleanDigits = newPhoneInput.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      showToast("Please enter a valid 10-digit mobile number ⚠️");
      return;
    }

    setIsUpdatingPhone(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id || user?.id;

      if (activeUserId) {
        const fullPhoneStr = `+91${cleanDigits}`;
        
        await supabase
          .from('profiles')
          .update({ 
            phone: fullPhoneStr,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeUserId);

        const { data: phoneUp, error: phoneErr } = await supabase
          .from('worker_profiles')
          .update({
            alternate_phone: cleanDigits,
            emergency_contact: cleanDigits,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', activeUserId)
          .select();

        if (phoneErr || !phoneUp || phoneUp.length === 0) {
          await supabase
            .from('worker_profiles')
            .upsert({
              user_id: activeUserId,
              alternate_phone: cleanDigits,
              emergency_contact: cleanDigits,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        }

        setPhone(cleanDigits);
        setShowPhoneUpdateBox(false);
        setNewPhoneInput('');
        showToast("Primary Mobile Number updated successfully! 🟢");
      }
    } catch (err: any) {
      console.error("Phone update error:", err);
      showToast(err.message || "Failed to update phone number");
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleSaveNewEmail = async () => {
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) {
      showToast("Please enter a valid email address ⚠️");
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id || user?.id;

      if (activeUserId) {
        const cleanEmail = newEmailInput.trim().toLowerCase();

        await supabase
          .from('profiles')
          .update({ 
            email: cleanEmail,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeUserId);

        setEmail(cleanEmail);
        setShowEmailUpdateBox(false);
        setNewEmailInput('');
        showToast("Primary Email Address updated successfully! 🟢");
      }
    } catch (err: any) {
      console.error("Email update error:", err);
      showToast(err.message || "Failed to update email address");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const { user: ctxUser, profile: ctxProfile, workerProfile: ctxWp, refreshProfile } = useUserProfile();
  const activeUser = ctxUser || user;

  const populateFields = (prof: any, wp: any, uObj: any) => {
    if (prof || wp || uObj) {
      setName(prof?.full_name || wp?.full_name || uObj?.full_name || uObj?.user_metadata?.full_name || '');
      setPhone(prof?.phone?.replace(/\D/g, '').slice(-10) || uObj?.phone?.replace(/\D/g, '').slice(-10) || '');
      setEmail(prof?.email || uObj?.email || '');
      setAlternatePhone(wp?.alternate_phone || wp?.emergency_contact || '');
      setSociety(prof?.society || wp?.society || wp?.preferred_society_name || '');

      if (wp) {
        setExpectedSalary(wp.expected_salary || wp.expectedSalary ? String(wp.expected_salary || wp.expectedSalary) : '');
        const expVal = (wp.experience_years !== undefined && wp.experience_years !== null) 
          ? String(wp.experience_years) 
          : (wp.experience !== undefined && wp.experience !== null ? String(wp.experience) : '');
        setExperience(expVal);
        setGender(wp.gender || '');
        setAge(wp.age ? String(wp.age) : '');
        setPreferredShift(wp.preferred_shift || '');
        setBio(wp.bio || '');

        const normalizeSkillId = (s: string) => {
          const str = String(s || '').toLowerCase();
          if (str.includes('cook') || str.includes('chef')) return 'cook';
          if (str.includes('maid') || str.includes('housekeeping')) return 'maid';
          if (str.includes('nanny') || str.includes('childcare')) return 'nanny';
          return s;
        };

        const rawSkills = Array.isArray(wp.skills) 
          ? wp.skills 
          : (Array.isArray(wp.category) 
              ? wp.category 
              : (wp.skills ? [wp.skills] : (wp.category ? [wp.category] : ['maid'])));

        setSelectedSkills(rawSkills.map((s: string) => normalizeSkillId(s)));

        const rawLangs = Array.isArray(wp.languages_spoken) ? wp.languages_spoken : (Array.isArray(wp.languages) ? wp.languages : []);
        setSelectedLangs(rawLangs);

        if (wp.profile_picture_url || wp.avatar_url || prof?.avatar_url) setProfilePhoto(wp.profile_picture_url || wp.avatar_url || prof?.avatar_url);
        if (wp.aadhaar_front_url) setAadhaarFrontUrl(wp.aadhaar_front_url);
        if (wp.aadhaar_back_url) setAadhaarBackUrl(wp.aadhaar_back_url);
        if (wp.police_verification_url) setPoliceDocUrl(wp.police_verification_url);
        if (wp.video_url) setIntroVideoUrl(wp.video_url);
      }
    }
  };

  useEffect(() => {
    if (ctxProfile || ctxWp || activeUser) {
      populateFields(ctxProfile, ctxWp, activeUser);
    }
  }, [ctxProfile, ctxWp, activeUser]);

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUser = session?.user || user;
      const activeUserId = activeUser?.id || user?.id;
      const activePhone = activeUser?.phone || user?.phone || '';
      const activeEmail = activeUser?.email || user?.email || '';

      let prof: any = null;
      let wp: any = null;

      // 1. Fetch live profile & sub-profile from PostgreSQL via /api/auth/me
      if (activeUserId || activePhone || activeEmail) {
        try {
          const queryParams = new URLSearchParams();
          if (activeUserId) queryParams.append('userId', activeUserId);
          if (activePhone) queryParams.append('phone', activePhone);
          if (activeEmail) queryParams.append('email', activeEmail);

          const res = await fetch(getApiUrl(`api/auth/me?${queryParams.toString()}`));
          if (res.ok) {
            const apiData = await res.json();
            if (apiData.success) {
              prof = apiData.profile;
              wp = apiData.workerProfile;
            }
          }
        } catch (apiErr) {
          console.warn("API profile fetch notice:", apiErr);
        }
      }

      // 2. Fallback to direct Supabase client query
      if (!prof && activeUserId) {
        const { data: clientProf } = await supabase
          .from('profiles')
          .select('*, worker_profiles(*)')
          .eq('id', activeUserId)
          .maybeSingle();

        if (clientProf) {
          prof = clientProf;
          wp = prof.worker_profiles;
          if (Array.isArray(wp)) wp = wp[0];
        }
      }

      if (!wp && activeUserId) {
        const { data: directWp } = await supabase
          .from('worker_profiles')
          .select('*')
          .eq('user_id', activeUserId)
          .maybeSingle();
        if (directWp) wp = directWp;
      }

      if (prof || wp || activeUser) {
        setName(prof?.full_name || wp?.full_name || activeUser?.full_name || activeUser?.user_metadata?.full_name || '');
        setPhone(prof?.phone?.replace(/\D/g, '').slice(-10) || activeUser?.phone?.replace(/\D/g, '').slice(-10) || '');
        setEmail(prof?.email || activeUser?.email || '');
        setAlternatePhone(wp?.alternate_phone || wp?.emergency_contact || '');
        setSociety(prof?.society || wp?.society || wp?.preferred_society_name || '');

        if (wp) {
          const expVal = (wp.experience_years !== undefined && wp.experience_years !== null) 
            ? String(wp.experience_years) 
            : (wp.experience !== undefined && wp.experience !== null ? String(wp.experience) : '');
          setExperience(expVal);
          setGender(wp.gender || '');
          setAge(wp.age ? String(wp.age) : '');
          setPreferredShift(wp.preferred_shift || '');
          setBio(wp.bio || '');

          const normalizeSkillId = (s: string) => {
            const str = String(s || '').toLowerCase();
            if (str.includes('cook') || str.includes('chef')) return 'cook';
            if (str.includes('maid') || str.includes('housekeeping')) return 'maid';
            if (str.includes('nanny') || str.includes('childcare')) return 'nanny';
            return s;
          };

          const rawSkills = Array.isArray(wp.skills) 
            ? wp.skills 
            : (Array.isArray(wp.category) 
                ? wp.category 
                : (wp.skills ? [wp.skills] : (wp.category ? [wp.category] : ['maid'])));

          setSelectedSkills(rawSkills.map((s: string) => normalizeSkillId(s)));

          const rawLangs = Array.isArray(wp.languages_spoken) ? wp.languages_spoken : (Array.isArray(wp.languages) ? wp.languages : []);
          setSelectedLangs(rawLangs);

          if (wp.profile_picture_url || wp.avatar_url || prof?.avatar_url) setProfilePhoto(wp.profile_picture_url || wp.avatar_url || prof?.avatar_url);
          if (wp.aadhaar_front_url) setAadhaarFrontUrl(wp.aadhaar_front_url);
          if (wp.aadhaar_back_url) setAadhaarBackUrl(wp.aadhaar_back_url);
          if (wp.police_verification_url) setPoliceDocUrl(wp.police_verification_url);
          if (wp.video_url) setIntroVideoUrl(wp.video_url);
        }
      }
    } catch (err) {
      console.error("Profile fetch exception:", err);
    } finally {
      setLoading(false);
    }
  };

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const handlePickVideo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast("Media permission required to record intro video 📹");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;
        setIntroVideoUrl(localUri);
        showToast("Video attached! Uploading to Cloudinary...");

        const activeUserId = user?.id;
        if (activeUserId) {
          setUploadingDoc('video');
          try {
            const filename = localUri.split('/').pop() || 'intro-video.mp4';
            const match = /\.(\w+)$/.exec(filename);
            const mimeType = match ? `video/${match[1]}` : 'video/mp4';

            const formData = new FormData();
            formData.append('file', {
              uri: localUri,
              name: filename,
              type: mimeType,
            } as any);
            formData.append('userId', activeUserId);
            formData.append('assetType', 'video_url');
            formData.append('role', 'worker');

            const response = await fetch(getApiUrl('api/upload/cloudinary'), {
              method: 'POST',
              body: formData,
              headers: { 'Accept': 'application/json' },
            });

            const data = await response.json();
            if (data.success && data.publicUrl) {
              setIntroVideoUrl(data.publicUrl);
              showToast("Intro Video uploaded to Cloudinary 🟢");
            } else {
              showToast("Video attached locally. Save profile details to sync.");
            }
          } catch (err) {
            showToast("Video attached locally. Save profile details to sync.");
          } finally {
            setUploadingDoc(null);
          }
        }
      }
    } catch (e) {
      console.warn("Video picker error:", e);
    }
  };

  const handlePickImage = async (type: 'photo' | 'aadhaar_front' | 'aadhaar_back' | 'police') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast("Photo permission required 📸");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;

        // 1. Optimistic instant UI preview feedback
        if (type === 'photo') setProfilePhoto(localUri);
        else if (type === 'aadhaar_front') setAadhaarFrontUrl(localUri);
        else if (type === 'aadhaar_back') setAadhaarBackUrl(localUri);
        else if (type === 'police') setPoliceDocUrl(localUri);

        showToast("Document attached! Uploading to Cloudinary...");

        // 2. Upload to Cloudinary via Next.js backend endpoint /api/upload/cloudinary
        const assetTypeMap: Record<string, string> = {
          photo: 'profile_picture_url',
          aadhaar_front: 'aadhaar_front_url',
          aadhaar_back: 'aadhaar_back_url',
          police: 'police_verification_url'
        };

        const assetType = assetTypeMap[type] || 'profile_picture_url';
        const activeUserId = user?.id;

        if (activeUserId) {
          setUploadingDoc(type);
          try {
            const filename = localUri.split('/').pop() || `${type}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

            const formData = new FormData();
            formData.append('file', {
              uri: localUri,
              name: filename,
              type: mimeType,
            } as any);
            formData.append('userId', activeUserId);
            formData.append('assetType', assetType);
            formData.append('role', 'worker');

            const response = await fetch(getApiUrl('api/upload/cloudinary'), {
              method: 'POST',
              body: formData,
              headers: {
                'Accept': 'application/json',
              },
            });

            const data = await response.json();
            if (data.success && data.publicUrl) {
              // 3. Update state with permanent Cloudinary CDN URL
              if (type === 'photo') setProfilePhoto(data.publicUrl);
              else if (type === 'aadhaar_front') setAadhaarFrontUrl(data.publicUrl);
              else if (type === 'aadhaar_back') setAadhaarBackUrl(data.publicUrl);
              else if (type === 'police') setPoliceDocUrl(data.publicUrl);

              showToast("Document uploaded & saved 🟢");
            } else {
              showToast("Document attached locally. Save profile details to sync.");
            }
          } catch (uploadErr) {
            showToast("Document attached locally. Save profile details to sync.");
          } finally {
            setUploadingDoc(null);
          }
        } else {
          showToast("Document attached locally. Save profile details to sync.");
        }
      }
    } catch (e) {
      console.warn("Image picker error:", e);
    }
  };

  const handleToggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      if (selectedSkills.length <= 1) {
        Alert.alert("Notice", "Select at least 1 core service category.");
        return;
      }
      setSelectedSkills(prev => prev.filter(s => s !== skillId));
    } else {
      setSelectedSkills(prev => [...prev, skillId]);
    }
  };

  const handleToggleLang = (lang: string) => {
    if (selectedLangs.includes(lang)) {
      if (selectedLangs.length <= 1) return;
      setSelectedLangs(prev => prev.filter(l => l !== lang));
    } else {
      setSelectedLangs(prev => [...prev, lang]);
    }
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id || user?.id;

      if (!activeUserId) {
        showToast("Session missing. Please log in again.");
        setSaveLoading(false);
        return;
      }

      // Only include fields the user actually filled in — never send empty strings
      // to avoid overwriting DB data with server-side defaults
      const updatePayload: Record<string, any> = { userId: activeUserId };

      if (name.trim())           updatePayload.full_name      = name.trim();
      if (name.trim())           updatePayload.name           = name.trim();
      if (email.trim())          updatePayload.email          = email.trim();
      if (phone)                 updatePayload.phone          = phone;
      if (gender)                updatePayload.gender         = gender.toLowerCase().trim();
      if (age)                   updatePayload.age            = age;
      if (expectedSalary)        updatePayload.expectedSalary = expectedSalary;
      if (experience !== '')     updatePayload.experience     = experience;
      if (preferredShift)        updatePayload.preferredShift = preferredShift;
      if (alternatePhone)        { updatePayload.alternatePhone = alternatePhone; updatePayload.emergencyContact = alternatePhone; }
      if (bio)                   updatePayload.bio            = bio;
      if (selectedSkills?.length)   { updatePayload.skills = selectedSkills; }
      if (selectedLangs?.length)    { updatePayload.languages = selectedLangs; updatePayload.languages_spoken = selectedLangs; }
      if (profilePhoto)          updatePayload.profile_picture_url     = profilePhoto;
      if (aadhaarFrontUrl)       updatePayload.aadhaar_front_url       = aadhaarFrontUrl;
      if (aadhaarBackUrl)        updatePayload.aadhaar_back_url        = aadhaarBackUrl;
      if (policeDocUrl)          updatePayload.police_verification_url = policeDocUrl;
      if (introVideoUrl)         updatePayload.video_url               = introVideoUrl;

      // 1. Backend API route (handles worker_profiles + profiles)
      let saveSuccess = false;
      try {
        const res = await fetch(getApiUrl('api/worker/profile/update'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) saveSuccess = true;
        } else {
          const errText = await res.text().catch(() => '');
          console.warn("API update non-OK:", res.status, errText);
        }
      } catch (apiErr) {
        console.warn("API update error:", apiErr);
      }

      // 2. Direct Supabase fallback — only changed fields
      if (!saveSuccess) {
        const profilePatch: Record<string, any> = {};
        if (name.trim())   profilePatch.full_name = name.trim();
        if (email.trim())  profilePatch.email     = email.trim();

        if (Object.keys(profilePatch).length > 0) {
          await supabase.from('profiles').update(profilePatch).eq('id', activeUserId);
        }

        const wpPatch: Record<string, any> = {};
        if (name.trim())           wpPatch.full_name         = name.trim();
        if (gender)                wpPatch.gender            = gender.toLowerCase().trim();
        if (age)                   wpPatch.age               = Number(age) || undefined;
        if (expectedSalary)        wpPatch.expected_salary   = Number(expectedSalary) || undefined;
        if (experience !== '')     { wpPatch.experience_years = Number(experience) || 0; }
        if (preferredShift)        wpPatch.preferred_shift   = preferredShift;
        if (alternatePhone)        { wpPatch.alternate_phone = alternatePhone; wpPatch.emergency_contact = alternatePhone; }
        if (bio)                   wpPatch.bio               = bio;
        if (selectedSkills?.length)   wpPatch.skills           = selectedSkills;
        if (selectedLangs?.length)    { wpPatch.languages = selectedLangs; wpPatch.languages_spoken = selectedLangs; }
        if (profilePhoto)          wpPatch.profile_picture_url     = profilePhoto;
        if (aadhaarFrontUrl)       wpPatch.aadhaar_front_url       = aadhaarFrontUrl;
        if (aadhaarBackUrl)        wpPatch.aadhaar_back_url        = aadhaarBackUrl;
        if (policeDocUrl)          wpPatch.police_verification_url = policeDocUrl;
        if (introVideoUrl)         wpPatch.video_url               = introVideoUrl;

        if (Object.keys(wpPatch).length > 0) {
          const { error: wpErr } = await supabase
            .from('worker_profiles')
            .update(wpPatch)
            .eq('user_id', activeUserId);

          if (wpErr) {
            await supabase
              .from('worker_profiles')
              .upsert({ user_id: activeUserId, ...wpPatch }, { onConflict: 'user_id' });
          }
        }

        saveSuccess = true;
      }

      showToast("Profile saved successfully 🟢");
      setSaveLoading(false);
      refreshProfile().catch(() => {});
    } catch (err: any) {
      console.error("Save profile error:", err);
      showToast(err.message || "Failed to save profile");
      setSaveLoading(false);
    }
  };

  const handleSaveSkills = async () => {
    setSaveSkillsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id || user?.id;

      if (activeUserId) {
        let saveSuccess = false;
        try {
          const res = await fetch(getApiUrl('api/worker/profile/update'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: activeUserId,
              skills: selectedSkills,
              languages: selectedLangs,
              languages_spoken: selectedLangs,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) saveSuccess = true;
          }
        } catch (apiErr) {}

        if (!saveSuccess) {
          const skillsPayload: Record<string, any> = {
            updated_at: new Date().toISOString()
          };
          if (selectedSkills && selectedSkills.length > 0) skillsPayload.skills = selectedSkills;
          if (selectedLangs && selectedLangs.length > 0) {
            skillsPayload.languages = selectedLangs;
            skillsPayload.languages_spoken = selectedLangs;
          }

          const { error: skillsErr } = await supabase
            .from('worker_profiles')
            .update(skillsPayload)
            .eq('user_id', activeUserId);

          if (skillsErr) {
            await supabase
              .from('worker_profiles')
              .upsert({
                user_id: activeUserId,
                ...skillsPayload
              }, { onConflict: 'user_id' });
          }
        }
      }
      showToast("Skills & Languages saved successfully 🟢");
      setSaveSkillsLoading(false);
      refreshProfile().catch(() => {});
    } catch (err) {
      console.warn("Save skills notice:", err);
      setSaveSkillsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id || user?.id;

      if (activeUserId) {
        await supabase.from('profiles').update({ status: 'deletion_requested' }).eq('id', activeUserId);
      }
      setShowDeleteModal(false);
      Alert.alert("Account Deletion Requested 🟢", "Your account deletion request has been registered.");
      if (onLogout) onLogout();
    } catch (err) {
      console.warn("Delete account notice:", err);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // 10 Steps Profile Completeness Checklist
  const checklist = useMemo(() => {
    return [
      { key: 'name', label: 'Full Name', done: !!name.trim() },
      { key: 'phone', label: 'Mobile Number', done: !!phone },
      { key: 'gender_age', label: 'Gender & Age', done: !!gender && !!age },
      { key: 'skills', label: 'Skills Selected', done: selectedSkills.length > 0 },
      { key: 'salary', label: 'Expected Salary', done: !!expectedSalary && Number(expectedSalary) > 0 },
      { key: 'experience', label: 'Experience', done: !!experience },
      { key: 'languages', label: 'Languages', done: selectedLangs.length > 0 },
      { key: 'photo', label: 'Profile Photo', done: !!profilePhoto },
      { key: 'aadhaar_front', label: 'Aadhaar (Front)', done: !!aadhaarFrontUrl },
      { key: 'aadhaar_back', label: 'Aadhaar (Back)', done: !!aadhaarBackUrl },
    ];
  }, [name, phone, gender, age, selectedSkills, expectedSalary, experience, selectedLangs, profilePhoto, aadhaarFrontUrl, aadhaarBackUrl]);

  const completedStepsCount = useMemo(() => {
    return checklist.filter(c => c.done).length;
  }, [checklist]);

  const completenessPct = Math.round((completedStepsCount / 10) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMsg && (
        <View style={styles.floatingToast}>
          <CheckCircle2 size={16} color="#34D399" />
          <Text style={styles.floatingToastText}>{toastMsg}</Text>
        </View>
      )}

      {/* PAGE HEADER (100% MATCH WITH WEB SCREENSHOT) */}
      <View style={styles.pageHeader}>
        <View style={styles.headerLeftCol}>
          <View style={styles.headerTitleRow}>
            <User size={20} color="#1A73E8" />
            <Text style={styles.pageTitle}>Profile, Skills &amp; Verification</Text>
          </View>
          <Text style={styles.pageSub}>
            Complete your profile to start applying to verified household jobs.
          </Text>
        </View>

        <View style={styles.pendingAuditBadge}>
          <Clock size={12} color="#1A73E8" />
          <Text style={styles.pendingAuditBadgeText}>⏳ PENDING AUDIT</Text>
        </View>
      </View>

      {/* 🌟 1. HERO PROFILE CARD (100% MATCH WITH WEB SCREENSHOT 1 & 2) */}
      <View style={styles.heroCard}>
        
        <Text style={styles.heroName}>{name || 'N/A'}</Text>
        
        <View style={styles.heroTopRow}>
          
          {/* Avatar with Camera Badge */}
          <TouchableOpacity style={styles.avatarWrap} onPress={() => handlePickImage('photo')}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarDefaultBox}>
                <User size={36} color="#EC4899" />
              </View>
            )}
            <View style={styles.avatarCameraBadge}>
              <Camera size={11} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.heroRightDetails}>
            <View style={styles.societyRow}>
              <MapPin size={12} color="#1A73E8" />
              <Text style={styles.societyText} numberOfLines={1}>{society || 'N/A'}</Text>
            </View>

            <View style={styles.heroPillsRow}>
              <View style={styles.readyPill}>
                <Sparkles size={11} color="#15803D" />
                <Text style={styles.readyPillText}>{completenessPct === 100 ? '100% PROFILE READY' : `${completenessPct}% PROFILE READY`}</Text>
              </View>

              <View style={styles.salaryPill}>
                <Text style={styles.salaryPillText}>{expectedSalary ? `₹ ${expectedSalary}/MO` : 'N/A'}</Text>
              </View>
            </View>
          </View>

        </View>

        {/* 3 White Stats Rows */}
        <View style={styles.heroStatsContainer}>
          
          <View style={styles.heroStatRow}>
            <View style={styles.statLeftCol}>
              <Phone size={13} color="#16A34A" />
              <Text style={styles.statLabelText}>Mobile:</Text>
            </View>
            <View style={styles.statRightCol}>
              <Text style={styles.statValBold}>{phone ? `+91 ${phone}` : 'N/A'}</Text>
              {alternatePhone ? (
                <View style={styles.altPhoneBadge}>
                  <Text style={styles.altPhoneText}>Alt: +91 {alternatePhone}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.heroStatRow}>
            <View style={styles.statLeftCol}>
              <Briefcase size={13} color="#D97706" />
              <Text style={styles.statLabelText}>Experience:</Text>
            </View>
            <Text style={styles.statValBold}>{experience ? `${experience} Years` : 'N/A'}</Text>
          </View>

          <View style={styles.heroStatRow}>
            <View style={styles.statLeftCol}>
              <Clock size={13} color="#1A73E8" />
              <Text style={styles.statLabelText}>Shift Slot:</Text>
            </View>
            <Text style={styles.statValBold}>{preferredShift || 'N/A'}</Text>
          </View>

        </View>

        <View style={styles.divider} />

        {/* Profile Completeness Section */}
        <View style={styles.completenessHeaderRow}>
          <Text style={styles.completenessTitle}>Profile Completeness</Text>
          <Text style={styles.completenessStepCount}>{completedStepsCount} of 10 steps completed</Text>
        </View>

        <View style={styles.completenessProgressBarTrack}>
          <View style={[styles.completenessProgressBarFill, { width: `${completenessPct}%` }]} />
        </View>

        {/* 10 Checklist Pills Grid */}
        <View style={styles.checklistGrid}>
          {checklist.map(item => (
            <View key={item.key} style={[styles.checkPill, item.done && styles.checkPillDone]}>
              <Text style={[styles.checkPillText, item.done && styles.checkPillTextDone]}>{item.label}</Text>
              <CheckCircle2 size={11} color={item.done ? "#16A34A" : "#94A3B8"} />
            </View>
          ))}
        </View>

      </View>

      {/* 📝 2. SECTION 1: PERSONAL & SALARY DETAILS (100% MATCH WITH WEB SCREENSHOT 2 & 3) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <User size={16} color="#1A73E8" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Personal &amp; Salary Details</Text>
            <Text style={styles.sectionSub}>Your basic profile &amp; salary expectations</Text>
          </View>
        </View>

        {/* Full Name */}
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput 
          style={styles.textInputBox}
          value={name}
          onChangeText={setName}
          placeholder="Enter full name"
          placeholderTextColor="#94A3B8"
        />

        {/* Primary Mobile Number */}
        <Text style={styles.inputLabel}>PRIMARY MOBILE NUMBER</Text>
        <View style={styles.updateInputRow}>
          <View style={[styles.textInputBox, { flex: 1 }]}>
            <Text style={styles.disabledValText}>{phone ? `+91 ${phone}` : 'N/A'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.updateBtn}
            onPress={() => {
              setShowPhoneUpdateBox(!showPhoneUpdateBox);
              setShowEmailUpdateBox(false);
              if (!newPhoneInput) setNewPhoneInput(phone || '');
            }}
          >
            <Phone size={12} color="#FFFFFF" />
            <Text style={styles.updateBtnText}>{showPhoneUpdateBox ? 'Cancel' : 'Update'}</Text>
          </TouchableOpacity>
        </View>

        {/* Inline Phone Update Box */}
        {showPhoneUpdateBox && (
          <View style={styles.inlineUpdateBox}>
            <Text style={styles.inlineUpdateBoxLabel}>Enter New 10-Digit Mobile Number:</Text>
            <View style={styles.alternatePhoneBox}>
              <Text style={styles.prefixText}>+91 </Text>
              <TextInput 
                style={styles.flexInput}
                keyboardType="phone-pad"
                value={newPhoneInput}
                onChangeText={(val) => setNewPhoneInput(val.replace(/\D/g, '').slice(-10))}
                placeholder="Enter 10-digit number"
                placeholderTextColor="#94A3B8"
                maxLength={10}
              />
            </View>
            <TouchableOpacity 
              style={[styles.saveInlineBtn, isUpdatingPhone && styles.saveInlineBtnDisabled]}
              disabled={isUpdatingPhone}
              onPress={handleSaveNewPhone}
            >
              <Check size={12} color="#FFFFFF" />
              <Text style={styles.saveInlineBtnText}>{isUpdatingPhone ? 'Saving...' : 'Save Mobile Number'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Primary Email Address */}
        <Text style={styles.inputLabel}>PRIMARY EMAIL ADDRESS (OPTIONAL)</Text>
        <View style={styles.updateInputRow}>
          <View style={[styles.textInputBox, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
            <Mail size={14} color="#94A3B8" />
            <Text style={styles.disabledValText}>{email || 'N/A'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.updateBtn}
            onPress={() => {
              setShowEmailUpdateBox(!showEmailUpdateBox);
              setShowPhoneUpdateBox(false);
              if (!newEmailInput) setNewEmailInput(email || '');
            }}
          >
            <Mail size={12} color="#FFFFFF" />
            <Text style={styles.updateBtnText}>{showEmailUpdateBox ? 'Cancel' : 'Update'}</Text>
          </TouchableOpacity>
        </View>

        {/* Inline Email Update Box */}
        {showEmailUpdateBox && (
          <View style={styles.inlineUpdateBox}>
            <Text style={styles.inlineUpdateBoxLabel}>Enter New Email Address:</Text>
            <View style={[styles.textInputBox, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <Mail size={14} color="#94A3B8" />
              <TextInput 
                style={styles.flexInput}
                keyboardType="email-address"
                autoCapitalize="none"
                value={newEmailInput}
                onChangeText={setNewEmailInput}
                placeholder="example@domain.com"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <TouchableOpacity 
              style={[styles.saveInlineBtn, isUpdatingEmail && styles.saveInlineBtnDisabled]}
              disabled={isUpdatingEmail}
              onPress={handleSaveNewEmail}
            >
              <Check size={12} color="#FFFFFF" />
              <Text style={styles.saveInlineBtnText}>{isUpdatingEmail ? 'Saving...' : 'Save Email Address'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Alternate / Family Mobile Number (CLEAN SINGLE ROW WITHOUT DOUBLE +91 OR WRAPPING) */}
        <Text style={styles.inputLabel}>Alternate / Family Mobile Number (Optional)</Text>
        <View style={styles.alternatePhoneBox}>
          <Text style={styles.prefixText}>+91 </Text>
          <TextInput 
            style={styles.flexInput}
            keyboardType="phone-pad"
            value={alternatePhone.replace(/\D/g, '').slice(-10)}
            onChangeText={(val) => setAlternatePhone(val.replace(/\D/g, '').slice(-10))}
            placeholder="N/A"
            placeholderTextColor="#94A3B8"
            maxLength={10}
          />
        </View>

        {/* 2 Cols: Gender | Age */}
        <View style={styles.twoColsRow}>
          
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Gender</Text>
            <TouchableOpacity 
              style={styles.dropdownSelectBox}
              onPress={() => setActivePickerModal('gender')}
            >
              <Text style={styles.dropdownSelectText}>
                {gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : gender === 'other' ? 'Other' : 'Select Gender'}
              </Text>
              <ChevronDown size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Age (Years)</Text>
            <TextInput 
              style={styles.textInputBox}
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
              placeholder="N/A"
              placeholderTextColor="#94A3B8"
            />
          </View>

        </View>

        {/* 2 Cols: Expected Salary | Total Experience */}
        <View style={styles.twoColsRow}>
          
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Expected Salary (₹/month)</Text>
            <View style={styles.salaryInputBox}>
              <IndianRupee size={14} color="#15803D" />
              <TextInput 
                style={styles.salaryInputText}
                keyboardType="number-pad"
                value={expectedSalary}
                onChangeText={setExpectedSalary}
                placeholder="N/A"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Total Experience</Text>
            <TouchableOpacity 
              style={styles.dropdownSelectBox}
              onPress={() => setActivePickerModal('experience')}
            >
              <Text style={styles.dropdownSelectText} numberOfLines={1}>
                {EXPERIENCE_OPTIONS.find(e => e.value === experience)?.label || (experience ? `${experience} Year(s) Experience` : 'Select Experience')}
              </Text>
              <ChevronDown size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

        </View>

        {/* Preferred Shift Slot Dropdown */}
        <Text style={styles.inputLabel}>Preferred Shift Slot</Text>
        <TouchableOpacity 
          style={styles.dropdownSelectBox}
          onPress={() => setActivePickerModal('shift')}
        >
          <Text style={styles.dropdownSelectText} numberOfLines={1}>
            {preferredShift ? `🌅 ${preferredShift}` : 'Select Preferred Shift'}
          </Text>
          <ChevronDown size={14} color="#64748B" />
        </TouchableOpacity>

        {/* About Me / Bio Textarea */}
        <Text style={styles.inputLabel}>About Me / Bio</Text>
        <TextInput 
          style={styles.textAreaBox}
          multiline
          numberOfLines={3}
          value={bio}
          onChangeText={setBio}
          placeholder="N/A"
          placeholderTextColor="#94A3B8"
        />

        {/* Save Profile Details Button */}
        <TouchableOpacity 
          style={styles.saveBlueBtn}
          onPress={handleSaveProfile}
          disabled={saveLoading}
        >
          {saveLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Save size={14} color="#FFFFFF" />
              <Text style={styles.saveBlueBtnText}>Save Profile Details</Text>
            </>
          )}
        </TouchableOpacity>

      </View>

      {/* 💼 3. SECTION 2: SKILLS & LANGUAGES SPOKEN (100% MATCH WITH WEB SCREENSHOT 3 & 4) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={[styles.sectionIconCircle, { backgroundColor: '#F0FDF4' }]}>
            <Briefcase size={16} color="#16A34A" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Skills &amp; Languages Spoken</Text>
            <Text style={styles.sectionSub}>Select your core services &amp; languages</Text>
          </View>
        </View>

        <Text style={styles.inputLabel}>Work Services (Select All That Apply)</Text>
        <View style={styles.servicesStack}>
          {SKILL_CATEGORIES.map(cat => {
            const isSelected = selectedSkills.includes(cat.id);
            return (
              <TouchableOpacity 
                key={cat.id}
                style={[styles.serviceRowBtn, isSelected && styles.serviceRowBtnActive]}
                onPress={() => handleToggleSkill(cat.id)}
              >
                <Text style={styles.serviceIcon}>{cat.icon}</Text>
                <Text style={[styles.serviceLabelText, isSelected && styles.serviceLabelTextActive]}>{cat.label}</Text>
                {isSelected && <CheckCircle2 size={14} color="#1A73E8" />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.inputLabel}>Spoken Languages</Text>
        <View style={styles.languagesWrapGrid}>
          {LANGUAGE_OPTIONS.map(lang => {
            const isSelected = selectedLangs.includes(lang);
            return (
              <TouchableOpacity 
                key={lang}
                style={[styles.langChipBtn, isSelected && styles.langChipBtnActive]}
                onPress={() => handleToggleLang(lang)}
              >
                <Text style={[styles.langChipBtnText, isSelected && styles.langChipBtnTextActive]}>
                  {isSelected ? `✓ ${lang}` : `+ ${lang}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Save Skills & Languages Button */}
        <TouchableOpacity 
          style={styles.saveGreenBtn}
          onPress={handleSaveSkills}
          disabled={saveSkillsLoading}
        >
          {saveSkillsLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Save size={14} color="#FFFFFF" />
              <Text style={styles.saveGreenBtnText}>Save Skills &amp; Languages</Text>
            </>
          )}
        </TouchableOpacity>

      </View>

      {/* 📄 4. SECTION 3: AADHAAR CARD & VIDEO INTRO VERIFICATION (100% MATCH WITH WEB SCREENSHOT 4) */}
      <View style={styles.sectionCard}>
        
        <View style={styles.sectionCardHeader}>
          <View style={[styles.sectionIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Shield size={16} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Aadhaar Card &amp; Video Intro Verification</Text>
            <Text style={styles.sectionSub}>Government ID proof &amp; 60-second video introduction</Text>
          </View>
          <View style={styles.verifiedIdentityPill}>
            <Text style={styles.verifiedIdentityPillText}>✓ VERIFIED IDENTITY</Text>
          </View>
        </View>

        {/* Aadhaar Front Box */}
        <View style={[styles.verifMediaBox, aadhaarFrontUrl && styles.verifMediaBoxUploaded]}>
          <View style={[styles.verifMediaIconBox, aadhaarFrontUrl && styles.verifMediaIconBoxUploaded]}>
            <FileText size={18} color={aadhaarFrontUrl ? "#16A34A" : "#64748B"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.verifMediaTitle}>Aadhaar — Front</Text>
            <Text style={styles.verifMediaSub}>Name, photo &amp; DOB • Max 5MB</Text>
          </View>
          {aadhaarFrontUrl ? (
            <View style={styles.verifActionGroup}>
              <TouchableOpacity 
                style={styles.viewLightBtn} 
                onPress={() => setActiveInlinePreview(activeInlinePreview === 'front' ? null : 'front')}
              >
                <Eye size={12} color="#15803D" />
                <Text style={styles.viewLightBtnText}>
                  {activeInlinePreview === 'front' ? 'Hide Preview' : 'View'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.changeGreyBtn} onPress={() => handlePickImage('aadhaar_front')}>
                <Upload size={12} color="#475569" />
                <Text style={styles.changeGreyBtnText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeIconBtn} 
                onPress={() => {
                  setAadhaarFrontUrl(null);
                  if (activeInlinePreview === 'front') setActiveInlinePreview(null);
                }}
              >
                <X size={14} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBlueBtn} onPress={() => handlePickImage('aadhaar_front')}>
              <Upload size={12} color="#FFFFFF" />
              <Text style={styles.uploadBlueBtnText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Inline Front Preview Drawer */}
        {activeInlinePreview === 'front' && (
          <View style={styles.inlinePreviewDrawer}>
            <View style={styles.inlinePreviewHeader}>
              <Text style={styles.inlinePreviewTitle}>📄 Aadhaar Front Uploaded Document</Text>
              <TouchableOpacity onPress={() => setActiveInlinePreview(null)}>
                <Text style={styles.inlinePreviewCloseText}>Close Preview ✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inlinePreviewBody}>
              {aadhaarFrontUrl ? (
                <Image source={{ uri: aadhaarFrontUrl }} style={styles.inlinePreviewImg} resizeMode="contain" />
              ) : (
                <View style={styles.inlinePreviewPlaceholder}>
                  <FileText size={32} color="#60A5FA" />
                  <Text style={styles.inlinePlaceholderText}>Aadhaar Front Document Verified &amp; Stored</Text>
                  <Text style={styles.inlinePlaceholderSub}>Active document proof linked to worker profile</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Aadhaar Back Box */}
        <View style={[styles.verifMediaBox, aadhaarBackUrl && styles.verifMediaBoxUploaded]}>
          <View style={[styles.verifMediaIconBox, aadhaarBackUrl && styles.verifMediaIconBoxUploaded]}>
            <FileText size={18} color={aadhaarBackUrl ? "#16A34A" : "#64748B"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.verifMediaTitle}>Aadhaar — Back</Text>
            <Text style={styles.verifMediaSub}>Address &amp; Aadhaar number • Max 5MB</Text>
          </View>
          {aadhaarBackUrl ? (
            <View style={styles.verifActionGroup}>
              <TouchableOpacity 
                style={styles.viewLightBtn} 
                onPress={() => setActiveInlinePreview(activeInlinePreview === 'back' ? null : 'back')}
              >
                <Eye size={12} color="#15803D" />
                <Text style={styles.viewLightBtnText}>
                  {activeInlinePreview === 'back' ? 'Hide Preview' : 'View'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.changeGreyBtn} onPress={() => handlePickImage('aadhaar_back')}>
                <Upload size={12} color="#475569" />
                <Text style={styles.changeGreyBtnText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeIconBtn} 
                onPress={() => {
                  setAadhaarBackUrl(null);
                  if (activeInlinePreview === 'back') setActiveInlinePreview(null);
                }}
              >
                <X size={14} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBlueBtn} onPress={() => handlePickImage('aadhaar_back')}>
              <Upload size={12} color="#FFFFFF" />
              <Text style={styles.uploadBlueBtnText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Inline Back Preview Drawer */}
        {activeInlinePreview === 'back' && (
          <View style={styles.inlinePreviewDrawer}>
            <View style={styles.inlinePreviewHeader}>
              <Text style={styles.inlinePreviewTitle}>📄 Aadhaar Back Uploaded Document</Text>
              <TouchableOpacity onPress={() => setActiveInlinePreview(null)}>
                <Text style={styles.inlinePreviewCloseText}>Close Preview ✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inlinePreviewBody}>
              {aadhaarBackUrl ? (
                <Image source={{ uri: aadhaarBackUrl }} style={styles.inlinePreviewImg} resizeMode="contain" />
              ) : (
                <View style={styles.inlinePreviewPlaceholder}>
                  <FileText size={32} color="#60A5FA" />
                  <Text style={styles.inlinePlaceholderText}>Aadhaar Back Document Verified &amp; Stored</Text>
                  <Text style={styles.inlinePlaceholderSub}>Active address proof linked to worker profile</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Police Verification Box */}
        <View style={[styles.policeVerifBox, policeDocUrl && styles.verifMediaBoxUploaded]}>
          <View style={[styles.verifMediaIconBox, policeDocUrl && styles.verifMediaIconBoxUploaded]}>
            <ShieldCheck size={18} color={policeDocUrl ? "#16A34A" : "#64748B"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.verifMediaTitle}>Police Verification Certificate</Text>
            <View style={styles.optionalTag}>
              <Text style={styles.optionalTagText}>Optional</Text>
            </View>
          </View>
          {policeDocUrl ? (
            <View style={styles.verifActionGroup}>
              <TouchableOpacity 
                style={styles.viewLightBtn} 
                onPress={() => setActiveInlinePreview(activeInlinePreview === 'police' ? null : 'police')}
              >
                <Eye size={12} color="#15803D" />
                <Text style={styles.viewLightBtnText}>
                  {activeInlinePreview === 'police' ? 'Hide Preview' : 'View'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.changeGreyBtn} onPress={() => handlePickImage('police')}>
                <Upload size={12} color="#475569" />
                <Text style={styles.changeGreyBtnText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeIconBtn} 
                onPress={() => {
                  setPoliceDocUrl(null);
                  if (activeInlinePreview === 'police') setActiveInlinePreview(null);
                }}
              >
                <X size={14} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadPoliceOrangeBtn} onPress={() => handlePickImage('police')}>
              <Upload size={12} color="#FFFFFF" />
              <Text style={styles.uploadPoliceOrangeBtnText}>Upload Police Clearance</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Inline Police Preview Drawer */}
        {activeInlinePreview === 'police' && (
          <View style={styles.inlinePreviewDrawer}>
            <View style={styles.inlinePreviewHeader}>
              <Text style={styles.inlinePreviewTitle}>📄 Police Verification Certificate</Text>
              <TouchableOpacity onPress={() => setActiveInlinePreview(null)}>
                <Text style={styles.inlinePreviewCloseText}>Close Preview ✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inlinePreviewBody}>
              {policeDocUrl ? (
                <Image source={{ uri: policeDocUrl }} style={styles.inlinePreviewImg} resizeMode="contain" />
              ) : (
                <View style={styles.inlinePreviewPlaceholder}>
                  <ShieldCheck size={32} color="#F59E0B" />
                  <Text style={styles.inlinePlaceholderText}>Police Verification Certificate Stored</Text>
                  <Text style={styles.inlinePlaceholderSub}>Optional NOC document linked to worker profile</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Intro Video (60s) Box */}
        <View style={[styles.verifMediaBox, introVideoUrl ? styles.verifMediaBoxUploaded : null, { borderColor: '#E9D5FF', backgroundColor: '#FAF5FF' }]}>
          <View style={[styles.verifMediaIconBox, { backgroundColor: '#F3E8FF' }]}>
            <Play size={18} color="#9333EA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.verifMediaTitle}>Intro Video (60s)</Text>
            <Text style={styles.verifMediaSub}>Self intro video • Max 50MB</Text>
          </View>
          {introVideoUrl ? (
            <View style={styles.verifActionGroup}>
              <TouchableOpacity 
                style={styles.playPurpleBtn} 
                onPress={() => setActiveInlinePreview(activeInlinePreview === 'video' ? null : 'video')}
              >
                <Play size={12} color="#9333EA" />
                <Text style={styles.playPurpleBtnText}>
                  {activeInlinePreview === 'video' ? 'Hide Preview' : 'Play Video'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.changeGreyBtn} onPress={handlePickVideo}>
                <Upload size={12} color="#475569" />
                <Text style={styles.changeGreyBtnText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeIconBtn} 
                onPress={() => {
                  setIntroVideoUrl(null);
                  if (activeInlinePreview === 'video') setActiveInlinePreview(null);
                }}
              >
                <X size={14} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadPurpleBtn} onPress={handlePickVideo}>
              <Upload size={12} color="#FFFFFF" />
              <Text style={styles.uploadPurpleBtnText}>Upload Video</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Inline Video Preview Drawer */}
        {activeInlinePreview === 'video' && (
          <View style={styles.inlinePreviewDrawer}>
            <View style={styles.inlinePreviewHeader}>
              <Text style={[styles.inlinePreviewTitle, { color: '#C084FC' }]}>📹 60-Second Video Intro</Text>
              <TouchableOpacity onPress={() => setActiveInlinePreview(null)}>
                <Text style={styles.inlinePreviewCloseText}>Close Preview ✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inlinePreviewBody}>
              {introVideoUrl ? (
                <InlineVideoPlayer url={introVideoUrl} />
              ) : (
                <View style={styles.inlinePreviewPlaceholder}>
                  <Play size={36} color="#C084FC" />
                  <Text style={styles.inlinePlaceholderText}>No Intro Video Uploaded</Text>
                  <Text style={styles.inlinePlaceholderSub}>Upload a 60-second self video introduction for employers</Text>
                </View>
              )}
            </View>
          </View>
        )}

      </View>

      {/* 🗑️ 5. SECTION 4: DANGER ZONE & ACCOUNT OFFBOARDING */}
      <View style={styles.dangerAccordionCard}>
        <TouchableOpacity 
          style={styles.dangerAccordionHeader}
          onPress={() => setShowDangerZone(!showDangerZone)}
        >
          <Trash2 size={16} color="#DC2626" />
          <Text style={styles.dangerAccordionTitle}>Danger Zone &amp; Worker Account Offboarding</Text>
          <ChevronDown size={16} color="#DC2626" style={showDangerZone && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>

        {showDangerZone && (
          <View style={styles.dangerAccordionBody}>
            <Text style={styles.dangerBodySub}>
              Unlist your Digital Passport from resident employers and request account deletion.
            </Text>
            <TouchableOpacity 
              style={styles.requestDeleteBtn}
              onPress={() => setShowDeleteModal(true)}
            >
              <Trash2 size={14} color="#FFFFFF" />
              <Text style={styles.requestDeleteBtnText}>Request Account Deletion</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 🏢 FOOTER BRAND LOGO (POWERED BY YUGAYATRA) */}
      <View style={styles.footerBrandSection}>
        <Text style={styles.poweredByText}>POWERED BY</Text>
        <Image 
          source={require('../../../assets/ygayatra.png')} 
          style={styles.yugaLogoImg} 
          resizeMode="contain" 
        />
      </View>

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.deleteIconBox}>
                  <AlertTriangle size={18} color="#DC2626" />
                </View>
                <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalTitle}>Request Account Deletion</Text>
              <Text style={styles.modalSub}>
                Are you sure you want to delete your Sevikaa Digital Passport? This will unlist your profile from resident employers.
              </Text>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalConfirmDeleteBtn}
                  onPress={handleDeleteAccount}
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalConfirmDeleteText}>Confirm Deletion</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 📱 SLEEK NATIVE BOTTOM SHEET PICKER MODAL (ZERO FORM STRETCHING/LAYOUT SHIFT) */}
      <Modal
        visible={activePickerModal !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActivePickerModal(null)}
      >
        <TouchableOpacity 
          style={styles.sheetModalBackdrop} 
          activeOpacity={1} 
          onPress={() => setActivePickerModal(null)}
        >
          <TouchableOpacity style={styles.sheetContainer} activeOpacity={1}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>
                  {activePickerModal === 'gender' ? 'Select Gender' : activePickerModal === 'experience' ? 'Select Total Experience' : 'Select Preferred Shift Slot'}
                </Text>
                <TouchableOpacity onPress={() => setActivePickerModal(null)} style={styles.sheetCloseBtn}>
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.sheetScrollView} showsVerticalScrollIndicator={false}>
              {activePickerModal === 'gender' && GENDER_OPTIONS.map(g => (
                <TouchableOpacity 
                  key={g.value} 
                  style={[styles.sheetItemRow, gender === g.value && styles.sheetItemRowActive]}
                  onPress={() => {
                    setGender(g.value);
                    setActivePickerModal(null);
                  }}
                >
                  <Text style={[styles.sheetItemText, gender === g.value && styles.sheetItemTextActive]}>{g.label}</Text>
                  {gender === g.value && <Check size={16} color="#1A73E8" />}
                </TouchableOpacity>
              ))}

              {activePickerModal === 'experience' && EXPERIENCE_OPTIONS.map(exp => (
                <TouchableOpacity 
                  key={exp.value} 
                  style={[styles.sheetItemRow, experience === exp.value && styles.sheetItemRowActive]}
                  onPress={() => {
                    setExperience(exp.value);
                    setActivePickerModal(null);
                  }}
                >
                  <Text style={[styles.sheetItemText, experience === exp.value && styles.sheetItemTextActive]}>{exp.label}</Text>
                  {experience === exp.value && <Check size={16} color="#1A73E8" />}
                </TouchableOpacity>
              ))}

              {activePickerModal === 'shift' && SHIFT_SLOT_OPTIONS.map(s => (
                <TouchableOpacity 
                  key={s.label} 
                  style={[styles.sheetItemRow, preferredShift === s.label && styles.sheetItemRowActive]}
                  onPress={() => {
                    setPreferredShift(s.label);
                    setActivePickerModal(null);
                  }}
                >
                  <View style={styles.sheetItemLeftCol}>
                    <Text style={[styles.sheetItemText, preferredShift === s.label && styles.sheetItemTextActive]}>{s.icon} {s.label}</Text>
                    {s.sub && <Text style={styles.sheetItemSubText}>{s.sub}</Text>}
                  </View>
                  {preferredShift === s.label && <Check size={16} color="#1A73E8" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerLeftCol: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  pageSub: { fontSize: 11, color: '#64748B', marginTop: 3, lineHeight: 16 },

  pendingAuditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  pendingAuditBadgeText: { fontSize: 9.5, fontWeight: '900', color: '#1A73E8' },

  // 1. Hero Card
  heroCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  heroName: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
  heroTopRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 58, height: 58, borderRadius: 29 },
  avatarDefaultBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F472B6',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1A73E8',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroRightDetails: { flex: 1, gap: 4 },
  societyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  societyText: { fontSize: 12, fontWeight: '800', color: '#334155' },
  heroPillsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  readyPillText: { fontSize: 9.5, fontWeight: '900', color: '#15803D' },
  salaryPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  salaryPillText: { fontSize: 9.5, fontWeight: '900', color: '#15803D' },

  heroStatsContainer: { gap: 6, marginTop: 4 },
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statLeftCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabelText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  statRightCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValBold: { fontSize: 11.5, fontWeight: '900', color: '#0F172A' },
  altPhoneBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  altPhoneText: { fontSize: 9.5, fontWeight: '800', color: '#475569' },

  divider: { height: 1, backgroundColor: '#DCFCE7', marginVertical: 12 },

  completenessHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  completenessTitle: { fontSize: 11.5, fontWeight: '900', color: '#0F172A' },
  completenessStepCount: { fontSize: 10.5, fontWeight: '800', color: '#10B981' },
  completenessProgressBarTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  completenessProgressBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },

  checklistGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  checkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  checkPillDone: { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  checkPillText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  checkPillTextDone: { color: '#15803D' },

  // 2. Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  sectionSub: { fontSize: 10.5, color: '#64748B', marginTop: 1 },

  inputLabel: { fontSize: 10, fontWeight: '900', color: '#475569', marginTop: 10, marginBottom: 4, letterSpacing: 0.3 },
  textInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  alternatePhoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  updateInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  prefixText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  disabledValText: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  flexInput: { flex: 1, fontSize: 12, color: '#0F172A', fontWeight: '700', paddingVertical: 0 },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
  },
  updateBtnText: { fontSize: 11.5, fontWeight: '900', color: '#FFFFFF' },
  inlineUpdateBox: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 16,
    padding: 12,
    marginTop: 6,
    marginBottom: 6,
    gap: 8,
  },
  inlineUpdateBoxLabel: { fontSize: 10.5, fontWeight: '800', color: '#1E40AF' },
  saveInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveInlineBtnDisabled: { backgroundColor: '#94A3B8' },
  saveInlineBtnText: { fontSize: 11.5, fontWeight: '900', color: '#FFFFFF' },

  twoColsRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dropdownSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  dropdownSelectText: { fontSize: 11.5, fontWeight: '800', color: '#0F172A' },
  dropdownPopMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    marginTop: 4,
    padding: 4,
    maxHeight: 200,
    zIndex: 99,
    elevation: 5,
  },
  dropdownPopItem: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  dropdownPopItemText: { fontSize: 11.5, fontWeight: '700', color: '#334155' },

  salaryInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  salaryInputText: { flex: 1, fontSize: 12, fontWeight: '900', color: '#15803D', paddingVertical: 0 },
  textAreaBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11.5,
    color: '#0F172A',
    minHeight: 65,
    textAlignVertical: 'top',
  },

  saveBlueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 14,
  },
  saveBlueBtnText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },

  // Skills & Languages
  servicesStack: { gap: 8, marginTop: 4 },
  serviceRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  serviceRowBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#1A73E8', borderWidth: 1.5 },
  serviceIcon: { fontSize: 18 },
  serviceLabelText: { flex: 1, fontSize: 12, fontWeight: '800', color: '#334155' },
  serviceLabelTextActive: { color: '#1A73E8', fontWeight: '900' },

  languagesWrapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  langChipBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  langChipBtnActive: { backgroundColor: '#1A73E8' },
  langChipBtnText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  langChipBtnTextActive: { color: '#FFFFFF' },

  saveGreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 14,
  },
  saveGreenBtnText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },

  // Verification Boxes
  verifiedIdentityPill: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedIdentityPillText: { fontSize: 9, fontWeight: '900', color: '#15803D' },
  verifMediaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  verifMediaBoxUploaded: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderStyle: 'solid',
  },
  verifMediaIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifMediaIconBoxUploaded: {
    backgroundColor: '#DCFCE7',
  },
  verifMediaTitle: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
  verifMediaSub: { fontSize: 10, color: '#64748B', marginTop: 1 },
  verifActionGroup: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  viewLightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewLightBtnText: { fontSize: 11, fontWeight: '800', color: '#15803D' },
  changeGreyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  changeGreyBtnText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  uploadBlueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  uploadBlueBtnText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
  uploadPurpleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#9333EA',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  uploadPurpleBtnText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
  floatingToast: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingToastText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF', flex: 1 },
  removeIconBtn: { padding: 4 },

  // Inline Preview Drawer Styles (100% Match with Web)
  inlinePreviewDrawer: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    marginTop: -2,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  inlinePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  inlinePreviewTitle: { fontSize: 11, fontWeight: '900', color: '#60A5FA' },
  inlinePreviewCloseText: { fontSize: 10.5, fontWeight: '800', color: '#94A3B8' },
  inlinePreviewBody: {
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    borderRadius: 12,
    minHeight: 180,
    maxHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  inlinePreviewImg: { width: '100%', height: 240, borderRadius: 8 },
  inlinePreviewPlaceholder: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  inlinePlaceholderText: { fontSize: 11.5, fontWeight: '900', color: '#F8FAFC', marginTop: 6 },
  inlinePlaceholderSub: { fontSize: 9.5, color: '#64748B', marginTop: 2 },
  policeVerifBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  optionalTag: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 2 },
  optionalTagText: { fontSize: 9, fontWeight: '900', color: '#D97706' },
  uploadPoliceOrangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  uploadPoliceOrangeBtnText: { fontSize: 10.5, fontWeight: '900', color: '#FFFFFF' },
  playPurpleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  playPurpleBtnText: { fontSize: 11, fontWeight: '800', color: '#9333EA' },

  // Danger Zone
  dangerAccordionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
  },
  dangerAccordionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dangerAccordionTitle: { flex: 1, fontSize: 12, fontWeight: '900', color: '#DC2626' },
  dangerAccordionBody: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#FEE2E2' },
  dangerBodySub: { fontSize: 11, color: '#64748B', marginBottom: 10 },
  requestDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 12,
  },
  requestDeleteBtnText: { fontSize: 11.5, fontWeight: '900', color: '#FFFFFF' },

  // Footer Brand
  footerBrandSection: { alignItems: 'center', marginTop: 16, marginBottom: 24, gap: 4 },
  poweredByText: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  yugaLogoImg: { width: 140, height: 42 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  deleteIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  modalSub: { fontSize: 11, color: '#64748B', marginTop: 4, lineHeight: 16 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  modalCancelBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#F1F5F9' },
  modalCancelText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  modalConfirmDeleteBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#DC2626' },
  modalConfirmDeleteText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },

  // Native Bottom Sheet Picker Styles
  sheetModalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: '75%' },
  sheetHeader: { alignItems: 'center', marginBottom: 12 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', marginBottom: 12 },
  sheetTitleRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  sheetCloseBtn: { padding: 4, borderRadius: 8, backgroundColor: '#F1F5F9' },
  sheetScrollView: { marginTop: 8 },
  sheetItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  sheetItemRowActive: { backgroundColor: '#EFF6FF' },
  sheetItemText: { fontSize: 13, fontWeight: '800', color: '#334155' },
  sheetItemTextActive: { color: '#1A73E8', fontWeight: '900' },
  sheetItemLeftCol: { flex: 1, gap: 2 },
  sheetItemSubText: { fontSize: 11, color: '#64748B' },
});
