"use client";

import React, { useState } from 'react';
import { useEmployerDashboard } from '../layout';
import { Search, MapPin, Phone, Lock, CheckCircle2, Star, ShieldCheck, Heart } from 'lucide-react';

export default function EmployerWorkersPage() {
  const { 
    unlockedContacts, unlockedPhones, bookmarkedContacts, 
    handleUnlockContact, handleToggleBookmark, showToast 
  } = useEmployerDashboard();

  const [searchCategory, setSearchCategory] = useState('all');

  const candidates = [
    {
      id: 'w_1',
      name: 'Ramesh Kumar',
      category: 'Professional Cook & Chef',
      experience: '5 Years',
      salary: '16,000',
      society: 'DLF Westend Heights',
      phone: '+91 98765 43210',
      rating: 4.9,
      reviewsCount: 12,
      verified: true
    },
    {
      id: 'w_2',
      name: 'Sunita Devi',
      category: 'Housemaid & Cleaning Specialist',
      experience: '3 Years',
      salary: '12,000',
      society: 'Prestige Song of the South',
      phone: '+91 98123 45678',
      rating: 4.7,
      reviewsCount: 8,
      verified: true
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl pb-12">
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Search size={18} className="text-[#1A73E8]" />
          <span>Candidate Search &amp; Direct Phone Unlocks</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Browse Aadhaar &amp; background verified domestic workers in your society.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {candidates.map((cand) => {
          const isUnlocked = unlockedContacts.includes(cand.id);
          const isBookmarked = bookmarkedContacts.includes(cand.id);

          return (
            <div key={cand.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:border-slate-200 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-slate-900">{cand.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-50 text-[#34A853] text-[8px] font-black uppercase rounded-full flex items-center gap-1">
                      <ShieldCheck size={10} /> Verified
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-semibold">{cand.category}</p>
                </div>

                <button 
                  onClick={() => handleToggleBookmark(cand.id)}
                  className={`p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors ${isBookmarked ? 'text-red-500' : ''}`}
                >
                  <Heart size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
                <span className="flex items-center gap-1"><MapPin size={12} className="text-[#1A73E8]" /> {cand.society}</span>
                <span className="text-emerald-700 font-mono">₹{cand.salary}/mo</span>
              </div>

              <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                {isUnlocked ? (
                  <a 
                    href={`tel:${unlockedPhones[cand.id] || cand.phone}`}
                    className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Phone size={13} />
                    <span>Call Candidate ({unlockedPhones[cand.id] || cand.phone})</span>
                  </a>
                ) : (
                  <button
                    onClick={() => handleUnlockContact(cand.id)}
                    className="py-2 px-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Lock size={13} />
                    <span>Unlock Phone Contact</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
