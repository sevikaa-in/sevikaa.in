"use client";

import React from 'react';
import { ShieldCheck, AlertCircle, RefreshCw, Server } from 'lucide-react';

interface SystemHealthWidgetProps {
  loading: boolean;
  error: string;
  healthStates: {
    name: string;
    status: 'Healthy' | 'Warning' | 'Critical';
    lastChecked: string;
    details: string;
  }[];
}

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({
  loading,
  error,
  healthStates
}) => {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-[20px]"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-[20px] text-xs text-red-600 font-bold flex items-center gap-2">
        <AlertCircle size={16} />
        <span>Failed to load system health metrics: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">System Health Status</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {healthStates.map((service, idx) => {
          const getStatusStyles = () => {
            switch (service.status) {
              case 'Healthy':
                return {
                  bg: 'bg-[#34A853]/5 border-[#34A853]/10',
                  indicator: 'bg-[#34A853]',
                  text: 'text-[#34A853]',
                  icon: <ShieldCheck size={14} className="text-[#34A853]" />
                };
              case 'Warning':
                return {
                  bg: 'bg-[#FBBC05]/5 border-[#FBBC05]/10',
                  indicator: 'bg-[#FBBC05]',
                  text: 'text-amber-600',
                  icon: <AlertCircle size={14} className="text-amber-600" />
                };
              default:
                return {
                  bg: 'bg-[#EA4335]/5 border-[#EA4335]/10',
                  indicator: 'bg-[#EA4335]',
                  text: 'text-[#EA4335]',
                  icon: <AlertCircle size={14} className="text-[#EA4335]" />
                };
            }
          };

          const styles = getStatusStyles();

          return (
            <div key={idx} className={`p-4 border rounded-[20px] shadow-sm flex flex-col justify-between min-h-[110px] bg-white transition-all duration-200 hover:shadow-md ${styles.bg}`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Server size={14} className="text-slate-400" />
                  {service.name}
                </span>
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${styles.indicator} animate-pulse`}></span>
                  <span className={`text-[9px] font-black uppercase ${styles.text}`}>{service.status}</span>
                </span>
              </div>

              <div className="mt-2.5">
                <span className="block text-[10px] text-gray-500 font-bold">{service.details}</span>
              </div>

              <div className="mt-2.5 border-t border-slate-50 pt-2 flex items-center justify-between text-[8px] font-bold text-gray-400">
                <span>Checked: {service.lastChecked}</span>
                <span className="flex items-center gap-0.5">
                  <RefreshCw size={8} /> Auto
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
