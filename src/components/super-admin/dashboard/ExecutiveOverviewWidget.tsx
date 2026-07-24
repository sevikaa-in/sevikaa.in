"use client";

import React from 'react';
import { DollarSign, CreditCard, Sparkles, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

interface ExecutiveOverviewWidgetProps {
  loading: boolean;
  error: string;
  stats: {
    grossRevenue: number;
    mrr: number;
    arr: number;
    activeSubscribers: number;
    conversionRate: number;
    totalSocieties: number;
    platformGrowth: number;
    revenueGrowth: number;
  };
  dateRange: string;
}

export const ExecutiveOverviewWidget: React.FC<ExecutiveOverviewWidgetProps> = ({
  loading,
  error,
  stats,
  dateRange
}) => {
  const lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-[20px]"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-[20px] text-xs text-red-600 font-bold flex items-center gap-2">
        <AlertCircle size={16} />
        <span>Failed to load overview analytics: {error}</span>
      </div>
    );
  }

  const kpis = [
    {
      title: "Gross Revenue",
      value: `₹${stats.grossRevenue.toLocaleString()}`,
      icon: <DollarSign size={18} />,
      colorClass: "bg-[#34A853]/10 text-[#34A853]",
      trend: stats.revenueGrowth >= 0 ? `+${stats.revenueGrowth}%` : `${stats.revenueGrowth}%`,
      trendColor: stats.revenueGrowth >= 0 ? "text-[#34A853] bg-[#34A853]/10" : "text-[#EA4335] bg-[#EA4335]/10",
      comparison: "vs last month",
      description: "Direct earnings from premium passes and subscription conversions.",
    },
    {
      title: "ARR (Annual Run Rate)",
      value: `₹${stats.arr.toLocaleString()}`,
      icon: <RefreshCw size={18} />,
      colorClass: "bg-[#1A73E8]/10 text-[#1A73E8]",
      trend: "+14.8%",
      trendColor: "text-[#34A853] bg-[#34A853]/10",
      comparison: "annualized projection",
      description: "Projected annual revenue based on active recurring premium tiers.",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscribers.toString(),
      icon: <CreditCard size={18} />,
      colorClass: "bg-[#1A73E8]/10 text-[#1A73E8]",
      trend: stats.platformGrowth >= 0 ? `+${stats.platformGrowth}%` : `${stats.platformGrowth}%`,
      trendColor: stats.platformGrowth >= 0 ? "text-[#34A853] bg-[#34A853]/10" : "text-[#EA4335] bg-[#EA4335]/10",
      comparison: "active employer passes",
      description: "Total premium employer profiles currently with active unlocks.",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: <TrendingUp size={18} />,
      colorClass: "bg-[#FBBC05]/10 text-amber-600",
      trend: "+2.1%",
      trendColor: "text-[#34A853] bg-[#34A853]/10",
      comparison: "registration to premium",
      description: "Ratio of registered employers converting to premium access.",
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Executive Overview</h3>
        <span className="text-[9px] text-gray-400 font-bold">Filtered: {dateRange} • Last sync: {lastUpdated}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md min-h-[140px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{kpi.title}</span>
              <div className={`p-2 rounded-xl shrink-0 ${kpi.colorClass}`}>
                {kpi.icon}
              </div>
            </div>
            
            <div className="mt-3">
              <span className="block text-2xl font-black text-slate-800 tracking-tight">{kpi.value}</span>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-slate-50 pt-2.5">
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${kpi.trendColor}`}>
                  {kpi.trend}
                </span>
                <span className="text-[9px] text-gray-400 font-bold">{kpi.comparison}</span>
              </div>
            </div>
            <p className="text-[9px] text-gray-400 font-medium leading-normal mt-1">{kpi.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
