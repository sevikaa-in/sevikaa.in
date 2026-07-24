"use client";

import React from 'react';
import { Lightbulb, TrendingUp, Sparkles, HelpCircle, MapPin, Award } from 'lucide-react';

interface BusinessInsightsWidgetProps {
  loading: boolean;
  error: string;
  insights: {
    message: string;
    category: 'growth' | 'efficiency' | 'revenue' | 'general';
    value: string;
  }[];
}

export const BusinessInsightsWidget: React.FC<BusinessInsightsWidgetProps> = ({
  loading,
  error,
  insights
}) => {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-[20px]"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-[20px] text-xs text-red-600 font-bold flex items-center gap-2">
        <HelpCircle size={16} />
        <span>Failed to load business insights: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Business Intelligence & Insights</h3>

      {insights.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-gray-400 flex items-center justify-center mb-3">
            <Lightbulb size={20} />
          </div>
          <span className="text-xs font-extrabold text-slate-800">No Insights Found</span>
          <span className="text-[10px] text-gray-400 font-semibold mt-1">Check back later for automated operational metrics.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, idx) => {
            const getIcon = () => {
              switch (insight.category) {
                case 'growth': return <TrendingUp size={16} className="text-[#34A853]" />;
                case 'revenue': return <Award size={16} className="text-[#1A73E8]" />;
                case 'efficiency': return <Sparkles size={16} className="text-[#FBBC05]" />;
                default: return <Lightbulb size={16} className="text-[#1A73E8]" />;
              }
            };
            const getBg = () => {
              switch (insight.category) {
                case 'growth': return 'bg-[#34A853]/5 border-[#34A853]/10';
                case 'revenue': return 'bg-[#1A73E8]/5 border-[#1A73E8]/10';
                case 'efficiency': return 'bg-[#FBBC05]/5 border-[#FBBC05]/10';
                default: return 'bg-[#1A73E8]/5 border-[#1A73E8]/10';
              }
            };
            return (
              <div key={idx} className={`border p-4 rounded-[20px] shadow-sm flex items-start gap-3 bg-white transition-all duration-200 hover:shadow-md ${getBg()}`}>
                <div className="p-2 rounded-xl bg-white border border-slate-100 shrink-0 shadow-sm">
                  {getIcon()}
                </div>
                <div>
                  <span className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">{insight.value}</span>
                  <p className="text-[10px] text-gray-500 font-bold leading-normal mt-1">{insight.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
