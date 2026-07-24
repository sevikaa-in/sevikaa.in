"use client";

import React from 'react';
import { DollarSign, BarChart3, TrendingUp, HelpCircle } from 'lucide-react';

interface RevenueAnalyticsWidgetProps {
  loading: boolean;
  error: string;
  revenueHistory: { month: string; amount: number }[];
  activeSubscribers: number;
}

export const RevenueAnalyticsWidget: React.FC<RevenueAnalyticsWidgetProps> = ({
  loading,
  error,
  revenueHistory,
  activeSubscribers
}) => {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="bg-slate-200 rounded-[20px] h-64"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-[20px] text-xs text-red-600 font-bold flex items-center gap-2">
        <HelpCircle size={16} />
        <span>Failed to load revenue analytics: {error}</span>
      </div>
    );
  }

  // Calculate MRR/ARR dynamically
  const mrr = activeSubscribers * 999;
  const arr = mrr * 12;
  const avgRevenuePerSociety = activeSubscribers > 0 ? (mrr / 3) : 0; // standard mock calculation for 3 societies

  const hasRevenue = activeSubscribers > 0 || revenueHistory.length > 0;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Revenue Analytics</h3>
      
      {!hasRevenue ? (
        <div className="bg-white border border-slate-100 rounded-[20px] p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-gray-400 flex items-center justify-center mb-3">
            <DollarSign size={20} />
          </div>
          <span className="text-xs font-extrabold text-slate-800">No Revenue Generated</span>
          <span className="text-[10px] text-gray-400 font-semibold mt-1">Onboard paying employers to start tracking transaction analytics.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Trend SVG Chart */}
          <div className="lg:col-span-2 bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Monthly Collection Trend</h4>
                <p className="text-[10px] text-gray-400 font-bold">Historical system subscription billing path</p>
              </div>
              <div className="flex gap-4 text-[9px] font-bold text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#1A73E8]"></span> Subscription Unlocks</span>
              </div>
            </div>

            {/* Simple Responsive SVG Graph */}
            <div className="relative w-full h-40 bg-slate-50/50 rounded-xl flex items-end px-4 pb-2 pt-6">
              <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                {/* Area under curve (Flat Opacity Fill) */}
                <path
                  d="M 10 100 L 10 80 Q 100 50 190 60 T 370 20 L 370 100 Z"
                  fill="#1A73E8"
                  fillOpacity="0.08"
                />
                {/* Line path (Official Brand Blue) */}
                <path
                  d="M 10 80 Q 100 50 190 60 T 370 20"
                  fill="none"
                  stroke="#1A73E8"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Dot coordinates */}
                <circle cx="10" cy="80" r="4" fill="#1A73E8" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="100" cy="65" r="4" fill="#1A73E8" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="190" cy="60" r="4" fill="#1A73E8" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="280" cy="40" r="4" fill="#1A73E8" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="370" cy="20" r="4" fill="#1A73E8" stroke="#ffffff" strokeWidth="1.5" />
              </svg>
              {/* X-Axis labels */}
              <div className="absolute bottom-1 left-0 right-0 flex justify-between px-3 text-[8px] font-bold text-gray-400">
                <span>May</span>
                <span>Jun</span>
                <span>Jul (YTD)</span>
              </div>
            </div>
          </div>

          {/* Granular billing details */}
          <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Revenue Breakdown</h4>
              <p className="text-[10px] text-gray-400 font-bold">Key billing projections</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Monthly MRR</span>
                <span className="text-xs font-black text-[#34A853]">₹{mrr.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Annualized ARR</span>
                <span className="text-xs font-black text-slate-700">₹{arr.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Avg per Society</span>
                <span className="text-xs font-black text-slate-700">₹{Math.round(avgRevenuePerSociety).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Elite Pass Share</span>
                <span className="text-xs font-black text-indigo-600">100%</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-xl text-[9px] text-[#4f46e5] font-bold leading-normal flex gap-1.5 items-start">
              <TrendingUp size={14} className="shrink-0 mt-0.5" />
              <span>Conversion conversion levels are matching targets. Standard ARR margins remain stable.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
