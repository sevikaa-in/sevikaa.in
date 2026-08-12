"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { GlobalLanguageSelector } from '@/components/GlobalLanguageSelector';
import { ToastContainer, ToastItem } from '@/components/admin/dashboard/Toast';
import { 
  Home, PlusCircle, Search, User, Users, CreditCard, LogOut, 
  ArrowLeft, CheckCircle2, ShieldAlert, Sparkles, Phone, Lock, Briefcase, Menu, X, Bell 
} from 'lucide-react';



interface EmployerDashboardContextProps {
  user: any;
  loading: boolean;
  employerProfile: any;
  setEmployerProfile: React.Dispatch<React.SetStateAction<any>>;
  isPremium: boolean;
  bookmarkedContacts: string[];
  postedJobs: any[];
  societiesList: any[];
  deletionRequested: boolean;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  handleToggleBookmark: (workerId: string) => void;
  handlePostJob: (jobData: any) => Promise<void>;
  handleUpdateJob: (jobId: string, updatedData: any) => Promise<void>;
  handleSaveEmployerProfile: (updatedData: any) => Promise<void>;
  handleRequestAccountDeletion: (reason: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const EmployerDashboardContext = createContext<EmployerDashboardContextProps | null>(null);

export const useEmployerDashboard = () => {
  const context = useContext(EmployerDashboardContext);
  if (!context) {
    throw new Error('useEmployerDashboard must be used within EmployerDashboardLayout');
  }
  return context;
};

export default function EmployerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [bookmarkedContacts, setBookmarkedContacts] = useState<string[]>([]);
  const [societiesList, setSocietiesList] = useState<any[]>([]);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [employerProfile, setEmployerProfile] = useState<any>({
    company_name: "Employer Profile",
    email: "",
    society_name: "",
    phone: "",
    subscription_status: "Standard Plan",
    address: ""
  });

  const [postedJobs, setPostedJobs] = useState<any[]>([]);

  const showToast = (message: string, type?: 'success' | 'error' | 'warning' | 'info') => {
    const id = `toast_${Date.now()}`;
    const toastType = type || 'info';
    setToasts(prev => [...prev, { id, message, type: toastType }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchSession = async () => {
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setUser({ id: 'emp_demo', email: 'lakhan.sah@gmail.com' });
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      let activeUser: any = session?.user;

      if (!activeUser && typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('sevikaa_user');
        if (storedUser) {
          try { activeUser = JSON.parse(storedUser); } catch (e) {}
        }
      }

      let activeUserId = activeUser?.id;
      let profileData: any = null;
      let empProf: any = null;

      if (activeUser?.id) {
        setUser(activeUser);

        try {
          const res = await fetch(`/api/auth/me?userId=${activeUser.id}`);
          if (res.ok) {
            const meData = await res.json();
            if (meData.success) {
              profileData = meData.profile;
              empProf = meData.employerProfile;
            }
          }
        } catch (apiErr) {
          console.warn("API employer profile fetch warning:", apiErr);
        }

        if (!profileData && !empProf) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*, employer_profiles(*)')
            .eq('id', activeUser.id)
            .maybeSingle();

          profileData = profile;
          empProf = profile?.employer_profiles 
            ? (Array.isArray(profile.employer_profiles) ? profile.employer_profiles[0] : profile.employer_profiles)
            : null;
        }

        if (!empProf && activeUser.id) {
          const { data: directEmpProf } = await supabase
            .from('employer_profiles')
            .select('*')
            .eq('user_id', activeUser.id)
            .maybeSingle();
          if (directEmpProf) empProf = directEmpProf;
        }

        if (profileData?.role && profileData.role !== 'employer') {
          if (profileData.role === 'worker') router.push('/worker');
          else if (profileData.role === 'super-admin') router.push('/super-admin/dashboard');
          else if (profileData.role === 'admin') router.push('/admin/dashboard');
          return;
        }

        if (typeof window !== 'undefined') {
          document.cookie = `sevikaa_user_role=employer; path=/; max-age=86400`;
        }

        if (profileData || empProf || activeUser) {
          if (profileData?.status === 'deletion_requested') {
            setDeletionRequested(true);
          }
          setEmployerProfile({
            user_id: activeUser.id,
            id: empProf?.id || activeUser.id,
            company_name: empProf?.company_name || empProf?.name || profileData?.full_name || 'Employer',
            name: empProf?.company_name || empProf?.name || profileData?.full_name || 'Employer',
            email: profileData?.email || activeUser.email || empProf?.email || '',
            society_name: empProf?.society_name || empProf?.billing_address || '',
            phone: profileData?.phone || empProf?.phone || activeUser.phone || '',
            subscription_status: empProf?.subscription_status || 'Free',
            address: empProf?.address || empProf?.billing_address || '',
            tower: empProf?.tower_block || '',
            city: empProf?.city || '',
            state: empProf?.state || '',
            pincode: empProf?.pincode || '',
            gstin: empProf?.gstin || '',
            alt_phone: empProf?.alternate_phone || '',
            verification_pref: empProf?.verification_requirement || 'Aadhaar + Police Audit (Default)',
            residency_proof_url: empProf?.residency_proof_url || null,
            aadhaar_front_url: empProf?.aadhaar_front_url || null,
            aadhaar_back_url: empProf?.aadhaar_back_url || null,
            avatar_url: empProf?.avatar_url || profileData?.avatar_url || null,
            status: empProf?.status || profileData?.status || 'live'
          });

          // Check if onboarding is pending or incomplete
          const isComplete = empProf?.society_name && empProf?.company_name && empProf?.company_name !== 'Employer Profile' && empProf?.company_name !== 'Employer';
          const isPendingStatus = empProf?.status === 'onboarding_pending' || profileData?.status === 'onboarding_pending';

          if ((!isComplete || isPendingStatus) && pathname !== '/employer/onboarding') {
            router.push('/employer/onboarding');
          }
        }
      }

      // Fetch ONLY this Employer's Own Jobs from Supabase Database
      let dbJobsData: any[] = [];

      if (activeUserId) {
        const { data: byEmpId, error: empIdErr } = await supabase
          .from('jobs')
          .select('*')
          .or(`employer_id.eq.${activeUserId},created_by.eq.${activeUserId},user_id.eq.${activeUserId}`)
          .order('created_at', { ascending: false });

        if (!empIdErr && byEmpId) {
          dbJobsData = byEmpId;
        }
      } else {
        dbJobsData = [];
      }

      if (dbJobsData && dbJobsData.length > 0) {
        const mappedJobs = dbJobsData.map((j: any) => ({
          id: j.id,
          title: j.title || 'Job Requisition',
          category: j.category || 'general',
          society_name: j.society_name || j.societyName || employerProfile.society_name || 'DLF Westend Heights',
          salary: j.salary_offered || j.salary || '15000',
          status: j.status || 'active',
          adminNote: j.admin_note || j.adminNote || undefined,
          created_at: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : 'Today',
          applicationsCount: j.applications_count || j.applicationsCount || 0,
          description: j.description || '',
          family_members: j.family_members || '4 Members (2 Adults, 2 Kids)',
          flat_type: j.flat_type || '3BHK Apartment',
          shift_hours: j.shift_hours || 'Full Day (8:00 AM – 4:00 PM)',
          dietary_pref: j.dietary_pref || 'Both Veg & Non-Veg',
          leave_policy: j.leave_policy || '4 Sundays Off + 1 Paid Leave'
        }));
        setPostedJobs(mappedJobs);
      }
    } catch (err) {
      console.error("Error fetching employer session/jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleToggleBookmark = (workerId: string) => {
    setBookmarkedContacts(prev => 
      prev.includes(workerId) ? prev.filter(id => id !== workerId) : [...prev, workerId]
    );
  };

  const handlePostJob = async (jobData: any) => {
    const targetSociety = jobData.societyName || employerProfile.society_name || 'DLF Westend Heights';
    const newJob = {
      id: `job_${Date.now()}`,
      title: jobData.title,
      category: jobData.category,
      society_name: targetSociety,
      salary: jobData.salary,
      salary_offered: jobData.salary,
      status: 'pending',
      created_at: new Date().toISOString().split('T')[0],
      applicationsCount: 0,
      description: jobData.description,
      dietary_pref: jobData.dietaryPref,
      leave_policy: jobData.leavePolicy,
      family_members: '4 Members (2 Adults, 2 Kids)',
      flat_type: '3BHK Apartment',
      shift_hours: 'Full Day (8:00 AM – 4:00 PM)'
    };

    try {
      if (user?.id) {
        await supabase.from('jobs').insert([{
          employer_id: user.id,
          title: jobData.title,
          category: jobData.category,
          salary_offered: jobData.salary,
          salary: jobData.salary,
          status: 'pending',
          description: jobData.description,
          employer_name: employerProfile.company_name || 'Employer Household',
          society_name: targetSociety
        }]);
      }
    } catch (err) {
      console.error("Supabase job insert error:", err);
    }

    // Trigger Job Posted Email to Employer via API Route
    try {
      const empEmail = employerProfile.email || user?.email;
      if (empEmail) {
        const { webApiClient } = await import('@/lib/webApiClient');
        webApiClient.post('/api/notifications/send-email', {
          type: 'job-posted',
          toEmail: empEmail,
          data: {
            employerName: employerProfile.company_name,
            jobTitle: jobData.title,
            category: jobData.category,
            salary: jobData.salary,
            societyName: targetSociety
          }
        }).catch((err: any) => console.warn("Job posted email notice:", err));
      }
    } catch (emailErr) {
      console.warn("Job email trigger notice:", emailErr);
    }

    setPostedJobs(prev => [newJob, ...prev]);
    showToast('New job requisition submitted! Pending Admin audit before going live for workers.', 'info');
    router.push('/employer/jobs');
  };

  const handleUpdateJob = async (jobId: string, updatedData: any) => {
    try {
      await supabase.from('jobs').update({
        title: updatedData.title,
        salary_offered: updatedData.salary,
        description: updatedData.description,
        category: updatedData.category,
        society_name: updatedData.society_name || updatedData.societyName,
        status: 'pending' // Resubmit for review
      }).eq('id', jobId);
    } catch (err) {
      console.error("Supabase job update error:", err);
    }

    setPostedJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          ...updatedData,
          society_name: updatedData.society_name || updatedData.societyName || job.society_name,
          status: 'pending',
          adminNote: undefined
        };
      }
      return job;
    }));
    showToast('Job requisition updated and resubmitted for Admin review!', 'success');
  };

  const handleSaveEmployerProfile = async (updatedData: any) => {
    const isChangesRequested = employerProfile.status === 'changes_requested' || !!employerProfile.admin_note;
    const nextStatus = isChangesRequested ? 'pending_review' : employerProfile.status;

    setEmployerProfile((prev: any) => ({
      ...prev,
      ...updatedData,
      status: nextStatus,
      admin_note: isChangesRequested ? undefined : prev.admin_note,
      adminNote: isChangesRequested ? undefined : prev.adminNote
    }));

    try {
      if (user?.id) {
        const { webApiClient } = await import('@/lib/webApiClient');
        await webApiClient.post('/api/employer/profile/update', {
          userId: user.id,
          company_name: updatedData.company_name ?? employerProfile.company_name ?? employerProfile.name,
          phone: updatedData.phone ?? employerProfile.phone,
          email: updatedData.email ?? employerProfile.email,
          address: updatedData.address ?? employerProfile.address ?? employerProfile.billing_address,
            society_name: updatedData.society_name ?? employerProfile.society_name,
            tower: updatedData.tower ?? employerProfile.tower ?? employerProfile.tower_block,
            city: updatedData.city ?? employerProfile.city,
            state: updatedData.state ?? employerProfile.state,
            pincode: updatedData.pincode ?? employerProfile.pincode,
            gstin: updatedData.gstin ?? employerProfile.gstin,
            alt_phone: updatedData.alt_phone ?? employerProfile.alt_phone ?? employerProfile.alternate_phone,
            verification_pref: updatedData.verification_pref ?? employerProfile.verification_pref,
            residency_proof_url: updatedData.residency_proof_url ?? employerProfile.residency_proof_url,
            aadhaar_front_url: updatedData.aadhaar_front_url ?? employerProfile.aadhaar_front_url,
            aadhaar_back_url: updatedData.aadhaar_back_url ?? employerProfile.aadhaar_back_url,
            avatar_url: updatedData.avatar_url ?? employerProfile.avatar_url,
            status: isChangesRequested ? 'pending_review' : undefined
        });
      }

      showToast(
        isChangesRequested 
          ? 'Household account details updated and resubmitted to Admin for review!' 
          : 'Household account details saved successfully!', 
        'success'
      );
    } catch (err) {
      console.error("Error updating employer profile in DB:", err);
    }
  };

  const handleRequestAccountDeletion = async (reason: string) => {
    setDeletionRequested(true);
    showToast('Account deletion request logged. Sevikaa admin will call your phone to confirm offboarding.', 'warning');
  };

  const handleLogout = async () => {
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!isPlaceholder) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.location.href = '/';
      }
    }
  };

  const navItems = [
    { id: 'overview', label: t('navOverview') || 'Home', href: '/employer', icon: <Home size={20} /> },
    { id: 'post-job', label: t('navPostJob') || 'Post Job', href: '/employer/post-job', icon: <PlusCircle size={20} /> },
    { id: 'my-jobs', label: t('navMyJobs') || 'My Jobs', href: '/employer/jobs', icon: <Briefcase size={20} /> },
    { id: 'workers', label: t('navCandidates') || 'Applicants', href: '/employer/workers', icon: <Users size={20} /> },
    { id: 'account', label: t('navAccount') || 'Account', href: '/employer/account', icon: <User size={20} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-300">Loading Employer Mobile App...</span>
        </div>
      </div>
    );
  }

  const isOnboarding = pathname === '/employer/onboarding';

  return (
    <EmployerDashboardContext.Provider value={{
      user, loading, employerProfile, setEmployerProfile, isPremium,
      bookmarkedContacts, postedJobs, societiesList, deletionRequested,
      showToast, handleToggleBookmark, handlePostJob,
      handleUpdateJob, handleSaveEmployerProfile, handleRequestAccountDeletion, handleLogout
    }}>
      <div className="bg-slate-100 min-h-screen flex justify-center items-start font-sans antialiased">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        
        {/* Mobile Viewport Container - Clean Flat Interface */}
        <div className="w-full max-w-md bg-slate-50 min-h-screen border-x border-slate-200/80 shadow-xl flex flex-col relative">

          {/* Clean Mobile App Header */}
          <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
            <div className="px-4 py-3 flex items-center justify-between">
              {isOnboarding ? (
                <>
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Sevikaa Logo" className="h-7 w-auto object-contain" />
                    <span className="font-black text-xs text-slate-800">Sevikaa</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1A73E8] border border-blue-200">
                      {t('employerSetup') || 'Employer Setup'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      aria-label="Toggle Navigation Menu"
                    >
                      {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const isDashboardHome = pathname === '/employer' || pathname === '/employer/dashboard';
                      const logoHref = isDashboardHome ? '/?browse=true' : '/employer/dashboard';
                      const logoTitle = isDashboardHome ? 'Go to Sevikaa Public Homepage' : 'Return to Employer Dashboard Home';
                      return (
                        <Link href={logoHref} className="flex items-center gap-2 group cursor-pointer" title={logoTitle}>
                          {!isDashboardHome && (
                            <ArrowLeft size={18} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
                          )}
                          <img src="/logo.png" alt="Sevikaa Logo" className="h-7 w-auto object-contain transition-transform group-hover:scale-105" />
                          <span className="font-black text-xs text-slate-800">{t('headerEmployer')}</span>
                        </Link>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 py-1 px-2.5 rounded-xl text-[10px] font-black flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      <span>{t('subscribedBadge')}</span>
                    </div>

                    {/* Notifications Bell Button */}
                    <Link
                      href="/employer/notifications"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer relative flex items-center justify-center"
                      title="Notifications & Alerts"
                    >
                      <Bell size={18} />
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#EA4335] border border-white animate-pulse" />
                    </Link>

                    {/* Hamburger Mobile Menu Toggle Button */}
                    <button
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      aria-label="Toggle Navigation Menu"
                    >
                      {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Slide-Down Mobile Header Menu Overlay Drawer (Floats over the screen content) */}
            {showMobileMenu && (
              <>
                <div
                  className="fixed inset-0 z-[99]"
                  onClick={() => setShowMobileMenu(false)}
                  onTouchStart={() => setShowMobileMenu(false)}
                />
                <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-4 space-y-4 shadow-2xl animate-fade-in z-[100]">
                  {isOnboarding ? (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-xs font-black text-slate-900">Employer Account</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{user?.email || employerProfile.email || 'Setup Pending'}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-blue-50 text-[#1A73E8]">
                          Setup Pending
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold text-slate-500">App Language:</span>
                        <GlobalLanguageSelector />
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                        <button
                          onClick={() => { setShowMobileMenu(false); handleLogout(); }}
                          className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>Log Out Session</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{employerProfile.company_name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{employerProfile.society_name}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          deletionRequested 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-50 text-[#1A73E8]'
                        }`}>
                          {deletionRequested ? 'Pending' : 'Active'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold text-slate-500">App Language:</span>
                        <GlobalLanguageSelector />
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                        <Link
                          href="/?browse=true"
                          onClick={() => setShowMobileMenu(false)}
                          className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-[#1A73E8] border border-blue-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>🌐 Visit Public Homepage</span>
                        </Link>

                        <button
                          onClick={() => { setShowMobileMenu(false); handleLogout(); }}
                          className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>Log Out Session</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </header>

          {/* Account Deletion Request Banner Notice */}
          {deletionRequested && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-[11px] font-semibold text-amber-900 flex items-center gap-2">
              <ShieldAlert size={14} className="text-amber-700 shrink-0" />
              <span>
                <strong>Account Deletion Pending:</strong> Sevikaa Admin will call <strong>{employerProfile.phone}</strong> to confirm offboarding.
              </span>
            </div>
          )}

          {/* Admin Requested Profile Updates Banner Notice */}
          {(employerProfile?.status === 'changes_requested' || employerProfile?.admin_note) && (
            <div className="bg-amber-600 text-white px-4 py-3 text-xs font-bold flex items-center justify-between gap-3 shadow-md animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert size={18} className="shrink-0 text-amber-200" />
                <div className="min-w-0">
                  <span className="block font-black uppercase text-[10px] tracking-wider text-amber-200">⚠️ Admin Requested Profile Updates</span>
                  <p className="truncate text-xs text-white">
                    "{employerProfile.admin_note || 'Please review and update your profile details for verification.'}"
                  </p>
                </div>
              </div>
              <Link
                href="/employer/account"
                className="py-1.5 px-3 bg-white text-amber-900 hover:bg-amber-50 rounded-xl text-[11px] font-black shrink-0 shadow-sm transition-all"
              >
                Update Profile →
              </Link>
            </div>
          )}

          {/* Main Scrollable Screen Area */}
          <main className={`flex-1 p-4 space-y-5 pt-4 ${isOnboarding ? 'pb-6' : 'pb-24'}`}>
            {children}
          </main>

          {/* Sticky Mobile Bottom Navigation Bar (Hidden during onboarding) */}
          {!isOnboarding && (
            <nav className="sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 py-2.5 px-2 flex justify-around items-center z-50 shadow-lg shrink-0">
              {navItems.map((item) => {
                const isActive = (item.id === 'overview' && pathname === '/employer') || (item.id !== 'overview' && pathname === item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[9.5px] font-bold transition-all relative ${
                      isActive 
                        ? 'text-[#1A73E8] font-black bg-blue-50/80 scale-105' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </EmployerDashboardContext.Provider>
  );
}
