"use client";

import React, { useState } from 'react';
import { useEmployerDashboard } from '../layout';
import { 
  User, ShieldAlert, ChevronDown, ChevronUp, Trash2, 
  Save, Phone, CreditCard, Home, MapPin, AlertTriangle
} from 'lucide-react';

export default function EmployerAccountPage() {
  const { 
    employerProfile, setEmployerProfile, deletionRequested, 
    handleRequestAccountDeletion, showToast 
  } = useEmployerDashboard();

  const [companyName, setCompanyName] = useState(employerProfile.company_name || 'Ria Bhagat');
  const [phone, setPhone] = useState(employerProfile.phone?.replace(/\D/g, '').slice(-10) || '9876543210');
  const [address, setAddress] = useState(employerProfile.address || 'Tower 4, Apt 802');
  const [saveLoading, setSaveLoading] = useState(false);

  // Discrete Danger Zone State
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('Already hired domestic worker');
  const [customReason, setCustomReason] = useState('');

  // Strict Input Handlers
  const handleNameChange = (val: string) => {
    // Only letters (A-Z, a-z) and spaces allowed
    const lettersOnly = val.replace(/[^a-zA-Z\s]/g, '');
    setCompanyName(lettersOnly);
  };

  const handlePhoneChange = (val: string) => {
    // Only digits allowed, max 10 digits
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const onSave = () => {
    if (phone.length !== 10) return;
    setSaveLoading(true);
    setTimeout(() => {
      setEmployerProfile((prev: any) => ({
        ...prev,
        company_name: companyName,
        phone: `+91 ${phone}`,
        address
      }));
      setSaveLoading(false);
      showToast("Household account details updated!", "success");
    }, 500);
  };

  const onSubmitDeletionRequest = async () => {
    const finalReason = deletionReason === 'Other' ? customReason : deletionReason;
    await handleRequestAccountDeletion(finalReason);
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl pb-12">
      
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <User size={18} className="text-[#1A73E8]" />
          <span>Household &amp; Account Settings</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Manage your residential address, subscription plan, and privacy settings.
        </p>
      </div>

      {/* Account Details Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Household Profile</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase flex justify-between">
              <span>Employer Full Name</span>
              <span className="text-[9px] text-slate-400 lowercase font-normal">(letters only)</span>
            </label>
            <input 
              type="text" 
              value={companyName} 
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Ria Bhagat"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase flex justify-between">
              <span>Fixed 10-Digit Mobile Number</span>
              <span className={`text-[9px] font-bold ${phone.length === 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {phone.length === 10 ? '✓ 10 Digits Valid' : `${phone.length}/10 digits (Must be 10 digits)`}
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">+91</span>
              <input 
                type="text" 
                maxLength={10}
                value={phone} 
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="9876543210"
                className={`w-full p-2.5 pl-12 bg-slate-50 border rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-none font-mono ${
                  phone.length === 10 ? 'border-emerald-300 focus:border-emerald-500' : 'border-amber-300 focus:border-amber-500'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase">Society Gated Community</label>
            <input 
              type="text" 
              value={employerProfile.society_name} 
              disabled
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold opacity-75"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase">Apartment Address</label>
            <input 
              type="text" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-50 flex justify-end">
          <button
            onClick={onSave}
            disabled={saveLoading || phone.length !== 10 || !companyName.trim()}
            className="py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            <span>{saveLoading ? 'Saving...' : 'Save Account Settings'}</span>
          </button>
        </div>
      </div>

      {/* DISCRETE DANGER ZONE CARD (Bottom of Page) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
        <button
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900">Account Management &amp; Danger Zone</h4>
              <p className="text-[10px] text-slate-400 font-semibold">Self-service account deletion &amp; DPDP compliance</p>
            </div>
          </div>
          {showDangerZone ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        {showDangerZone && (
          <div className="p-5 border-t border-slate-100 bg-red-50/20 space-y-3">
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Submitting an account deletion request will close your active job postings and initiate offboarding. 
              A Sevikaa Admin will call your registered phone to confirm your request.
            </p>

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deletionRequested}
              className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{deletionRequested ? 'Deletion Request Logged' : 'Request Account Deletion'}</span>
            </button>
          </div>
        )}
      </div>

      {/* DELETION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-600" />
                <h3 className="text-sm font-black text-slate-900">Request Account Deletion</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Please state your reason for deleting your household account. A Sevikaa Admin will call your phone <strong>+91 {phone}</strong> within 24 hours to confirm offboarding.
            </p>

            <div className="space-y-2 text-xs font-bold text-slate-700">
              <label className="text-[10px] text-slate-400 uppercase">Reason for Offboarding</label>
              <select 
                value={deletionReason} 
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="Already hired domestic worker">Already hired domestic worker</option>
                <option value="Moving to a non-partner society">Moving to a non-partner society</option>
                <option value="No longer requiring domestic help">No longer requiring domestic help</option>
                <option value="Other">Other Reason</option>
              </select>

              {deletionReason === 'Other' && (
                <textarea 
                  placeholder="Specify reason..." 
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={onSubmitDeletionRequest}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md"
              >
                Submit Deletion Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
