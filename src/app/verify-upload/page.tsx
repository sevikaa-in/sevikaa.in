"use client";

import React, { useState, useEffect } from 'react';
import { Camera, FileText, CheckCircle2, ShieldCheck, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function VerifyUploadPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [workerName, setWorkerName] = useState('');

  // Existing assets from server
  const [existingSelfie, setExistingSelfie] = useState('');
  const [existingAadhaarFront, setExistingAadhaarFront] = useState('');
  const [existingAadhaarBack, setExistingAadhaarBack] = useState('');

  // New Upload file states
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState('');
  
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState('');

  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState('');

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tok = urlParams.get('token') || urlParams.get('t');
    if (!tok) {
      setError('Invalid or missing upload verification link.');
      setLoading(false);
      return;
    }

    setToken(tok);

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/worker/upload-token?t=${tok}`);
        const data = await res.json();
        if (data.success) {
          setUserId(data.userId);
          setWorkerName(data.workerName || 'Verification Candidate');
          if (data.existingAssets) {
            setExistingSelfie(data.existingAssets.profile_picture_url || '');
            setExistingAadhaarFront(data.existingAssets.aadhaar_front_url || '');
            setExistingAadhaarBack(data.existingAssets.aadhaar_back_url || '');
          }
        } else {
          setError(data.error || 'Upload link is invalid or expired.');
        }
      } catch (err: any) {
        setError('Failed to validate link.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const handleSelfieChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userId) {
      const file = e.target.files[0];
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));

      // Auto-upload instantly
      setUploading(true);
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${userId}_selfie_${Date.now()}.${fileExt}`;
        const { data, error: uploadErr } = await supabase.storage
          .from('worker-selfies')
          .upload(fileName, file, { upsert: true });

        if (!uploadErr && data) {
          await fetch('/api/admin/worker/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, profile_picture_url: data.path, status: 'pending_review' })
          });
          setExistingSelfie(data.path);
        }
      } catch (err) {
        console.error("Auto-upload selfie error:", err);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAadhaarFrontChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userId) {
      const file = e.target.files[0];
      setAadhaarFrontFile(file);
      setAadhaarFrontPreview(URL.createObjectURL(file));

      // Auto-upload instantly
      setUploading(true);
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${userId}_aadhaar_front_${Date.now()}.${fileExt}`;
        const { data, error: uploadErr } = await supabase.storage
          .from('worker-documents')
          .upload(fileName, file, { upsert: true });

        if (!uploadErr && data) {
          await fetch('/api/admin/worker/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, aadhaar_front_url: data.path, status: 'pending_review' })
          });
          setExistingAadhaarFront(data.path);
        }
      } catch (err) {
        console.error("Auto-upload aadhaar front error:", err);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAadhaarBackChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userId) {
      const file = e.target.files[0];
      setAadhaarBackFile(file);
      setAadhaarBackPreview(URL.createObjectURL(file));

      // Auto-upload instantly
      setUploading(true);
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${userId}_aadhaar_back_${Date.now()}.${fileExt}`;
        const { data, error: uploadErr } = await supabase.storage
          .from('worker-documents')
          .upload(fileName, file, { upsert: true });

        if (!uploadErr && data) {
          await fetch('/api/admin/worker/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, aadhaar_back_url: data.path, status: 'pending_review' })
          });
          setExistingAadhaarBack(data.path);
        }
      } catch (err) {
        console.error("Auto-upload aadhaar back error:", err);
      } finally {
        setUploading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <Loader2 size={32} className="animate-spin text-[#1A73E8] mb-2" />
        <p className="text-xs font-bold text-gray-500">Loading Sevikaa Verification Page...</p>
      </div>
    );
  }

  if (error && !userId) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl max-w-sm w-full text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-sm font-black text-slate-800">Verification Link Notice</h3>
          <p className="text-xs text-gray-500 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl max-w-sm w-full text-center space-y-4 animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#34A853] flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">Upload Successful!</h3>
            <p className="text-xs text-gray-500 font-bold mt-1">
              Namaste {workerName}, your updated verification photos have been received successfully. Our team will verify and activate your profile.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] font-black text-[#1A73E8]">
            <ShieldCheck size={14} />
            <span>Sevikaa Official Verification Service</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124] flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-3xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white text-center space-y-1">
          <img src="/logo.png" alt="Sevikaa" className="h-8 mx-auto bg-white rounded-full p-1 mb-2" />
          <h2 className="text-base font-black tracking-tight">Sevikaa Worker Verification</h2>
          <p className="text-xs text-slate-300 font-semibold">Welcome, {workerName}</p>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          
          {/* 1. Selfie Photo */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700 flex items-center justify-between">
              <span>1. Selfie Photo</span>
              {existingSelfie && !selfiePreview && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <CheckCircle2 size={11} /> Previously Uploaded
                </span>
              )}
            </label>
            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
              {selfiePreview ? (
                <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-[#1A73E8]">
                  <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1A73E8] flex items-center justify-center mx-auto">
                  <Camera size={24} />
                </div>
              )}

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 shadow-sm">
                <Camera size={14} />
                <span>{selfiePreview || existingSelfie ? 'Re-take Selfie Photo' : 'Snap Selfie Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleSelfieChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 2. Aadhaar Front Card */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700 flex items-center justify-between">
              <span>2. Aadhaar Front Photo</span>
              {existingAadhaarFront && !aadhaarFrontPreview && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <CheckCircle2 size={11} /> Previously Uploaded
                </span>
              )}
            </label>
            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
              {aadhaarFrontPreview ? (
                <div className="relative w-40 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-[#1A73E8]">
                  <img src={aadhaarFrontPreview} alt="Aadhaar Front preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#34A853] flex items-center justify-center mx-auto">
                  <FileText size={24} />
                </div>
              )}

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 shadow-sm">
                <FileText size={14} />
                <span>{aadhaarFrontPreview || existingAadhaarFront ? 'Re-take Aadhaar Front' : 'Snap Aadhaar Front'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleAadhaarFrontChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 3. Aadhaar Back Card */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700 flex items-center justify-between">
              <span>3. Aadhaar Back Photo</span>
              {existingAadhaarBack && !aadhaarBackPreview && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <CheckCircle2 size={11} /> Previously Uploaded
                </span>
              )}
            </label>
            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
              {aadhaarBackPreview ? (
                <div className="relative w-40 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-[#1A73E8]">
                  <img src={aadhaarBackPreview} alt="Aadhaar Back preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <FileText size={24} />
                </div>
              )}

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 shadow-sm">
                <RefreshCw size={14} />
                <span>{aadhaarBackPreview || existingAadhaarBack ? 'Re-take Aadhaar Back' : 'Snap Aadhaar Back'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleAadhaarBackChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 4. Intro Video (15s Max) */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700 flex items-center justify-between">
              <span>4. Short Intro Video (15s Max)</span>
              <span className="text-[10px] text-gray-400 font-bold">Optional</span>
            </label>
            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center mx-auto">
                <Camera size={24} />
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 shadow-sm">
                <Camera size={14} />
                <span>Record 15-Sec Intro Video</span>
                <input
                  type="file"
                  accept="video/*"
                  capture="user"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0] && userId) {
                      const file = e.target.files[0];
                      setUploading(true);
                      try {
                        const fileExt = file.name.split('.').pop() || 'mp4';
                        const fileName = `${userId}_video_${Date.now()}.${fileExt}`;
                        const { data, error: uploadErr } = await supabase.storage
                          .from('worker-videos')
                          .upload(fileName, file, { upsert: true });

                        if (!uploadErr && data) {
                          await fetch('/api/admin/worker/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId, video_url: data.path, status: 'pending_review' })
                          });
                        }
                      } catch (err) {
                        console.error("Video upload error:", err);
                      } finally {
                        setUploading(false);
                      }
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSuccess(true)}
            disabled={uploading}
            className="w-full py-3.5 px-4 bg-[#34A853] hover:bg-[#2b8a43] disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Uploading Instantly to Admin...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Done — Photos Transferred Live</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
