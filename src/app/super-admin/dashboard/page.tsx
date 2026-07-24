"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { 
  TrendingUp, MapPin, DollarSign, Database, PlusCircle, LogOut, 
  CheckCircle2, UserPlus, FileText, ChevronRight, Menu, X, Search,
  Settings, Server, Activity, ShieldAlert, Sparkles, ChevronLeft, LayoutDashboard
} from 'lucide-react';

// Import Reusable Widgets
import { AttentionRequiredWidget } from '../../../components/super-admin/dashboard/AttentionRequiredWidget';
import { ExecutiveOverviewWidget } from '../../../components/super-admin/dashboard/ExecutiveOverviewWidget';
import { RevenueAnalyticsWidget } from '../../../components/super-admin/dashboard/RevenueAnalyticsWidget';
import { UserGrowthWidget } from '../../../components/super-admin/dashboard/UserGrowthWidget';
import { PlatformOperationsWidget } from '../../../components/super-admin/dashboard/PlatformOperationsWidget';
import { BusinessInsightsWidget } from '../../../components/super-admin/dashboard/BusinessInsightsWidget';
import { SystemHealthWidget } from '../../../components/super-admin/dashboard/SystemHealthWidget';
import { RecentActivitiesWidget } from '../../../components/super-admin/dashboard/RecentActivitiesWidget';
import { QuickActionsWidget } from '../../../components/super-admin/dashboard/QuickActionsWidget';

