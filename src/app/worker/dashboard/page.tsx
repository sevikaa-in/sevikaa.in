"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { supabase } from '../../../lib/supabaseClient';
import { 
  User, Calendar, Briefcase, Bookmark, PhoneCall, 
  FileText, CheckCircle2, Bell, Shield, Wallet, Settings, 
  LogOut, Check, ArrowLeft, Camera, Upload, Video, AlertCircle, IndianRupee
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = [
  { id: 'early_morning', label: 'Early (6 AM - 9 AM)' },
  { id: 'morning', label: 'Morning (9 AM - 12 PM)' },
  { id: 'afternoon', label: 'Afternoon (12 PM - 3 PM)' },
  { id: 'evening', label: 'Evening (3 PM - 6 PM)' },
  { id: 'night', label: 'Night (6 PM - 9 PM)' }
];

const MOCK_SOCIETIES = [
  { id: '91cb520f-d5b7-4b71-9f20-b44c3c3de101', name: 'DLF Westend Heights - Akshayanagar' },
  { id: 'c7e2d9a3-5bc5-442a-a921-ef743bd2b6d2', name: 'Prestige Song of the South - Bangalore' },
  { id: 'b1a2f3c4-e888-4c91-a1b2-3f8c8dcb2e83', name: 'SNN Raj Serenity - Bangalore' }
];

export default function WorkerDashboard() {
  const { t, setLanguage } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'availability' | 'applications' | 'wallet' | 'settings' | 'jobs'>('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Societies fetched list
  const [societiesList, setSocietiesList] = useState<any[]>(MOCK_SOCIETIES);

  // Availability state
  const [availability, setAvailability] = useState<Record<string, string[]>>({
    Mon: ['morning', 'afternoon'],
    Wed: ['morning', 'afternoon'],
    Fri: ['morning', 'afternoon', 'evening']
  });

  // Profile details
  const [workerProfile, setWorkerProfile] = useState<any>({
    name: "Janhvi",
    category: "Professional Nanny & Child Caregiver",
    expectedSalary: "18,000",
    experience: "4 Years",
    society: "Prestige Song of the South, Bengaluru",
    phone: "+91 98765 43210",
    languages: ["Hindi", "English", "Kannada"],
    gender: "female",
    age: "26",
    preferred_areas: ["JP Nagar", "Bannerghatta Road"],
    profile_picture_url: "",
    video_url: "",
    emergency_contact: "",
    aadhaar_front_url: "",
    aadhaar_back_url: ""
  });

  // Badges list
  const [badges, setBadges] = useState<any[]>([
    { name: 'Mobile', status: 'approved' },
    { name: 'Aadhaar', status: 'approved' },
    { name: 'Police', status: 'approved' },
    { name: 'Interview', status: 'approved' },
    { name: 'Video', status: 'approved' }
  ]);

  // Applications list
  const [applications, setApplications] = useState<any[]>([]);

  // Open Jobs list
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<string[]>([]);
  const [editExpectedSalary, setEditExpectedSalary] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editSocietyId, setEditSocietyId] = useState('');
  const [editLanguages, setEditLanguages] = useState<string[]>([]);
  const [editPreferredAreas, setEditPreferredAreas] = useState<string[]>([]);
  const [editAreasInput, setEditAreasInput] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [editAge, setEditAge] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');

  // Edit upload files
  const [editSelfieFile, setEditSelfieFile] = useState<File | null>(null);
  const [editSelfiePreview, setEditSelfiePreview] = useState<string | null>(null);
  const [editAadhaarFrontFile, setEditAadhaarFrontFile] = useState<File | null>(null);
  const [editAadhaarBackFile, setEditAadhaarBackFile] = useState<File | null>(null);
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedJobForReview, setSelectedJobForReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const handleLogout = async () => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!isPlaceholder) {
      await supabase.auth.signOut();
    }
    router.push('/');
  };

  const validateFile = (file: File, maxMb: number, allowedTypes: string[]) => {
    if (file.size > maxMb * 1024 * 1024) {
      return `File size is too large. Acceptable limit is up to ${maxMb}MB.`;
    }
    if (!allowedTypes.includes(file.type)) {
      return `Unsupported file format. Acceptable formats: ${allowedTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()}.`;
    }
    return null;
  };

  useEffect(() => {
    const fetchWorkerData = async () => {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setUser({ id: 'mock-user-uuid-12345' });
        setLoading(false);
        // Load some mock jobs
        setAvailableJobs([
          { id: 'j_mock_1', title: 'Full Time Cook Needed', category: 'cook', description: 'Need professional cook for vegetarian household.', salary_range_min: 15000, salary_range_max: 18000, society: 'DLF Westend Heights', employer: 'Sharma Household', employer_user_id: 'e_mock_1' },
          { id: 'j_mock_2', title: 'Experienced Nanny for Toddler', category: 'nanny', description: 'Looking for child-loving nanny for a 2-year old boy.', salary_range_min: 20000, salary_range_max: 22000, society: 'Prestige Song of the South', employer: 'Kothari Residence', employer_user_id: 'e_mock_2' }
        ]);
        setApplications([
          { id: 'app_mock_1', job_id: 'j_mock_2', employer: "Kothari Residence", category: "Nanny", salary: "₹20,000/mo", status: "Interviewing", date: "Applied 2 days ago", employer_phone: "+919876543210", employer_user_id: 'e_mock_2' }
        ]);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }
        const sessionUser = session.user;
        setUser(sessionUser);

        // Fetch societies list
        const { data: socs } = await supabase.from('societies').select('*');
        if (socs && socs.length > 0) {
          setSocietiesList(socs);
        }

        // Get profiles row
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (profile && profile.role !== 'worker') {
          router.push(profile.role === 'employer' ? '/employer/dashboard' : '/');
          return;
        }

        // Get worker_profiles row
        const { data: wp } = await supabase
          .from('worker_profiles')
          .select('*, preferred_society:societies(*)')
          .eq('user_id', sessionUser.id)
          .single();

        if (wp) {
          setWorkerProfile({
            name: wp.full_name || 'No Name Set',
            category: wp.skills?.join(' / ') || 'None',
            expectedSalary: wp.expected_salary?.toString() || '0',
            experience: `${wp.experience_years || 0} Years`, 
            society: wp.preferred_society?.name || 'No society chosen',
            phone: sessionUser.phone || sessionUser.email || '',
            languages: wp.languages_spoken || [],
            gender: wp.gender || '',
            age: wp.age?.toString() || '',
            preferred_areas: wp.preferred_areas || [],
            profile_picture_url: wp.profile_picture_url || '',
            video_url: wp.video_url || '',
            preferred_society_id: wp.preferred_society_id || '',
            emergency_contact: wp.emergency_contact || '',
            aadhaar_front_url: wp.aadhaar_front_url || '',
            aadhaar_back_url: wp.aadhaar_back_url || ''
          });

          // Check badges status
          const hasSelfie = !!wp.profile_picture_url;
          const hasVideo = !!wp.video_url;
          
          setBadges([
            { name: 'Mobile', status: sessionUser.phone ? 'approved' : 'pending' },
            { name: 'Aadhaar', status: wp.is_aadhaar_verified ? 'approved' : 'pending' },
            { name: 'Police', status: wp.is_police_verified ? 'approved' : 'pending' },
            { name: 'Interview', status: wp.is_interview_verified ? 'approved' : 'pending' },
            { name: 'Video', status: hasVideo ? 'approved' : 'pending' }
          ]);

          if (wp.availability_slots) {
            const slots = wp.availability_slots as any;
            if (slots.weekly_grid) {
              setAvailability(slots.weekly_grid);
            } else {
              setAvailability(slots);
            }
          }
        } else {
          setWorkerProfile({
            name: profile?.full_name || 'Guest Worker',
            category: 'None',
            expectedSalary: '0',
            experience: '0 Years',
            society: 'Not configured',
            phone: sessionUser.phone || sessionUser.email || '',
            languages: [],
            gender: '',
            age: '',
            preferred_areas: [],
            profile_picture_url: '',
            video_url: '',
            preferred_society_id: '',
            emergency_contact: '',
            aadhaar_front_url: '',
            aadhaar_back_url: ''
          });
        }

        // Fetch applications with joined profiles containing phone number
        const { data: apps } = await supabase
          .from('applications')
          .select('*, job:jobs(*, employer:profiles(*, employer_profiles(*)))')
          .eq('worker_id', sessionUser.id);

        if (apps && apps.length > 0) {
          setApplications(apps.map(a => {
            const employerProfile = a.job?.employer?.employer_profiles?.[0];
            return {
              id: a.id,
              job_id: a.job_id,
              employer: employerProfile?.name || 'Employer',
              category: a.job?.category || 'General',
              salary: `₹${a.job?.salary_range_min?.toLocaleString()}/mo`,
              status: a.status || 'Applied',
              date: `Applied ${new Date(a.created_at).toLocaleDateString()}`,
              employer_phone: a.job?.employer?.phone || '',
              employer_user_id: a.job?.employer?.id || ''
            };
          }));
        }

        // Fetch open approved jobs
        const { data: openJobs } = await supabase
          .from('jobs')
          .select('*, employer:profiles(*, employer_profiles(*)), society:societies(*)')
          .eq('status', 'approved');

        if (openJobs) {
          setAvailableJobs(openJobs.map(j => {
            const employerProfile = j.employer?.employer_profiles?.[0];
            return {
              id: j.id,
              title: j.title || `${j.category?.toUpperCase() || 'General'} Helper Needed`,
              category: j.category,
              description: j.description || '',
              salary_range_min: j.salary_range_min || 0,
              salary_range_max: j.salary_range_max || 0,
              society: j.society?.name || 'Nearby Society',
              employer: employerProfile?.name || 'Employer Household',
              employer_user_id: j.employer?.id || '',
              employer_phone: j.employer?.phone || ''
            };
          }));
        }

      } catch (err) {
        console.error("Worker fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerData();
  }, [router]);

  const toggleCell = async (day: string, slotId: string) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    const daySlots = availability[day] || [];
    const updated = daySlots.includes(slotId)
      ? daySlots.filter(s => s !== slotId)
      : [...daySlots, slotId];

    const newAvailability = { ...availability, [day]: updated };
    setAvailability(newAvailability);

    if (!isPlaceholder && user) {
      try {
        await supabase
          .from('worker_profiles')
          .update({ availability_slots: newAvailability })
          .eq('user_id', user.id);
      } catch (err) {
        console.error("Save availability error:", err);
      }
    }
  };

  // Edit handlers
  const handleEditClick = () => {
    setEditName(workerProfile.name);
    setEditCategory(workerProfile.category.split(' / ').filter(Boolean));
    setEditExpectedSalary(workerProfile.expectedSalary);
    setEditExperience(workerProfile.experience.split(' ')[0]);
    setEditSocietyId(workerProfile.preferred_society_id || '');
    setEditLanguages(workerProfile.languages);
    setEditPreferredAreas(workerProfile.preferred_areas);
    setEditGender(workerProfile.gender);
    setEditAge(workerProfile.age);
    setEditEmergencyContact(workerProfile.emergency_contact);
    setEditSelfiePreview(workerProfile.profile_picture_url ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/worker-selfies/${workerProfile.profile_picture_url}` : null);
    
    setIsEditing(true);
    setActiveTab('profile');
  };

  const handleAddPreferredArea = () => {
    if (editAreasInput.trim() && !editPreferredAreas.includes(editAreasInput.trim())) {
      setEditPreferredAreas([...editPreferredAreas, editAreasInput.trim()]);
      setEditAreasInput('');
    }
  };

  const handleRemovePreferredArea = (area: string) => {
    setEditPreferredAreas(editPreferredAreas.filter(a => a !== area));
  };

  const onSelfieFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const err = validateFile(file, 5, ['image/jpeg', 'image/png', 'image/webp']);
      if (err) return setError(err);
      setEditSelfieFile(file);
      setEditSelfiePreview(URL.createObjectURL(file));
    }
  };

  const onAadhaarFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const err = validateFile(file, 5, ['image/jpeg', 'image/png', 'image/webp']);
      if (err) return setError(err);
      setEditAadhaarFrontFile(file);
    }
  };

  const onAadhaarBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const err = validateFile(file, 5, ['image/jpeg', 'image/png', 'image/webp']);
      if (err) return setError(err);
      setEditAadhaarBackFile(file);
    }
  };

  const onVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const err = validateFile(file, 50, ['video/mp4', 'video/webm', 'video/quicktime']);
      if (err) return setError(err);
      setEditVideoFile(file);
    }
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');
    
    if (!editName.trim()) return setError('Please enter full name.');
    if (!editGender) return setError('Please select gender.');
    if (!editAge || parseInt(editAge) < 18 || parseInt(editAge) > 80) return setError('Please enter valid age (18 - 80).');
    if (editLanguages.length === 0) return setError('Please select at least one language.');
    if (editCategory.length === 0) return setError('Please select at least one skill.');

    setSaveLoading(true);

    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setTimeout(() => {
          setWorkerProfile((prev: any) => ({
            ...prev,
            name: editName,
            category: editCategory.join(' / '),
            expectedSalary: editExpectedSalary,
            experience: `${editExperience || '0'} Years`,
            society: societiesList.find(s => s.id === editSocietyId)?.name || 'Custom Society',
            languages: editLanguages,
            preferred_areas: editPreferredAreas,
            gender: editGender,
            age: editAge,
            preferred_society_id: editSocietyId,
            emergency_contact: editEmergencyContact
          }));
          setSuccess('Profile updated successfully (Mock mode)!');
          setSaveLoading(false);
          setIsEditing(false);
        }, 1500);
        return;
      }

      // Live Supabase update
      let selfiePath = workerProfile.profile_picture_url;
      let videoPath = workerProfile.video_url;
      let frontPath = workerProfile.aadhaar_front_url;
      let backPath = workerProfile.aadhaar_back_url;

      if (editSelfieFile) {
        const { data, error: selfieErr } = await supabase.storage
          .from('worker-selfies')
          .upload(`${user.id}/selfie-${Date.now()}.png`, editSelfieFile);
        if (selfieErr) throw selfieErr;
        selfiePath = data.path;
      }

      if (editAadhaarFrontFile) {
        const { data, error: fErr } = await supabase.storage
          .from('worker-documents')
          .upload(`${user.id}/aadhaar-front-${Date.now()}.png`, editAadhaarFrontFile, { upsert: true });
        if (fErr) throw fErr;
        frontPath = data.path;
      }

      if (editAadhaarBackFile) {
        const { data, error: bErr } = await supabase.storage
          .from('worker-documents')
          .upload(`${user.id}/aadhaar-back-${Date.now()}.png`, editAadhaarBackFile, { upsert: true });
        if (bErr) throw bErr;
        backPath = data.path;
      }

      if (editVideoFile) {
        const { data, error: vErr } = await supabase.storage
          .from('worker-videos')
          .upload(`${user.id}/intro-video.mp4`, editVideoFile, { upsert: true });
        if (vErr) throw vErr;
        videoPath = data.path;
      }

      // Update worker_profiles using the correct table schema
      const { error: wpErr } = await supabase
        .from('worker_profiles')
        .update({
          full_name: editName,
          gender: editGender,
          age: parseInt(editAge),
          languages_spoken: editLanguages,
          skills: editCategory,
          expected_salary: parseInt(editExpectedSalary) || 0,
          preferred_society_id: editSocietyId || null,
          preferred_areas: editPreferredAreas,
          experience_years: parseInt(editExperience) || 0,
          emergency_contact: editEmergencyContact,
          profile_picture_url: selfiePath,
          video_url: videoPath,
          aadhaar_front_url: frontPath,
          aadhaar_back_url: backPath
        })
        .eq('user_id', user.id);

      if (wpErr) throw wpErr;

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("Save profile error:", err);
      setError(err.message || 'Failed to save changes. Please try again.');
      setSaveLoading(false);
    }
  };

  // Job application submission
  const handleApplyJob = async (jobId: string) => {
    setError('');
    setSuccess('');
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setApplications(prev => [
          ...prev,
          {
            id: `app_mock_${Date.now()}`,
            job_id: jobId,
            employer: "Mock Household",
            category: "Maid",
            salary: "₹15,000/mo",
            status: "Applied",
            date: "Applied just now",
            employer_phone: "+919876543210",
            employer_user_id: 'e_mock_1'
          }
        ]);
        setSuccess('Applied successfully (Mock mode)!');
        return;
      }

      const { error: appErr } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          worker_id: user.id,
          status: 'applied'
        });

      if (appErr) throw appErr;

      setSuccess('Job application submitted successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("Apply job error:", err);
      setError(err.message || 'Failed to submit application.');
    }
  };

  // Star review submit
  const submitEmployerReview = async () => {
    setError('');
    setSuccess('');
    if (!reviewRating) return setError('Please select a star rating.');

    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setShowReviewModal(false);
        setSuccess('Review submitted successfully for admin review (Mock)!');
        return;
      }

      const { error: rErr } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: user.id,
          target_id: selectedJobForReview.employer_user_id,
          rating: reviewRating,
          comment: reviewComment,
          status: 'pending' // Enforces admin moderation
        });

      if (rErr) throw rErr;

      setShowReviewModal(false);
      setSuccess('Your review has been submitted for admin moderation!');
    } catch (err: any) {
      console.error("Submit review error:", err);
      setError(err.message || 'Failed to submit review.');
    }
  };

  // Helper avatar URL construct
  const isPlaceholder = !workerProfile.profile_picture_url;
  const avatarUrl = isPlaceholder 
    ? "" 
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/worker-selfies/${workerProfile.profile_picture_url}`;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] max-w-md mx-auto w-full border-x border-slate-100 font-sans antialiased text-slate-800">
      
      {/* HEADER NAVIGATION */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Sevikaa Logo" className="h-8 w-auto object-contain" />
          <span className="font-black text-base tracking-tight text-slate-800">Sevikaa</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-transparent border-0 cursor-pointer"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* DYNAMIC SCROLLABLE CONTENT */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6 pb-24">
        
        {/* Global Action Notifications Banner */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-500 text-center font-medium flex items-center justify-center gap-1.5">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-500 text-center font-medium flex items-center justify-center gap-1.5">
            <Check size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Sub-tab Back Navigation helper */}
        {activeTab !== 'home' && (
          <button 
            onClick={() => {
              setIsEditing(false);
              setActiveTab('home');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 hover:bg-slate-50 hover:text-slate-800 active:scale-95 transition-all cursor-pointer shadow-sm shadow-slate-100/50"
          >
            <ArrowLeft size={12} strokeWidth={3} />
            <span>BACK TO HOME</span>
          </button>
        )}

        {/* ================= HOMEPAGE TAB ================= */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
            {/* Welcome banner */}
            <div className="space-y-1 px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Welcome Back 👋</span>
              <h1 className="text-2xl font-black text-slate-800 leading-tight">Hi, {workerProfile.name.split(' ')[0]}</h1>
              <p className="text-xs text-slate-500 font-medium">Ready to discover your next opportunity?</p>
            </div>

            {/* Worker Welcome Profile Card */}
            <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-[#2563EB] overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={workerProfile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-slate-300">
                      {workerProfile.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <h2 className="text-base font-black text-slate-800">{workerProfile.name}</h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-[#22C55E] rounded-full text-[9px] font-bold border border-green-100/60 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                      Available for Work
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#2563EB]">{workerProfile.category}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    📍 {workerProfile.society}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification checklist status */}
            <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-800">Verification Status</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Complete your verification to increase employer trust and receive more job opportunities.
                </p>
              </div>

              <div className="grid grid-cols-5 gap-1 pt-2">
                {[
                  { key: 'Mobile', label: 'Mobile' },
                  { key: 'Aadhaar', label: 'Aadhaar' },
                  { key: 'Police', label: 'Police Check' },
                  { key: 'Interview', label: 'Interview' },
                  { key: 'Video', label: 'Video Intro' }
                ].map((badge) => {
                  const bStatus = badges.find(b => b.name === badge.key)?.status === 'approved';
                  return (
                    <div key={badge.key} className="flex flex-col items-center text-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border transition-all ${
                        bStatus 
                          ? 'bg-green-50 text-[#22C55E] border-green-100' 
                          : 'bg-slate-50 text-slate-300 border-slate-100'
                      }`}>
                        <Check size={14} strokeWidth={bStatus ? 4 : 2} />
                      </div>
                      <span className="text-[8px] font-bold text-slate-500 mt-1.5 leading-tight">{badge.label}</span>
                    </div>
                  );
                })}
              </div>

              {badges.every(b => b.status === 'approved') ? (
                <div className="p-3 bg-green-50/50 border border-green-100 rounded-xl text-center">
                  <span className="text-[10px] font-black text-green-700">🎉 Profile Fully Verified</span>
                  <p className="text-[9px] text-green-600 font-semibold mt-0.5">Your profile is trusted by employers and receives higher visibility.</p>
                </div>
              ) : (
                <p className="text-[9px] text-slate-400 text-center font-bold">
                  🔒 Complete pending checks to unlock your full visibility score.
                </p>
              )}
            </div>

            {/* Uber/Airbnb Grid Action Cards */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setActiveTab('profile');
                }}
                className="p-5 bg-white rounded-[20px] border border-slate-100 text-left shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 flex flex-col justify-between min-h-[140px] group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
                  <User size={18} />
                </div>
                <div className="space-y-1 mt-4">
                  <span className="block text-xs font-black text-slate-800 group-hover:text-[#2563EB] transition-colors">My Profile</span>
                  <span className="block text-[9px] text-slate-400 font-medium leading-normal">
                    Manage your personal details, experience, skills and documents.
                  </span>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('availability')}
                className="p-5 bg-white rounded-[20px] border border-slate-100 text-left shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 flex flex-col justify-between min-h-[140px] group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center border border-green-100 shadow-sm shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="space-y-1 mt-4">
                  <span className="block text-xs font-black text-slate-800 group-hover:text-green-600 transition-colors">Availability</span>
                  <span className="block text-[9px] text-slate-400 font-medium leading-normal">
                    Update your work schedule and preferred working hours.
                  </span>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('applications')}
                className="p-5 bg-white rounded-[20px] border border-slate-100 text-left shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 flex flex-col justify-between min-h-[140px] group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
                  <Briefcase size={18} />
                </div>
                <div className="space-y-1 mt-4">
                  <span className="block text-xs font-black text-slate-800 group-hover:text-amber-500 transition-colors">Applications</span>
                  <span className="block text-[9px] text-slate-400 font-medium leading-normal">
                    Track your job applications and employer responses.
                  </span>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('wallet')}
                className="p-5 bg-white rounded-[20px] border border-slate-100 text-left shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 flex flex-col justify-between min-h-[140px] group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm shrink-0">
                  <Wallet size={18} />
                </div>
                <div className="space-y-1 mt-4">
                  <span className="block text-xs font-black text-slate-800 group-hover:text-purple-600 transition-colors">My Wallet</span>
                  <span className="block text-[9px] text-slate-400 font-medium leading-normal">
                    View earnings, incentives, referral rewards and payment history.
                  </span>
                </div>
              </button>
            </div>

            {/* Profile Completion card */}
            <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-800">Complete Your Profile</h3>
                  <p className="text-[10px] text-slate-400 font-medium">A complete profile helps employers trust you faster.</p>
                </div>
                <span className="text-xs font-extrabold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 shrink-0">85% Complete</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#2563EB] h-full rounded-full transition-all duration-500" style={{ width: '85%' }} />
              </div>

              {/* Remaining Items */}
              <div className="space-y-2 pt-1 text-[10px] font-bold text-slate-500">
                <span className="block text-[9px] text-slate-400 uppercase tracking-wide">Remaining Items:</span>
                <div className="grid grid-cols-2 gap-2">
                  <span className="flex items-center gap-1.5 text-slate-500">❌ Upload Profile Photo</span>
                  <span className="flex items-center gap-1.5 text-slate-500">❌ Add Experience</span>
                  <span className="flex items-center gap-1.5 text-slate-500">❌ Add Languages</span>
                  <span className="flex items-center gap-1.5 text-slate-500">❌ Add Emergency Contact</span>
                </div>
              </div>

              <button 
                onClick={handleEditClick}
                className="w-full py-3 bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-all active:scale-98 shadow-sm shadow-blue-100 hover:bg-blue-700 cursor-pointer text-center border-0"
              >
                Complete Now
              </button>
            </div>

            {/* Latest Updates Card */}
            <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <h3 className="text-xs font-black text-slate-800">Latest Updates</h3>
              <div className="space-y-2.5 text-[10px] font-bold text-slate-700">
                {[
                  { icon: "🎉", text: "Your profile has been verified." },
                  { icon: "💼", text: "New jobs are available near you." },
                  { icon: "💳", text: "Wallet updated successfully." },
                  { icon: "📅", text: "Upcoming interview tomorrow." }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100/50">
                    <span className="text-sm shrink-0">{item.icon}</span>
                    <span className="flex-1">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= PROFILE TAB ================= */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            {!isEditing ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-lg font-black text-slate-800">My Profile Details</h2>
                  <button 
                    onClick={handleEditClick}
                    className="py-2 px-4 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-sm border-0"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 space-y-6">
                  {/* Photo Display */}
                  <div className="flex flex-col items-center pb-4 border-b border-slate-100">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-black text-slate-300">{workerProfile.name.charAt(0)}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Expected Salary</span>
                      <span className="block text-base font-black text-[#22C55E] mt-0.5">₹{workerProfile.expectedSalary?.toLocaleString()}/mo</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Experience</span>
                      <span className="block text-base font-black text-slate-700 mt-0.5">{workerProfile.experience}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Gender</span>
                        <span className="block text-xs font-bold text-slate-700 mt-0.5 capitalize">{workerProfile.gender || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Age</span>
                        <span className="block text-xs font-bold text-slate-700 mt-0.5">{workerProfile.age || 'Not specified'} Years</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Spoken Languages</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {workerProfile.languages.map((l: string) => (
                          <span key={l} className="px-3 py-1 bg-slate-50 border border-slate-100 text-slate-700 text-[10px] font-bold rounded-full">{l}</span>
                        ))}
                        {workerProfile.languages.length === 0 && <span className="text-xs font-medium text-slate-400">None added</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Mobile Number</span>
                        <span className="block text-xs font-bold text-slate-700 mt-0.5">{workerProfile.phone}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Emergency Contact</span>
                        <span className="block text-xs font-bold text-slate-700 mt-0.5">{workerProfile.emergency_contact || 'None set'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Preferred Society</span>
                      <span className="block text-xs font-bold text-slate-700 mt-0.5">{workerProfile.society}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Preferred Service Areas</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {workerProfile.preferred_areas?.map((area: string) => (
                          <span key={area} className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100/50">{area}</span>
                        ))}
                        {(!workerProfile.preferred_areas || workerProfile.preferred_areas.length === 0) && (
                          <span className="text-xs font-medium text-slate-400">None added</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-lg font-black text-slate-800">Edit Profile</h2>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer border-0"
                  >
                    Cancel
                  </button>
                </div>

                <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5 space-y-5">
                  {/* Selfie Upload section */}
                  <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center relative shadow-inner">
                      {editSelfiePreview ? (
                        <img src={editSelfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-black text-slate-300">{editName.charAt(0)}</span>
                      )}
                    </div>
                    <label htmlFor="edit-selfie" className="py-1.5 px-3 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-lg text-[10px] active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                      <Camera size={12} />
                      Upload Photo
                    </label>
                    <input id="edit-selfie" type="file" accept="image/jpeg,image/png,image/webp" onChange={onSelfieFileChange} className="hidden" />
                  </div>

                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Janhvi"
                      className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Age and Gender */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Age (18 - 80)</label>
                      <input
                        type="number"
                        value={editAge}
                        onChange={(e) => setEditAge(e.target.value)}
                        placeholder="26"
                        className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Gender</label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value as any)}
                        className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="">Choose Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Experience & Expected Salary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Experience (Years)</label>
                      <input
                        type="number"
                        value={editExperience}
                        onChange={(e) => setEditExperience(e.target.value)}
                        placeholder="4"
                        className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Expected Salary (₹/mo)</label>
                      <input
                        type="number"
                        value={editExpectedSalary}
                        onChange={(e) => setEditExpectedSalary(e.target.value)}
                        placeholder="18000"
                        className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Emergency Contact Number</label>
                    <input
                      type="text"
                      value={editEmergencyContact}
                      onChange={(e) => setEditEmergencyContact(e.target.value)}
                      placeholder="Enter emergency phone number"
                      className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Categories/Skills */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Categories / Skills</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['maid', 'cook', 'nanny'].map((cat) => {
                        const isChecked = editCategory.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setEditCategory(prev => 
                                prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                              );
                            }}
                            className={`py-2 px-3 rounded-lg border text-[10px] font-black capitalize transition-all cursor-pointer ${
                              isChecked 
                                ? 'bg-blue-50 text-blue-600 border-blue-300' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {cat === 'maid' && '🧹 Maid'}
                            {cat === 'cook' && '🍳 Cook'}
                            {cat === 'nanny' && '👶 Nanny'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Spoken Languages</label>
                    <div className="flex flex-wrap gap-2">
                      {['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Assamese', 'Nepali'].map((lang) => {
                        const isChecked = editLanguages.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              setEditLanguages(prev => 
                                prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
                              );
                            }}
                            className={`py-1.5 px-3 rounded-full border text-[9px] font-bold transition-all cursor-pointer ${
                              isChecked 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred Society */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Preferred Apartment Society</label>
                    <select
                      value={editSocietyId}
                      onChange={(e) => setEditSocietyId(e.target.value)}
                      className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="">-- Choose Society --</option>
                      {societiesList.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Preferred Service Areas */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Preferred Service Areas</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editAreasInput}
                        onChange={(e) => setEditAreasInput(e.target.value)}
                        placeholder="E.g., Whitefield, JP Nagar"
                        className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleAddPreferredArea}
                        className="px-4 py-3 bg-[#2563EB] text-white rounded-xl font-bold text-xs hover:bg-blue-700 active:scale-95 transition-colors cursor-pointer border-0"
                      >
                        Add
                      </button>
                    </div>
                    {editPreferredAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {editPreferredAreas.map(area => (
                          <span key={area} className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <span>{area}</span>
                            <button type="button" onClick={() => handleRemovePreferredArea(area)} className="text-slate-400 hover:text-slate-600 font-bold ml-1 bg-transparent border-0 cursor-pointer">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Document uploads */}
                  <div className="space-y-3.5 pt-2 border-t border-slate-100">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Update Documents</label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col items-center p-3 border border-slate-200 rounded-xl bg-slate-50 text-center relative cursor-pointer active:scale-95 transition-all">
                        <label htmlFor="edit-aadhaar-front" className="cursor-pointer flex flex-col items-center">
                          <Upload size={16} className={editAadhaarFrontFile ? 'text-green-500' : 'text-slate-400'} />
                          <span className="text-[10px] font-bold text-slate-700 mt-1">Aadhaar Front</span>
                          <span className="text-[8px] text-slate-400 truncate max-w-[120px] mt-0.5">
                            {editAadhaarFrontFile ? editAadhaarFrontFile.name : 'Max 5MB (JPG, PNG)'}
                          </span>
                        </label>
                        <input id="edit-aadhaar-front" type="file" accept="image/jpeg,image/png,image/webp" onChange={onAadhaarFrontChange} className="hidden" />
                      </div>

                      <div className="flex flex-col items-center p-3 border border-slate-200 rounded-xl bg-slate-50 text-center relative cursor-pointer active:scale-95 transition-all">
                        <label htmlFor="edit-aadhaar-back" className="cursor-pointer flex flex-col items-center">
                          <Upload size={16} className={editAadhaarBackFile ? 'text-green-500' : 'text-slate-400'} />
                          <span className="text-[10px] font-bold text-slate-700 mt-1">Aadhaar Back</span>
                          <span className="text-[8px] text-slate-400 truncate max-w-[120px] mt-0.5">
                            {editAadhaarBackFile ? editAadhaarBackFile.name : 'Max 5MB (JPG, PNG)'}
                          </span>
                        </label>
                        <input id="edit-aadhaar-back" type="file" accept="image/jpeg,image/png,image/webp" onChange={onAadhaarBackChange} className="hidden" />
                      </div>
                    </div>

                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-3 relative cursor-pointer active:scale-95 transition-all">
                      <label htmlFor="edit-video" className="cursor-pointer flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-50 text-[#EA4335] rounded-xl shrink-0">
                            <Video size={16} />
                          </div>
                          <div className="text-left">
                            <span className="block text-[10px] font-bold text-slate-700">Video Introduction</span>
                            <span className="block text-[8px] text-slate-400 mt-0.5">
                              {editVideoFile ? editVideoFile.name : 'Max 50MB (MP4, WEBM)'}
                            </span>
                          </div>
                        </div>
                        <Upload size={14} className="text-slate-400" />
                      </label>
                      <input id="edit-video" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={onVideoChange} className="hidden" />
                    </div>
                  </div>

                  {/* Save Button */}
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-1.5 shadow-sm shadow-blue-100 cursor-pointer disabled:opacity-50 mt-4 border-0"
                  >
                    {saveLoading ? 'Saving changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= AVAILABILITY TAB ================= */}
        {activeTab === 'availability' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-black text-slate-800 px-1">Availability Grid</h2>
            <p className="text-xs text-slate-500 px-1">Employers will find you based on the checked active slots below:</p>
            
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-4">
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 text-[10px] w-full">
                <div className="grid grid-cols-8 bg-slate-100 border-b border-slate-200 text-center py-2.5 font-bold text-slate-500">
                  <div>Slot</div>
                  {DAYS.map(d => <div key={d}>{d}</div>)}
                </div>
                {SLOTS.map((slot) => (
                  <div key={slot.id} className="grid grid-cols-8 border-b border-slate-200 items-center last:border-0 min-h-[44px] text-center">
                    <div className="font-bold text-slate-400 py-1 border-r border-slate-200 truncate px-0.5 leading-tight" title={slot.label}>
                      {slot.label.split(' ')[0]}
                    </div>
                    {DAYS.map((day) => {
                      const isSelected = availability[day]?.includes(slot.id);
                      return (
                        <div
                          key={day}
                          onClick={() => toggleCell(day, slot.id)}
                          className={`h-full border-r border-slate-200 last:border-r-0 flex items-center justify-center cursor-pointer transition-all active:scale-90 select-none ${
                            isSelected ? 'bg-[#22C55E] text-white' : 'hover:bg-slate-100'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={4} />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 text-center font-bold mt-3">Tap cells to toggle your weekly schedule slots.</p>
            </div>
          </div>
        )}

        {/* ================= APPLICATIONS TAB ================= */}
        {activeTab === 'applications' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-black text-slate-800 px-1">Job Applications</h2>
            <div className="space-y-3">
              {applications.map((app, i) => (
                <div key={i} className="p-5 bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-700">{app.employer}</h3>
                      <p className="text-xs text-[#2563EB] font-bold mt-0.5">{app.category} • {app.salary}</p>
                      <p className="text-[9px] text-slate-400 mt-1.5 font-bold">{app.date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      app.status === 'Interviewing' 
                        ? 'bg-amber-50 text-[#F59E0B] border border-amber-100/50' 
                        : app.status === 'Accepted'
                        ? 'bg-green-50 text-green-600 border border-green-100/50'
                        : 'bg-slate-50 text-slate-500 border border-slate-200/50'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  {/* WhatsApp redirect connector if status allows it */}
                  {(app.status === 'Interviewing' || app.status === 'Accepted') && app.employer_phone && (
                    <button
                      onClick={() => {
                        const cleanPhone = app.employer_phone.replace(/\D/g, '');
                        const waUrl = `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(app.employer)},%20I%20am%20contacting%20you%20regarding%20my%20job%20application%20on%20Sevikaa.`;
                        window.open(waUrl, '_blank');
                      }}
                      className="w-full py-2 bg-green-50 text-[#22C55E] hover:bg-green-100 border border-green-200/50 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                    >
                      <PhoneCall size={12} />
                      <span>Contact via WhatsApp</span>
                    </button>
                  )}

                  {/* Rate Employer Button */}
                  {(app.status === 'Accepted' || app.status === 'Interviewing') && (
                    <button
                      onClick={() => {
                        setSelectedJobForReview(app);
                        setShowReviewModal(true);
                      }}
                      className="w-full py-2 bg-amber-50 text-[#F59E0B] hover:bg-amber-100 border border-amber-200/50 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                    >
                      ★ Rate Employer
                    </button>
                  )}
                </div>
              ))}
              {applications.length === 0 && (
                <div className="p-8 text-center text-xs font-bold text-slate-400 bg-white rounded-[20px] border border-slate-100">
                  No applications submitted yet. Go to the "Jobs" tab to apply!
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= JOBS TAB ================= */}
        {activeTab === 'jobs' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-black text-slate-800 px-1">Available Jobs Near You</h2>
            <div className="space-y-3">
              {availableJobs.map((job) => {
                const isApplied = applications.some(app => app.job_id === job.id);
                return (
                  <div key={job.id} className="p-5 bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-3">
                    <div>
                      <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase">{job.category}</span>
                      <h3 className="text-sm font-black text-slate-800 mt-2">{job.title}</h3>
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed mt-1">{job.description}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-2.5 border-t border-slate-50">
                      <span>Salary: ₹{job.salary_range_min?.toLocaleString()} - ₹{job.salary_range_max?.toLocaleString()}/mo</span>
                      <span>📍 {job.society}</span>
                    </div>
                    <button 
                      onClick={() => handleApplyJob(job.id)}
                      disabled={isApplied}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition-all border-0 ${
                        isApplied 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-[#2563EB] text-white hover:bg-blue-700 active:scale-95 cursor-pointer shadow-sm shadow-blue-100'
                      }`}
                    >
                      {isApplied ? '✓ Applied' : 'Apply for Job'}
                    </button>
                  </div>
                );
              })}
              {availableJobs.length === 0 && (
                <div className="p-8 text-center text-xs font-bold text-slate-400 bg-white rounded-[20px] border border-slate-100">
                  No open job requirements available near you at this time.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= WALLET TAB ================= */}
        {activeTab === 'wallet' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-black text-slate-800 px-1">My Wallet</h2>
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8 text-center space-y-4">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Balance</span>
              <span className="block text-4xl font-black text-[#22C55E]">₹0.00</span>
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold max-w-xs mx-auto">
                Workers never pay any subscription fees or referral costs. Your transaction wallet ledger is clear.
              </p>
            </div>
          </div>
        )}

        {/* ================= SETTINGS TAB ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-black text-slate-800 px-1">Settings</h2>
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5 space-y-5">
              <div className="space-y-2">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Change App Language</span>
                <div className="grid grid-cols-3 gap-2">
                  {[['en', 'English'], ['hi', 'Hindi'], ['hn', 'Hinglish']].map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => setLanguage(code as any)}
                      className="py-2.5 px-3 border border-slate-200 rounded-xl font-bold text-xs hover:border-[#2563EB] active:scale-95 transition-all text-slate-700 bg-white cursor-pointer"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-4 mt-4 border border-[#EA4335]/20 hover:bg-[#EA4335]/5 text-[#EA4335] font-bold rounded-2xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-transparent"
              >
                <LogOut size={16} />
                <span>Log Out Session</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= REGULATORY FOOTER ================= */}
        <footer className="bg-slate-900 text-white py-8 px-6 mt-8 rounded-t-[20px] text-center text-xs space-y-4 -mx-4">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 font-bold text-slate-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/safety" className="hover:text-white transition-colors">Safety</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[9px] text-slate-500 border-t border-slate-800 pt-4">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <span className="text-slate-700">|</span>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <span className="text-slate-700">|</span>
            <Link href="/refunds" className="hover:text-slate-300 transition-colors">Refunds & Cancellation</Link>
          </div>
          <p className="text-[9px] text-slate-500 font-medium">
            Powered by YugaYatra Retail (OPC) Private Limited<br />
            © {new Date().getFullYear()} Sevikaa. All rights reserved.
          </p>
        </footer>

      </div>

      {/* RATINGS & REVIEW MODAL */}
      {showReviewModal && selectedJobForReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[20px] p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-800">Rate Employer: {selectedJobForReview.employer}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Submit your rating. This review is held in pending status for moderation.</p>
            </div>
            
            {/* Star Selector */}
            <div className="flex gap-2.5 justify-center py-2 text-3xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  type="button"
                  onClick={() => setReviewRating(star)} 
                  className={`transition-colors bg-transparent border-0 cursor-pointer ${reviewRating >= star ? 'text-amber-500' : 'text-slate-200'}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea 
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="How was your experience working with this household? (Polite and professional comments only)"
              className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-600 focus:outline-none resize-none"
              rows={3}
            />

            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setShowReviewModal(false)} 
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border-0 cursor-pointer active:scale-98 transition-all"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={submitEmployerReview} 
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border-0 cursor-pointer active:scale-98 transition-all shadow-sm shadow-blue-100"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="bg-white border-t border-slate-100 flex justify-between items-center px-4 py-2 sticky bottom-0 z-50 shadow-lg max-w-md mx-auto w-full">
        {[
          { id: 'home', label: 'Home', icon: <Briefcase size={18} /> },
          { id: 'profile', label: 'Profile', icon: <User size={18} /> },
          { id: 'availability', label: 'Availability', icon: <Calendar size={18} /> },
          { id: 'jobs', label: 'Find Jobs', icon: <Briefcase size={18} /> },
          { id: 'applications', label: 'My Applications', icon: <FileText size={18} /> },
          { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setIsEditing(false);
                setActiveTab(tab.id as any);
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 select-none active:scale-95 transition-all min-h-[48px] cursor-pointer bg-transparent border-0 ${
                isActive ? 'text-[#2563EB] font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              {tab.icon}
              <span className="text-[8px] mt-1 leading-tight text-center">{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
