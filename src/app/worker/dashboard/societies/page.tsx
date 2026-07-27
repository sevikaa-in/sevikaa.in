"use client";

import React, { useState } from 'react';
import { useWorkerDashboard } from '../layout';
import { MapPin, Plus, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function WorkerSocietiesPage() {
  const { societiesList, workerProfile, showToast } = useWorkerDashboard();
  const [selectedSocietyId, setSelectedSocietyId] = useState(workerProfile.society_id || societiesList[0]?.id);

  const handleSelect = (society: any) => {
    setSelectedSocietyId(society.id);
    showToast(`Primary working society updated to ${society.name}!`, 'success');
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl pb-12">
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <MapPin size={18} className="text-[#1A73E8]" />
          <span>Preferred Working Societies</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Choose gated communities near you where you want to accept household job offers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {societiesList.map((soc) => {
          const isSelected = selectedSocietyId === soc.id;
          return (
            <div 
              key={soc.id} 
              onClick={() => handleSelect(soc)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                isSelected 
                  ? 'bg-blue-50/40 border-[#1A73E8] shadow-sm' 
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-[#1A73E8] text-white' : 'bg-slate-50 text-slate-400'}`}>
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{soc.name}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Active Gated Community</span>
                </div>
              </div>

              {isSelected ? (
                <span className="px-3 py-1 bg-[#1A73E8] text-white rounded-xl text-xs font-black flex items-center gap-1">
                  <CheckCircle2 size={14} /> Selected Primary
                </span>
              ) : (
                <button className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                  Select
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
