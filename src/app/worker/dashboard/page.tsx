"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { supabase } from '../../../lib/supabaseClient';
import { 
  User, Calendar, Briefcase, Bookmark, PhoneCall, 
  FileText, CheckCircle2, Bell, Shield, Wallet, Settings, LogOut, Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = [
  { id: 'early_morning', label: 'Early' },
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'night', label: 'Night' }
];

export default function WorkerDashboard() {
  const { t, setLanguage } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'availability' | 'applications' | 'wallet' | 'settings'>('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Availability state
  const [availability, setAvailability] = useState<Record<string, string[]>>({
    Mon: ['morning', 'afternoon'],
    Wed: ['morning', 'afternoon'],
    Fri: ['morning', 'afternoon', 'evening']
  });

  // Profile details
  const [workerProfile, setWorkerProfile] = useState<any>({
    name: "Kamla Devi",
    category: "Maid / Cook",
    expectedSalary: "12,000",
    experience: "5 Years",
    society: "Prestige Shantiniketan, Whitefield",
    phone: "+91 98765 43210",
    languages: ["Hindi", "Hinglish", "Kannada"]
  });

  // Badges list
  const [badges, setBadges] = useState<any[]>([
    { name: 'Mobile', status: 'approved' },
    { name: 'Aadhaar', status: 'approved' },
    { name: 'Police', status: 'pending' },
    { name: 'Interview', status: 'pending' },
    { name: 'Video', status: 'approved' }
  ]);

  // Applications list
  const [applications, setApplications] = useState<any[]>([
    { employer: "Sharma Family", category: "Cook", salary: "₹10,000/mo", status: "Interviewing", date: "Applied 2 days ago" },
    { employer: "Prestige Apt 402", category: "Maid", salary: "₹8,500/mo", status: "Applied", date: "Applied 5 days ago" }
  ]);

  useEffect(() => {
    const fetchWorkerData = async () => {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setUser({ id: 'mock-user-uuid-12345' });
        setLoading(false);
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

        // Get profiles row
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

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
            expectedSalary: wp.expected_salary?.toLocaleString() || '0',
            experience: `${wp.experience_years || 0} Years`,
            society: wp.preferred_society?.name || 'No society chosen',
            phone: sessionUser.phone || sessionUser.email || '',
            languages: wp.languages_spoken || []
          });

          setBadges([
            { name: 'Mobile', status: sessionUser.phone ? 'approved' : 'pending' },
            { name: 'Aadhaar', status: wp.is_aadhaar_verified ? 'approved' : 'pending' },
            { name: 'Police', status: wp.is_police_verified ? 'approved' : 'pending' },
            { name: 'Interview', status: wp.is_interview_verified ? 'approved' : 'pending' },
            { name: 'Video', status: wp.profile_picture_url ? 'approved' : 'pending' }
          ]);

          if (wp.availability_slots) {
            setAvailability(wp.availability_slots as Record<string, string[]>);
          }
        } else {
          setWorkerProfile({
            name: profile?.full_name || 'Guest Worker',
            category: 'None',
            expectedSalary: '0',
            experience: '0 Years',
            society: 'Not configured',
            phone: sessionUser.phone || sessionUser.email || '',
            languages: []
          });
        }

        // Fetch applications
        const { data: apps } = await supabase
          .from('applications')
          .select('*, job:jobs(*, employer:employer_profiles(*))')
          .eq('worker_id', sessionUser.id);

        if (apps && apps.length > 0) {
          setApplications(apps.map(a => ({
            employer: a.job?.employer?.name || 'Employer',
            category: a.job?.category || 'General',
            salary: `₹${a.job?.salary_range?.toLocaleString()}/mo`,
            status: a.status || 'Applied',
            date: `Applied ${new Date(a.created_at).toLocaleDateString()}`
          })));
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

  const handleLogout = async () => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!isPlaceholder) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('sevikaa_language');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-bold text-sm">
        Loading Worker Dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto w-full border-x border-gray-200">
      {/* Header Panel */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1A73E8] flex items-center justify-center text-white font-black text-sm">
            S
          </div>
          <span className="font-extrabold text-lg tracking-tight text-[#202124]">Sevikaa</span>
        </div>
        <button 
          onClick={() => setActiveTab('settings')}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 px-4 py-6 overflow-y-auto pb-24">
        {/* HOMEPAGE VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
            {/* Worker Welcome Banner Card */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border-2 border-[#1A73E8]">
                <span className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">KD</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#202124]">{workerProfile.name}</h2>
                <p className="text-xs font-bold text-[#1A73E8] mt-0.5">{workerProfile.category}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">{workerProfile.society}</p>
              </div>
            </div>

            {/* Compact Badges list */}
            <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Verification Checklist</h3>
              <div className="flex justify-between items-center gap-2">
                {badges.map(b => (
                  <div key={b.name} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                      b.status === 'approved' ? 'bg-[#34A853] text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Check size={14} strokeWidth={4} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 mt-1">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Big Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setActiveTab('profile')}
                className="p-5 bg-white rounded-3xl border border-gray-200 hover:border-[#1A73E8] active:scale-95 transition-all text-left shadow-sm flex flex-col justify-between min-h-[120px]"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center">
                  <User size={20} />
                </div>
                <span className="block text-sm font-bold text-gray-700 mt-4">My Profile</span>
              </button>

              <button 
                onClick={() => setActiveTab('availability')}
                className="p-5 bg-white rounded-3xl border border-gray-200 hover:border-[#1A73E8] active:scale-95 transition-all text-left shadow-sm flex flex-col justify-between min-h-[120px]"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#34A853]/10 text-[#34A853] flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <span className="block text-sm font-bold text-gray-700 mt-4">Availability</span>
              </button>

              <button 
                onClick={() => setActiveTab('applications')}
                className="p-5 bg-white rounded-3xl border border-gray-200 hover:border-[#1A73E8] active:scale-95 transition-all text-left shadow-sm flex flex-col justify-between min-h-[120px]"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#FBBC05]/10 text-[#FBBC05] flex items-center justify-center">
                  <Briefcase size={20} />
                </div>
                <span className="block text-sm font-bold text-gray-700 mt-4">Applications</span>
              </button>

              <button 
                onClick={() => setActiveTab('wallet')}
                className="p-5 bg-white rounded-3xl border border-gray-200 hover:border-[#1A73E8] active:scale-95 transition-all text-left shadow-sm flex flex-col justify-between min-h-[120px]"
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <span className="block text-sm font-bold text-gray-700 mt-4">My Wallet</span>
              </button>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-[#202124] mb-3">My Profile Details</h2>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">Expected Salary</span>
                  <span className="block text-base font-bold text-[#34A853] mt-0.5">₹{workerProfile.expectedSalary}/mo</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">Experience</span>
                  <span className="block text-base font-bold text-gray-700 mt-0.5">{workerProfile.experience}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">Spoken Languages</span>
                  <div className="flex gap-1.5 mt-1.5">
                    {workerProfile.languages.map((l: string) => (
                      <span key={l} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">Mobile Number</span>
                  <span className="block text-sm font-bold text-gray-700 mt-0.5">{workerProfile.phone}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">Preferred Society</span>
                  <span className="block text-sm font-bold text-gray-700 mt-0.5">{workerProfile.society}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AVAILABILITY TAB */}
        {activeTab === 'availability' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-[#202124]">Availability Grid</h2>
            <p className="text-xs text-gray-500">Employers will search you based on the checked active slots below:</p>
            
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4">
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 text-[10px] w-full">
                <div className="grid grid-cols-8 bg-gray-100 border-b border-gray-200 text-center py-2 font-bold text-gray-500">
                  <div>Slot</div>
                  {DAYS.map(d => <div key={d}>{d}</div>)}
                </div>
                {SLOTS.map((slot) => (
                  <div key={slot.id} className="grid grid-cols-8 border-b border-gray-200 items-center last:border-0 min-h-[42px] text-center">
                    <div className="font-bold text-gray-400 py-1 border-r border-gray-200 truncate px-0.5 leading-tight">
                      {slot.label}
                    </div>
                    {DAYS.map((day) => {
                      const isSelected = availability[day]?.includes(slot.id);
                      return (
                        <div
                          key={day}
                          onClick={() => toggleCell(day, slot.id)}
                          className={`h-full border-r border-gray-200 last:border-r-0 flex items-center justify-center cursor-pointer transition-all active:scale-90 select-none ${
                            isSelected ? 'bg-[#34A853] text-white' : 'hover:bg-gray-100'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={4} />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* APPLICATIONS TAB */}
        {activeTab === 'applications' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-[#202124]">Job Applications</h2>
            <div className="space-y-3">
              {[
                { employer: "Sharma Family", category: "Cook", salary: "₹10,000/mo", status: "Interviewing", date: "Applied 2 days ago" },
                { employer: "Prestige Apt 402", category: "Maid", salary: "₹8,500/mo", status: "Applied", date: "Applied 5 days ago" }
              ].map((app, i) => (
                <div key={i} className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-700">{app.employer}</h3>
                    <p className="text-xs text-[#1A73E8] font-bold mt-0.5">{app.category} • {app.salary}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">{app.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    app.status === 'Interviewing' ? 'bg-[#FBBC05]/10 text-[#F9A825]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-[#202124]">My Wallet</h2>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 text-center space-y-4">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Available Balance</span>
              <span className="block text-4xl font-black text-[#34A853]">₹0.00</span>
              <p className="text-xs text-gray-400">Workers never pay any subscription fees or referral costs. Your transaction wallet ledger is clear.</p>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-[#202124]">Settings</h2>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 space-y-4">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Change App Language</span>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {[['en', 'English'], ['hi', 'Hindi'], ['hn', 'Hinglish']].map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => setLanguage(code as any)}
                      className="py-2.5 px-3 border border-gray-200 rounded-xl font-bold text-xs hover:border-[#1A73E8] active:scale-95 transition-all text-gray-700"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-4 mt-4 border border-[#EA4335]/20 hover:bg-[#EA4335]/5 text-[#EA4335] font-bold rounded-2xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut size={16} />
                <span>Log Out Session</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Footer Tab Bar Navigation (Touch Friendly, large icons) */}
      <nav className="bg-white border-t border-gray-200 flex justify-between items-center px-4 py-2 sticky bottom-0 z-10 shadow-lg max-w-md mx-auto w-full">
        {[
          { id: 'home', label: 'Home', icon: <Briefcase size={20} /> },
          { id: 'profile', label: 'Profile', icon: <User size={20} /> },
          { id: 'availability', label: 'Slots', icon: <Calendar size={20} /> },
          { id: 'applications', label: 'Jobs', icon: <FileText size={20} /> },
          { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-2 select-none active:scale-95 transition-all min-h-[48px] ${
                isActive ? 'text-[#1A73E8]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.icon}
              <span className="text-[9px] font-bold mt-1 leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
