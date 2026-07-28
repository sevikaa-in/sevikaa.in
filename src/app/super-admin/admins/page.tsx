"use client";

import React from 'react';
import { useSuperAdminDashboard } from '../layout';
import { Settings, PlusCircle, ShieldAlert } from 'lucide-react';

export default function AdminsPage() {
  const {
    admins,
    newAdminEmail,
    setNewAdminEmail,
    handleAddAdmin
  } = useSuperAdminDashboard();

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Admin Management</h3>
        <p className="text-[10px] text-gray-400 font-bold px-1 mt-0.5">Invite new moderators and adjust operational access levels.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Admins List */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800">Active Platform Administrators</span>
            <span className="bg-slate-100 text-slate-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
              {admins.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                  <th className="p-4">Admin Email</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Access Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-800">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/20">
                    <td className="p-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{adm.email}</span>
                    </td>
                    <td className="p-4 text-gray-400 font-medium">{adm.created}</td>
                    <td className="p-4 text-right">
                      <span className="bg-[#1A73E8]/10 text-[#1A73E8] text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Moderator
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite Form */}
        <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm space-y-4 h-fit">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
            <Settings size={16} className="text-[#1A73E8]" />
            <h4 className="text-xs font-bold text-slate-800">Provision Moderator</h4>
          </div>

          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                placeholder="moderator@sevikaa.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>Create Moderator Access</span>
            </button>
          </form>

          <div className="p-3 bg-amber-50/20 rounded-xl border border-amber-100/50 flex gap-2 text-[10px] leading-relaxed text-amber-800 font-semibold">
            <ShieldAlert size={16} className="shrink-0 text-amber-600 mt-0.5" />
            <span>Moderators will have read & write controls for Verification pipelines, reviews, and templates. Only the Super Admin can adjust configurations.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
