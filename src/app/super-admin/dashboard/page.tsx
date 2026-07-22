"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
  ShieldAlert, Settings, TrendingUp, MapPin, DollarSign, Database,
  PlusCircle, LogOut, CheckCircle2, UserPlus, FileText, ChevronRight 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'analytics' | 'admins' | 'societies' | 'pricing' | 'logs'>('analytics');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Local state mocks for Super Admin controls
  const [admins, setAdmins] = useState([
    { id: 'a1', email: 'moderator1@sevikaa.com', created: '2026-07-20' },
    { id: 'a2', email: 'moderator2@sevikaa.com', created: '2026-07-21' }
  ]);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const [pricing, setPricing] = useState({
    premiumUnlocks: '999',
    employerSub: '2499',
    workerRegistration: '0'
  });

  const auditLogs = [
    { id: 'l1', actor: 'Super Admin', action: 'Update pricing settings', time: '10 mins ago' },
    { id: 'l2', actor: 'Moderator 1', action: 'Approve worker Ramesh Kumar', time: '1 hour ago' },
    { id: 'l3', actor: 'System Trigger', action: 'Auth User created: Sunita Sharma', time: '2 hours ago' }
  ];

  useEffect(() => {
    const checkSuperAdmin = async () => {
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
        setUser(session.user);
      } catch (err) {
        console.error("Super Admin check error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSuperAdmin();
  }, [router]);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.includes('@')) {
      alert("Please enter a valid email address");
      return;
    }
    const newAdmin = {
      id: `a${Date.now()}`,
      email: newAdminEmail,
      created: new Date().toISOString().split('T')[0]
    };
    setAdmins([...admins, newAdmin]);
    setNewAdminEmail('');
    alert("New admin moderator account provisioned!");
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    alert("System pricing configurations successfully modified & published globally.");
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
        Verifying Owner Mode...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto w-full border-x border-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#EA4335] flex items-center justify-center text-white font-black text-sm">
            S
          </div>
          <span className="font-extrabold text-lg tracking-tight">Super Admin</span>
        </div>
        <span className="bg-[#EA4335]/20 text-[#EA4335] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
          Owner Mode
        </span>
      </header>

      {/* Main Options Scrollbar */}
      <div className="bg-white border-b border-gray-200 flex overflow-x-auto whitespace-nowrap scrollbar-hide py-1 text-center text-xs font-bold text-gray-500">
        {[
          { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={14} /> },
          { id: 'admins', label: 'Admin Mgmt', icon: <UserPlus size={14} /> },
          { id: 'societies', label: 'Societies', icon: <MapPin size={14} /> },
          { id: 'pricing', label: 'Pricing', icon: <DollarSign size={14} /> },
          { id: 'logs', label: 'Audit Logs', icon: <Database size={14} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-4 flex items-center gap-1 border-b-2 transition-all ${
                isActive ? 'border-[#EA4335] text-[#EA4335]' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main scroller panel */}
      <div className="flex-1 px-4 py-5 overflow-y-auto pb-24 space-y-4">
        
        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Global Revenue Analytics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Gross Revenue</span>
                <span className="block text-2xl font-black text-[#34A853] mt-1">₹49,950</span>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Active Subs</span>
                <span className="block text-2xl font-black text-[#1A73E8] mt-1">50</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-gray-700">Platform Growth (This Month)</h4>
              <div className="space-y-2 text-[11px] font-bold text-gray-500">
                <div className="flex justify-between"><span>New Worker Signups:</span><span className="text-[#34A853]">+140</span></div>
                <div className="flex justify-between"><span>New Employer Signups:</span><span className="text-[#1A73E8]">+35</span></div>
                <div className="flex justify-between"><span>Conversion Rate:</span><span className="text-gray-700">12.5%</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN MANAGEMENT TAB */}
        {activeTab === 'admins' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Manage Admin Moderators</h3>
            <form onSubmit={handleAddAdmin} className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex gap-2">
              <input
                type="email"
                placeholder="moderator@sevikaa.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                required
                className="flex-1 py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
              />
              <button
                type="submit"
                className="py-2.5 px-4 bg-[#EA4335] text-white font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center gap-1"
              >
                <PlusCircle size={14} /> Add
              </button>
            </form>
            <div className="space-y-2">
              {admins.map(adm => (
                <div key={adm.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-700">{adm.email}</span>
                  <span className="text-gray-400">Created: {adm.created}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOCIETIES & CITIES TAB */}
        {activeTab === 'societies' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Societies List</h3>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
              {[
                'Prestige Shantiniketan, Whitefield',
                'Brigade Gateway, Rajajinagar',
                'Sobha Clovelly, Padmanabhanagar',
                'DLF New Heights, Bannerghatta Road',
                'L&T South City, JP Nagar'
              ].map((soc, i) => (
                <div key={i} className="p-4 flex items-center justify-between text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <span>{soc}</span>
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRICING CONFIG TAB */}
        {activeTab === 'pricing' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Global System Pricing Configurations</h3>
            <form onSubmit={handleSavePricing} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Premium Contact Unlock Price (₹)</label>
                <input
                  type="number"
                  value={pricing.premiumUnlocks}
                  onChange={(e) => setPricing({...pricing, premiumUnlocks: e.target.value})}
                  className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Employer Subscription / year (₹)</label>
                <input
                  type="number"
                  value={pricing.employerSub}
                  onChange={(e) => setPricing({...pricing, employerSub: e.target.value})}
                  className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-[#EA4335] text-white font-bold rounded-2xl shadow-sm text-xs active:scale-95 transition-all"
              >
                Update Configuration Settings
              </button>
            </form>
          </div>
        )}

        {/* SYSTEM AUDIT LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="space-y-3.5 animate-fade-in">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Global Security Audit Log</h3>
            <div className="space-y-2">
              {auditLogs.map(log => (
                <div key={log.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between gap-3 text-xs font-bold">
                  <div>
                    <span className="block text-gray-400">{log.actor}</span>
                    <span className="block text-gray-700 mt-1 font-semibold">{log.action}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium shrink-0 mt-0.5">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Super Admin footer */}
      <footer className="bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center sticky bottom-0 z-10 shadow-lg max-w-md mx-auto w-full">
        <span className="text-[10px] font-bold text-gray-400">System Mode: Owner Master</span>
        <button
          onClick={handleLogout}
          className="text-xs font-bold text-[#EA4335] hover:underline flex items-center gap-1"
        >
          <LogOut size={14} />
          <span>Exit Super Admin</span>
        </button>
      </footer>
    </div>
  );
}
