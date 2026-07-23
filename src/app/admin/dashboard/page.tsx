"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Users, Briefcase, FileText, CheckCircle, XCircle, Clock, Video, 
  MessageSquare, Star, ArrowRight, ShieldCheck, LogOut, Settings 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeQueue, setActiveQueue] = useState<'workers' | 'employers' | 'jobs' | 'reviews'>('workers');
  const [loading, setLoading] = useState(true);

  // Local state mocks to demonstrate moderation queues
  const [pendingWorkers, setPendingWorkers] = useState<any[]>([
    { id: 'w1', name: 'Ramesh Kumar', category: 'Cook', experience: '4 Years', language: 'Hindi, Hinglish', selfie: 'RK', doc: 'Aadhaar Card uploaded', video: 'Intro video uploaded' },
    { id: 'w2', name: 'Sunita Sharma', category: 'Nanny', experience: '6 Years', language: 'Kannada, Telugu', selfie: 'SS', doc: 'Aadhaar Card uploaded', video: 'No intro video' }
  ]);

  const [pendingEmployers, setPendingEmployers] = useState<any[]>([
    { id: 'e1', name: 'Ananth Patel', company: 'Self Employed', society: 'Brigade Gateway', billing: 'Rajajinagar' }
  ]);

  const [pendingJobs, setPendingJobs] = useState<any[]>([
    { id: 'j1', employer: 'Sharma Residence', category: 'Maid', salary: '₹9,000/mo', description: 'Cleaning 3BHK flat, floor mopping, utensil washing.' }
  ]);

  const [pendingReviews, setPendingReviews] = useState<any[]>([
    { id: 'r1', reviewer: 'Sharma Residence', target: 'Kamla Devi', rating: 5, comment: 'Punctual and very efficient worker.' }
  ]);

  useEffect(() => {
    const fetchAdminQueues = async () => {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }

        // Fetch pending workers
        const { data: workers } = await supabase
          .from('worker_profiles')
          .select('*, user:profiles!inner(*)')
          .eq('profiles.status', 'pending_review');

        if (workers) {
          setPendingWorkers(workers.map(w => ({
            id: w.user_id,
            name: w.full_name || 'Worker',
            category: w.skills?.join(', ') || 'None',
            experience: `${w.experience_years || 0} Years`,
            language: w.languages_spoken?.join(', ') || '',
            selfie: w.full_name?.split(' ').map((n: string) => n[0]).join('') || 'W',
            doc: w.is_aadhaar_verified ? 'Aadhaar verified' : 'Aadhaar pending',
            video: w.profile_picture_url ? 'Intro video uploaded' : 'No intro video'
          })));
        }

        // Fetch pending employers
        const { data: employers } = await supabase
          .from('employer_profiles')
          .select('*, user:profiles!inner(*)')
          .eq('profiles.status', 'pending_review');

        if (employers) {
          setPendingEmployers(employers.map(e => ({
            id: e.user_id,
            name: e.name || 'Employer',
            company: e.company_name || 'Individual',
            society: e.billing_address || 'Society',
            billing: e.billing_address || 'City'
          })));
        }

        // Fetch pending jobs
        const { data: jobs } = await supabase
          .from('jobs')
          .select('*, employer:employer_profiles(*)')
          .eq('status', 'pending_approval');

        if (jobs) {
          setPendingJobs(jobs.map(j => ({
            id: j.id,
            employer: j.employer?.name || 'Employer',
            category: j.category || 'General',
            salary: `₹${j.salary_range?.toLocaleString()}/mo`,
            description: j.description || ''
          })));
        }

        // Fetch pending reviews
        const { data: reviews } = await supabase
          .from('reviews')
          .select('*')
          .eq('status', 'pending_moderation');

        if (reviews) {
          setPendingReviews(reviews.map(r => ({
            id: r.id,
            reviewer: 'User',
            target: 'Worker',
            rating: r.rating || 5,
            comment: r.comment || ''
          })));
        }

      } catch (err) {
        console.error("Admin queues fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminQueues();
  }, [router]);

  // Moderation Handlers
  const handleModerateWorker = async (id: string, action: 'approve' | 'reject') => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholder) {
      try {
        await supabase
          .from('profiles')
          .update({ status: action === 'approve' ? 'live' : 'draft_revision' })
          .eq('id', id);
      } catch (err) {
        console.error("Moderate worker error:", err);
      }
    }

    alert(`Worker profile ${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`);
    setPendingWorkers(prev => prev.filter(w => w.id !== id));
  };

  const handleModerateEmployer = async (id: string, action: 'approve' | 'reject') => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholder) {
      try {
        await supabase
          .from('profiles')
          .update({ status: action === 'approve' ? 'live' : 'draft_revision' })
          .eq('id', id);
      } catch (err) {
        console.error("Moderate employer error:", err);
      }
    }

    alert(`Employer profile ${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`);
    setPendingEmployers(prev => prev.filter(e => e.id !== id));
  };

  const handleModerateJob = async (id: string, action: 'approve' | 'reject') => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholder) {
      try {
        await supabase
          .from('jobs')
          .update({ status: action === 'approve' ? 'live' : 'rejected' })
          .eq('id', id);
      } catch (err) {
        console.error("Moderate job error:", err);
      }
    }

    alert(`Job posting ${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`);
    setPendingJobs(prev => prev.filter(j => j.id !== id));
  };

  const handleModerateReview = async (id: string, action: 'approve' | 'reject') => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholder) {
      try {
        await supabase
          .from('reviews')
          .update({ status: action === 'approve' ? 'approved' : 'rejected' })
          .eq('id', id);
      } catch (err) {
        console.error("Moderate review error:", err);
      }
    }

    alert(`Review ${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`);
    setPendingReviews(prev => prev.filter(r => r.id !== id));
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
      <div className="flex items-center justify-center min-h-screen bg-[#202124] text-gray-400 font-bold text-sm">
        Loading Admin Queues...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto w-full border-x border-gray-200">
      {/* Header */}
      <header className="bg-[#202124] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1A73E8] flex items-center justify-center text-white font-black text-sm border border-black shadow-sm">
            S
          </div>
          <span className="font-extrabold text-lg tracking-tight">Admin Portal</span>
        </div>
        <span className="bg-[#FBBC05] text-[#202124] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
          Moderator
        </span>
      </header>

      {/* Queue Selection Nav Tab Bar */}
      <div className="bg-white border-b border-gray-200 grid grid-cols-4 text-center">
        {[
          { id: 'workers', label: 'Workers', count: pendingWorkers.length, icon: <Users size={16} /> },
          { id: 'employers', label: 'Employers', count: pendingEmployers.length, icon: <ShieldCheck size={16} /> },
          { id: 'jobs', label: 'Jobs', count: pendingJobs.length, icon: <Briefcase size={16} /> },
          { id: 'reviews', label: 'Reviews', count: pendingReviews.length, icon: <MessageSquare size={16} /> }
        ].map((tab) => {
          const isActive = activeQueue === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveQueue(tab.id as any)}
              className={`py-3 flex flex-col items-center justify-center border-b-2 text-[10px] font-bold transition-all relative ${
                isActive ? 'border-[#1A73E8] text-[#1A73E8]' : 'border-transparent text-gray-400'
              }`}
            >
              {tab.icon}
              <span className="mt-1 leading-tight">{tab.label}</span>
              {tab.count > 0 && (
                <span className="absolute top-1 right-2 bg-[#EA4335] text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Scroller Content */}
      <div className="flex-1 px-4 py-5 overflow-y-auto pb-24 space-y-4">
        
        {/* WORKERS moderations list */}
        {activeQueue === 'workers' && (
          <div className="space-y-3.5 animate-fade-in">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Pending Worker Verification ({pendingWorkers.length})</h3>
            {pendingWorkers.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400 font-bold">All worker profiles reviewed!</div>
            ) : (
              pendingWorkers.map(w => (
                <div key={w.id} className="bg-white rounded-3xl border border-gray-200 p-4 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                      {w.selfie}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-700">{w.name}</h4>
                      <p className="text-xs text-[#1A73E8] font-bold mt-0.5">{w.category} • {w.experience}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-gray-500 space-y-1.5 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5"><FileText size={12} className="text-gray-400" /> {w.doc}</div>
                    <div className="flex items-center gap-1.5"><Video size={12} className="text-gray-400" /> {w.video}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleModerateWorker(w.id, 'approve')}
                      className="flex-1 py-2.5 bg-[#34A853] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#34A853]/90 active:scale-95 transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={14} />
                      <span>Approve Live</span>
                    </button>
                    <button
                      onClick={() => handleModerateWorker(w.id, 'reject')}
                      className="py-2.5 px-3.5 border border-[#EA4335]/20 hover:bg-[#EA4335]/5 text-[#EA4335] text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* EMPLOYERS moderations list */}
        {activeQueue === 'employers' && (
          <div className="space-y-3.5 animate-fade-in">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Pending Employer Profiles ({pendingEmployers.length})</h3>
            {pendingEmployers.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400 font-bold">All employer profiles reviewed!</div>
            ) : (
              pendingEmployers.map(e => (
                <div key={e.id} className="bg-white rounded-3xl border border-gray-200 p-4 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-700">{e.name}</h4>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{e.company} • {e.society}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleModerateEmployer(e.id, 'approve')}
                      className="flex-1 py-2.5 bg-[#34A853] text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={14} />
                      <span>Approve Profile</span>
                    </button>
                    <button
                      onClick={() => handleModerateEmployer(e.id, 'reject')}
                      className="py-2.5 px-3.5 border border-[#EA4335]/20 hover:bg-[#EA4335]/5 text-[#EA4335] text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* JOBS moderations list */}
        {activeQueue === 'jobs' && (
          <div className="space-y-3.5 animate-fade-in">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Pending Job Postings ({pendingJobs.length})</h3>
            {pendingJobs.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400 font-bold">All job postings reviewed!</div>
            ) : (
              pendingJobs.map(j => (
                <div key={j.id} className="bg-white rounded-3xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">{j.employer}</span>
                    <h4 className="text-sm font-bold text-[#1A73E8] mt-0.5">{j.category} offer • {j.salary}</h4>
                    <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">{j.description}</p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleModerateJob(j.id, 'approve')}
                      className="flex-1 py-2.5 bg-[#34A853] text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={14} />
                      <span>Approve & Publish</span>
                    </button>
                    <button
                      onClick={() => handleModerateJob(j.id, 'reject')}
                      className="py-2.5 px-3.5 border border-[#EA4335]/20 hover:bg-[#EA4335]/5 text-[#EA4335] text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* REVIEWS moderations list */}
        {activeQueue === 'reviews' && (
          <div className="space-y-3.5 animate-fade-in">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Pending Reviews & Feedback ({pendingReviews.length})</h3>
            {pendingReviews.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400 font-bold">All reviews moderated!</div>
            ) : (
              pendingReviews.map(r => (
                <div key={r.id} className="bg-white rounded-3xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-400">By {r.reviewer}</span>
                      <span className="text-[#FBBC05] flex items-center gap-0.5"><Star size={12} fill="#FBBC05" /> {r.rating}</span>
                    </div>
                    <span className="block text-[10px] font-medium text-gray-400 mt-0.5">Target: {r.target}</span>
                    <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">"{r.comment}"</p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleModerateReview(r.id, 'approve')}
                      className="flex-1 py-2.5 bg-[#34A853] text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={14} />
                      <span>Approve Review</span>
                    </button>
                    <button
                      onClick={() => handleModerateReview(r.id, 'reject')}
                      className="py-2.5 px-3.5 border border-[#EA4335]/20 hover:bg-[#EA4335]/5 text-[#EA4335] text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Consistent Regulatory Footer */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-gray-400 font-bold pt-6 mt-8 border-t border-gray-100/80">
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Use</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/contact" className="hover:text-gray-600 transition-colors">Contact Support</Link>
        </div>
        <p className="text-[9px] text-gray-400 text-center mt-3 font-semibold mb-6">
          Powered by YugaYatra Retail (OPC) Private Limited • © {new Date().getFullYear()} All Rights Reserved
        </p>
      </div>

      {/* Admin Action footer */}
      <footer className="bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center sticky bottom-0 z-10 shadow-lg max-w-md mx-auto w-full">
        <span className="text-[10px] font-bold text-gray-400">System Mode: Live Moderation</span>
        <button
          onClick={handleLogout}
          className="text-xs font-bold text-[#EA4335] hover:underline flex items-center gap-1"
        >
          <LogOut size={14} />
          <span>Exit Admin</span>
        </button>
      </footer>
    </div>
  );
}
