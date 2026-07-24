"use client";

import React from 'react';
import { Database, Clock, ArrowRight, Activity, AlertCircle } from 'lucide-react';

interface RecentActivitiesWidgetProps {
  loading: boolean;
  error: string;
  activities: {
    id: string;
    actor: string;
    action: string;
    time: string;
  }[];
}

export const RecentActivitiesWidget: React.FC<RecentActivitiesWidgetProps> = ({
  loading,
  error,
  activities
}) => {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="h-40 bg-slate-200 rounded-[20px]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-[20px] text-xs text-red-600 font-bold flex items-center gap-2">
        <AlertCircle size={16} />
        <span>Failed to load system activity log: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Recent Activities</h3>

      {activities.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-gray-400 flex items-center justify-center mb-3">
            <Activity size={20} />
          </div>
          <span className="text-xs font-extrabold text-slate-800">No Recent Activities</span>
          <span className="text-[10px] text-gray-400 font-semibold mt-1">Audit events will populate here as platform transactions happen.</span>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((act, actIdx) => (
                <li key={act.id}>
                  <div className="relative pb-8">
                    {actIdx !== activities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
                          <Database size={12} />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs text-slate-800 font-bold">
                            {act.action}{' '}
                            <span className="font-semibold text-gray-400">by {act.actor}</span>
                          </p>
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-gray-400 font-bold flex items-center gap-1">
                          <Clock size={10} />
                          <time>{act.time}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