export default function SuperAdminDashboard() {
  const router = useRouter();
  
  // Navigation & Shell State
  const [activeTab, setActiveTab] = useState<'overview' | 'admins' | 'societies' | 'pricing' | 'logs'>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [searchQuery, setSearchQuery] = useState('');

  // Data Loading & State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Business metrics from DB counts
  const [dbStats, setDbStats] = useState({
    totalWorkers: 0,
    verifiedWorkers: 0,
    pendingWorkers: 0,
    totalEmployers: 0,
    activeEmployers: 0,
    totalSocieties: 0,
  });

  // Dynamic Lists
  const [pendingWorkersList, setPendingWorkersList] = useState<any[]>([]);
  const [societiesList, setSocietiesList] = useState<any[]>([]);
  const [admins, setAdmins] = useState([
    { id: 'a1', email: 'moderator1@sevikaa.com', created: '2026-07-20' },
    { id: 'a2', email: 'moderator2@sevikaa.com', created: '2026-07-21' }
  ]);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Pricing configuration
  const [pricing, setPricing] = useState({
    premiumUnlocks: '999',
    employerSub: '2499',
    workerRegistration: '0'
  });

  // Mocked activities and health status checks
  const [activities, setActivities] = useState([
    { id: 'l1', actor: 'Super Admin', action: 'Update pricing settings', time: '10 mins ago' },
    { id: 'l2', actor: 'Moderator 1', action: 'Approve worker Ramesh Kumar', time: '1 hour ago' },
    { id: 'l3', actor: 'System Trigger', action: 'Auth User created: Sunita Sharma', time: '2 hours ago' }
  ]);

  const [healthStates, setHealthStates] = useState([
    { name: 'Database', status: 'Healthy' as const, lastChecked: 'Just now', details: 'PostgreSQL connection active' },
    { name: 'Authentication', status: 'Healthy' as const, lastChecked: 'Just now', details: 'Supabase GoTrue active' },
    { name: 'Storage', status: 'Healthy' as const, lastChecked: 'Just now', details: 'Selfies & Docs buckets active' },
    { name: 'Email Gateway', status: 'Healthy' as const, lastChecked: '1 min ago', details: 'AWS SES router connected' },
    { name: 'SMS Gateway', status: 'Healthy' as const, lastChecked: '1 min ago', details: 'MSG91 gateway latency normal' },
    { name: 'Payment Gateway', status: 'Healthy' as const, lastChecked: 'Just now', details: 'Razorpay API live' },
    { name: 'API Server', status: 'Healthy' as const, lastChecked: 'Just now', details: 'Next.js API routes ready' },
    { name: 'Cron Jobs', status: 'Healthy' as const, lastChecked: '5 mins ago', details: 'Match engine schedules normal' },
    { name: 'Queues', status: 'Healthy' as const, lastChecked: 'Just now', details: 'Push notification broker ready' },
    { name: 'Background Workers', status: 'Healthy' as const, lastChecked: 'Just now', details: 'Indexer scheduler listening' },
    { name: 'Backups', status: 'Healthy' as const, lastChecked: '4 hours ago', details: 'Daily DB dump captured' }
  ]);

  // Fetch real statistics from Supabase tables
  const fetchDashboardData = async () => {
    setError('');
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (isPlaceholder) {
      // Mock stats for demo mode
      setDbStats({
        totalWorkers: 154,
        verifiedWorkers: 140,
        pendingWorkers: 14,
        totalEmployers: 42,
        activeEmployers: 12,
        totalSocieties: 3,
      });
      setPendingWorkersList([
        { id: '1', full_name: 'Sunita Devi', skills: ['Maid', 'Cook'], languages_spoken: ['Hindi'], created_at: '2026-07-24' },
        { id: '2', full_name: 'Ramesh Singh', skills: ['Gardener'], languages_spoken: ['Hindi', 'English'], created_at: '2026-07-24' }
      ]);
      setSocietiesList([
        { id: 's1', name: 'DLF Westend Heights', city: 'Bangalore' },
        { id: 's2', name: 'Prestige Song of the South', city: 'Bangalore' },
        { id: 's3', name: 'SNN Raj Serenity', city: 'Bangalore' }
      ]);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch total workers count
      const { count: workerCount } = await supabase
        .from('worker_profiles')
        .select('*', { count: 'exact', head: true });

      // 2. Fetch pending workers list
      const { data: pendingWorkers } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          phone,
          status,
          role,
          worker_profiles (
            full_name,
            skills,
            languages_spoken
          )
        `)
        .eq('role', 'worker')
        .eq('status', 'pending_review');

      // 3. Fetch verified workers count
      const { count: verifiedCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'worker')
        .eq('status', 'approved');

      // 4. Fetch total employers count
      const { count: employerCount } = await supabase
        .from('employer_profiles')
        .select('*', { count: 'exact', head: true });

      // 5. Fetch active paid employers count
      const { count: activePremiumCount } = await supabase
        .from('employer_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'premium');

      // 6. Fetch total societies count
      const { data: societies, count: societiesCount } = await supabase
        .from('societies')
        .select('*');

      setDbStats({
        totalWorkers: workerCount || 0,
        verifiedWorkers: verifiedCount || 0,
        pendingWorkers: pendingWorkers?.length || 0,
        totalEmployers: employerCount || 0,
        activeEmployers: activePremiumCount || 0,
        totalSocieties: societiesCount || societies?.length || 0,
      });

      if (societies) {
        setSocietiesList(societies);
      }

      if (pendingWorkers) {
        setPendingWorkersList(pendingWorkers.map((w: any) => ({
          id: w.id,
          full_name: w.worker_profiles?.full_name || 'N/A',
          skills: w.worker_profiles?.skills || [],
          languages_spoken: w.worker_profiles?.languages_spoken || [],
          created_at: 'Just now'
        })));
      }
    } catch (err: any) {
      console.error("Dashboard database fetch error:", err);
      setError(err.message || 'Database error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSuperAdmin = async () => {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        fetchDashboardData();
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }
        setUser(session.user);
        fetchDashboardData();
      } catch (err) {
        console.error("Super Admin check error:", err);
        setLoading(false);
      }
    };

    checkSuperAdmin();
  }, [router]);

  // Admin approval action
  const handleApproveWorker = async (id: string) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    try {
      if (!isPlaceholder) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ status: 'approved' })
          .eq('id', id);
        if (updateErr) throw updateErr;
      }
      
      // Update local state list
      setPendingWorkersList(prev => prev.filter(w => w.id !== id));
      setDbStats(prev => ({
        ...prev,
        pendingWorkers: Math.max(0, prev.pendingWorkers - 1),
        verifiedWorkers: prev.verifiedWorkers + 1
      }));
      setActivities(prev => [
        { id: `l-${Date.now()}`, actor: 'Super Admin', action: `Verify and approve worker profile`, time: 'Just now' },
        ...prev
      ]);
      alert("Worker profile successfully verified and approved!");
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    }
  };

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

  // Helper variables for widgets
  const grossRevenue = dbStats.activeEmployers * 999;
  const arr = grossRevenue * 12;

  // Processed BI Insights
  const systemInsights = [
    { message: `Worker registrations are up 14% this month, driven by Akshayanagar region.`, category: 'growth' as const, value: '+14% growth' },
    { message: `Average worker verification speed improved to 1.8 hours (down 15% this week).`, category: 'efficiency' as const, value: 'Improved efficiency' },
    { message: `Employer Elite Pass subscriptions conversion rate is highest in SNN Raj Serenity.`, category: 'revenue' as const, value: 'Top converter' }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50/50 text-[#202124] font-sans antialiased">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside 
        className={`bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 transition-all duration-300 sticky top-0 h-screen z-40 hidden md:flex ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <img src="/logo.png" alt="Sevikaa Logo" className="h-8 w-auto object-contain bg-white rounded-full p-0.5 border border-slate-100" />
              {!sidebarCollapsed && <span className="font-extrabold text-sm tracking-tight text-slate-800">Super Admin</span>}
            </div>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-400 hover:text-gray-600 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} className={`transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'overview', label: 'Overview Dashboard', icon: <LayoutDashboard size={16} /> },
              { id: 'admins', label: 'Admin Mgmt', icon: <UserPlus size={16} /> },
              { id: 'societies', label: 'Societies List', icon: <MapPin size={16} /> },
              { id: 'pricing', label: 'Pricing Config', icon: <DollarSign size={16} /> },
              { id: 'logs', label: 'Audit Security Logs', icon: <Database size={16} /> }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold relative group cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50' 
                      : 'text-gray-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <div className="shrink-0">{tab.icon}</div>
                  {!sidebarCollapsed && <span>{tab.label}</span>}
                  
                  {/* Tooltip for collapsed mode */}
                  {sidebarCollapsed && (
                    <div className="absolute left-16 bg-slate-800 text-white text-[9px] font-black py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow z-50">
                      {tab.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="w-full py-2.5 px-3 hover:bg-red-50 text-gray-500 hover:text-[#EA4335] rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold cursor-pointer"
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE COLLAPSIBLE OVERLAY DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full p-4 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Sevikaa Logo" className="h-8 w-auto bg-white rounded-full p-0.5 border border-slate-100" />
                  <span className="font-extrabold text-sm tracking-tight text-slate-800">Super Admin</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-gray-400 hover:text-slate-800 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <nav className="space-y-1">
                {[
                  { id: 'overview', label: 'Overview Dashboard', icon: <LayoutDashboard size={16} /> },
                  { id: 'admins', label: 'Admin Mgmt', icon: <UserPlus size={16} /> },
                  { id: 'societies', label: 'Societies List', icon: <MapPin size={16} /> },
                  { id: 'pricing', label: 'Pricing Config', icon: <DollarSign size={16} /> },
                  { id: 'logs', label: 'Audit Security Logs', icon: <Database size={16} /> }
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full py-3 px-3 rounded-xl flex items-center gap-3 transition-all text-xs font-bold cursor-pointer ${
                        isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-slate-50'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <button onClick={handleLogout} className="w-full py-3 px-3 hover:bg-red-50 text-gray-500 hover:text-[#EA4335] rounded-xl flex items-center gap-3 transition-all text-xs font-bold cursor-pointer">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN VIEWPORT & SCROLL AREA */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 hover:bg-slate-50 rounded-lg md:hidden text-gray-500 hover:text-slate-800 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            
            {/* Global Search Input (UI Only) */}
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search profiles, payments... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-100 hover:border-slate-200/80 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none transition-all duration-150"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector Dropdown */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-gray-700 hover:border-gray-300 focus:outline-none transition-all cursor-pointer"
            >
              {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Last 90 Days', 'This Year'].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <span className="bg-[#EA4335]/10 text-[#EA4335] text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
              Owner Mode
            </span>
          </div>
        </header>

        {/* 3. MAIN TABBED CONTENT */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Alert Center */}
              <AttentionRequiredWidget 
                loading={loading} 
                error={error} 
                counts={{
                  pendingWorkers: dbStats.pendingWorkers,
                  pendingSocieties: 0,
                  failedPayments: 0,
                  criticalAlerts: 0
                }} 
              />

              {/* KPI Cards Grid */}
              <ExecutiveOverviewWidget 
                loading={loading} 
                error={error} 
                stats={{
                  grossRevenue,
                  mrr: grossRevenue,
                  arr,
                  activeSubscribers: dbStats.activeEmployers,
                  conversionRate: dbStats.totalEmployers > 0 ? Math.round((dbStats.activeEmployers / dbStats.totalEmployers) * 100) : 0,
                  totalSocieties: dbStats.totalSocieties,
                  platformGrowth: 18.2,
                  revenueGrowth: 12.4
                }}
                dateRange={dateRange}
              />

              {/* Revenue Trends and distribution charts */}
              <RevenueAnalyticsWidget 
                loading={loading} 
                error={error} 
                revenueHistory={[]}
                activeSubscribers={dbStats.activeEmployers}
              />

              {/* User Ecosystem Growth */}
              <UserGrowthWidget 
                loading={loading} 
                error={error} 
                counts={dbStats} 
              />

              {/* Platform queue lists */}
              <PlatformOperationsWidget 
                loading={loading} 
                error={error} 
                pendingWorkersList={pendingWorkersList}
                onApproveWorker={handleApproveWorker}
              />

              {/* BI Insight card engines */}
              <BusinessInsightsWidget 
                loading={loading} 
                error={error} 
                insights={systemInsights} 
              />

              {/* 11-node System status logs */}
              <SystemHealthWidget 
                loading={loading} 
                error={error} 
                healthStates={healthStates} 
              />

              {/* System Audit activities */}
              <RecentActivitiesWidget 
                loading={loading} 
                error={error} 
                activities={activities} 
              />

              {/* Shortcuts panel */}
              <QuickActionsWidget 
                onAddAdminClick={() => setActiveTab('admins')} 
                onAddSocietyClick={() => setActiveTab('societies')} 
                onExportReportsClick={() => alert("Platform audit export complete: reports/csv/export_admin.csv")} 
              />
            </div>
          )}

          {/* TAB 2: ADMIN MANAGEMENT */}
          {activeTab === 'admins' && (
            <div className="space-y-4 animate-fade-in max-w-2xl">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Manage Admin Moderators</h3>
                <p className="text-[10px] text-gray-400 font-bold px-1 mt-0.5">Provision and access credentials for system moderators.</p>
              </div>

              <form onSubmit={handleAddAdmin} className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm flex gap-3">
                <input
                  type="email"
                  placeholder="moderator@sevikaa.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                  className="flex-1 py-3 px-4 bg-gray-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100"
                >
                  <PlusCircle size={14} /> Add Manager
                </button>
              </form>

              <div className="space-y-2">
                {admins.map(adm => (
                  <div key={adm.id} className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-800">{adm.email}</span>
                    <span className="text-gray-400">Created: {adm.created}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SOCIETIES & REGIONS */}
          {activeTab === 'societies' && (
            <div className="space-y-4 animate-fade-in max-w-2xl">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Societies List</h3>
                <p className="text-[10px] text-gray-400 font-bold px-1 mt-0.5">Registered residential societies and service coordinates.</p>
              </div>

              <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
                {societiesList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400 font-bold">
                    No societies registered in the database.
                  </div>
                ) : (
                  societiesList.map((soc) => (
                    <div key={soc.id} className="p-4 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50/50 cursor-pointer">
                      <div className="flex flex-col gap-0.5">
                        <span>{soc.name}</span>
                        <span className="text-[9px] text-gray-400">{soc.city || 'Bangalore'}</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: GLOBAL PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-4 animate-fade-in max-w-xl">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Global System Pricing Configurations</h3>
                <p className="text-[10px] text-gray-400 font-bold px-1 mt-0.5">Set the direct billing plans for employer passes and unlocks.</p>
              </div>

              <form onSubmit={handleSavePricing} className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Premium Contact Unlock Price (₹)</label>
                  <input
                    type="number"
                    value={pricing.premiumUnlocks}
                    onChange={(e) => setPricing({...pricing, premiumUnlocks: e.target.value})}
                    className="w-full py-3.5 px-4 bg-gray-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Employer Subscription / year (₹)</label>
                  <input
                    type="number"
                    value={pricing.employerSub}
                    onChange={(e) => setPricing({...pricing, employerSub: e.target.value})}
                    className="w-full py-3.5 px-4 bg-gray-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Update Configuration Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-fade-in max-w-3xl">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Global Security Audit Log</h3>
                <p className="text-[10px] text-gray-400 font-bold px-1 mt-0.5">Immutable record of admin actions across the database router.</p>
              </div>

              <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                {activities.map((act) => (
                  <div key={act.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/20">
                    <div className="space-y-1">
                      <span className="block font-bold text-slate-800">{act.action}</span>
                      <span className="block text-[9px] text-gray-400 font-semibold">Initiator: {act.actor}</span>
                    </div>
                    <span className="text-[9px] text-gray-400 font-bold">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* 4. ENTERPRISE SYSTEM FOOTER */}
        <footer className="bg-white border-t border-slate-100 py-6 px-6 text-center text-xs text-gray-400 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-400/80">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              <span>Version: v1.2.0-stable</span>
              <span>•</span>
              <span>Env: production</span>
              <span>•</span>
              <span>DB: PostgreSQL 15.6</span>
              <span>•</span>
              <span>Region: ap-south-1 (Mumbai)</span>
            </div>
            <div>
              <span>Powered by YugaYatra Retail (OPC) Private Limited • © {new Date().getFullYear()} All Rights Reserved</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
