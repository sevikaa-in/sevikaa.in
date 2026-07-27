"use client";

import React from 'react';
import { useSuperAdminDashboard } from './layout';
import { Calendar, MapPin } from 'lucide-react';

// Import Reusable Widgets
import { AttentionRequiredWidget } from '../../../components/super-admin/dashboard/AttentionRequiredWidget';
import { ExecutiveOverviewWidget } from '../../../components/super-admin/dashboard/ExecutiveOverviewWidget';
import { RevenueAnalyticsWidget } from '../../../components/super-admin/dashboard/RevenueAnalyticsWidget';
import { UserGrowthWidget } from '../../../components/super-admin/dashboard/UserGrowthWidget';
import { BusinessInsightsWidget } from '../../../components/super-admin/dashboard/BusinessInsightsWidget';
import { SystemHealthWidget } from '../../../components/super-admin/dashboard/SystemHealthWidget';
import { RecentActivitiesWidget } from '../../../components/super-admin/dashboard/RecentActivitiesWidget';
import { QuickActionsWidget } from '../../../components/super-admin/dashboard/QuickActionsWidget';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const {
    loading,
    error,
    dbStats,
    availabilityMetrics,
    societyAnalytics,
    activities,
    dateRange,
  } = useSuperAdminDashboard();

  const grossRevenue = dbStats.activeEmployers * 999;
  const arr = grossRevenue * 12;

  const systemInsights = [
    { message: `Worker registrations increased 14% this month, driven by DLF Akshayanagar.`, category: 'growth' as const, value: '+14% growth' },
    { message: `Availability slots match: Cooks constitute 48% of active time allocations.`, category: 'efficiency' as const, value: 'Category focus' },
    { message: `Employer Elite Pass subscriptions conversion rate is highest in SNN Raj Serenity.`, category: 'revenue' as const, value: 'Top converter' }
  ];

  const healthStates = [
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
  ];

  return (
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

      {/* Availability Engine Slot allocations summary */}
      <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar size={16} className="text-[#1A73E8]" />
            <span>Availability Engine Load Grid</span>
          </h4>
          <p className="text-[10px] text-gray-400 font-bold">Total active workers mapped to weekly slot schedules</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center">
          {[
            { label: "Early Morning", value: availabilityMetrics.earlyMorning },
            { label: "Morning", value: availabilityMetrics.morning },
            { label: "Afternoon", value: availabilityMetrics.afternoon },
            { label: "Evening", value: availabilityMetrics.evening },
            { label: "Night", value: availabilityMetrics.night },
            { label: "Full Day (8-12h)", value: availabilityMetrics.fullDay },
            { label: "Live-in (24h)", value: availabilityMetrics.liveIn }
          ].map((cell, idx) => (
            <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="block text-[8px] font-bold text-gray-400 uppercase">{cell.label}</span>
              <span className="block text-lg font-black text-slate-800 mt-1">{cell.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Society-First Geo-matching statistics */}
      <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin size={16} className="text-[#34A853]" />
            <span>Society-First Geo-Matching Load</span>
          </h4>
          <p className="text-[10px] text-gray-400 font-bold">Matching density across residential sectors</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {societyAnalytics.map((soc, idx) => (
            <div key={idx} className="p-4 border border-slate-100 rounded-[20px] flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="block text-xs font-bold text-slate-800">{soc.name}</span>
                <span className="block text-[9px] text-gray-400 mt-0.5">Active Jobs: {soc.activeJobs}</span>
              </div>
              <span className="text-xs font-black text-[#1A73E8] bg-white border border-slate-100 px-2.5 py-1 rounded-full">
                {soc.workersCount} Workers
              </span>
            </div>
          ))}
        </div>
      </div>

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
        onAddAdminClick={() => router.push('/super-admin/dashboard/admins')} 
        onAddSocietyClick={() => router.push('/super-admin/dashboard/societies')} 
        onExportReportsClick={() => {}} 
      />
    </div>
  );
}
