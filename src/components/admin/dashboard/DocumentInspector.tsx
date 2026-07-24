"use client";

import React, { useState } from 'react';
import { Camera, FileText, Video, RotateCw, ZoomIn, ZoomOut, Check, X, ShieldAlert } from 'lucide-react';

interface DocumentInspectorProps {
  worker: any;
  onUpdateBadge: (badgeKey: string, status: 'Pending' | 'Verified' | 'Rejected') => void;
}

export const DocumentInspector: React.FC<DocumentInspectorProps> = ({
  worker,
  onUpdateBadge
}) => {
  const [activeDocTab, setActiveDocTab] = useState<'selfie' | 'aadhaar' | 'pcc' | 'video'>('selfie');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [notes, setNotes] = useState('');

  if (!worker) {
    return (
      <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px] h-full">
        <ShieldAlert size={28} className="text-gray-300 mb-2" />
        <span className="text-xs font-bold text-slate-800">No Item Selected</span>
        <span className="text-[10px] text-gray-400 font-semibold mt-1">Select a worker from the queue to inspect documents and verify badges.</span>
      </div>
    );
  }

  // Pre-made note template helper
  const applyTemplate = (tpl: string) => {
    setNotes(prev => prev ? `${prev}\n${tpl}` : tpl);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(2.5, prev + 0.2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.5, prev - 0.2));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const resetTransform = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm space-y-4 flex flex-col h-full justify-between">
      {/* Inspector Header */}
      <div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Audit Workspace</span>
        <h4 className="text-sm font-black text-slate-800 mt-1">{worker.name || worker.full_name}</h4>
      </div>

      {/* Verification Badges Checklist (PRD section 4.5) */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 space-y-3">
        <span className="block text-[9px] font-black text-slate-700 uppercase tracking-wider">PRD Verification Badges</span>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-800">
          {[
            { key: 'mobile', label: 'Mobile Verified' },
            { key: 'aadhaar', label: 'Aadhaar Verified' },
            { key: 'police', label: 'Police Verified' },
            { key: 'interview', label: 'Interview Verified' },
            { key: 'video', label: 'Video Verified' },
            { key: 'profile', label: 'Profile Approved' }
          ].map((badge) => {
            const currentStatus = worker.badges?.[badge.key] || 'Pending';
            return (
              <div key={badge.key} className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <span className="text-[9px] font-bold text-gray-500">{badge.label}</span>
                <div className="flex gap-1">
                  {['Pending', 'Verified', 'Rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => onUpdateBadge(badge.key, status as any)}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase active:scale-95 transition-all cursor-pointer ${
                        currentStatus === status
                          ? status === 'Verified'
                            ? 'bg-[#34A853] text-white'
                            : status === 'Rejected'
                            ? 'bg-[#EA4335] text-white'
                            : 'bg-[#FBBC05] text-[#202124]'
                          : 'bg-white text-gray-400 border border-slate-100 hover:border-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Tab Selection */}
      <div className="flex border-b border-slate-100 text-[10px] font-bold text-gray-500">
        {[
          { id: 'selfie', label: 'Selfie Preview', icon: <Camera size={12} /> },
          { id: 'aadhaar', label: 'Aadhaar Front/Back', icon: <FileText size={12} /> },
          { id: 'pcc', label: 'Police PCC', icon: <FileText size={12} /> },
          { id: 'video', label: 'Video Intro', icon: <Video size={12} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveDocTab(tab.id as any);
              resetTransform();
            }}
            className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 cursor-pointer ${
              activeDocTab === tab.id ? 'border-[#1A73E8] text-[#1A73E8]' : 'border-transparent hover:text-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Document Viewer Frame */}
      <div className="relative w-full h-52 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-2">
        
        {/* Controls Overlay */}
        {activeDocTab !== 'video' && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <button onClick={handleZoomIn} className="p-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-700 cursor-pointer"><ZoomIn size={12} /></button>
            <button onClick={handleZoomOut} className="p-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-700 cursor-pointer"><ZoomOut size={12} /></button>
            <button onClick={handleRotate} className="p-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-700 cursor-pointer"><RotateCw size={12} /></button>
          </div>
        )}

        {activeDocTab === 'selfie' && (
          <div 
            className="w-32 h-32 rounded-full overflow-hidden border-2 border-white shadow transition-all duration-150"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
            }}
          >
            {worker.profile_picture_url || worker.selfie ? (
              <img 
                src={worker.profile_picture_url || '/logo.png'} 
                alt="Selfie audit" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 bg-white">
                No Selfie
              </div>
            )}
          </div>
        )}

        {activeDocTab === 'aadhaar' && (
          <div 
            className="w-full h-full flex items-center justify-center transition-all duration-150"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
            }}
          >
            {worker.aadhaar_front_url ? (
              <img 
                src={worker.aadhaar_front_url} 
                alt="Aadhaar Front audit" 
                className="max-w-full max-h-full object-contain" 
              />
            ) : (
              <div className="text-[10px] text-gray-400 font-bold">No Aadhaar Front Uploaded</div>
            )}
          </div>
        )}

        {activeDocTab === 'pcc' && (
          <div 
            className="w-full h-full flex items-center justify-center transition-all duration-150"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
            }}
          >
            <div className="text-[10px] text-gray-400 font-bold p-4 text-center">
              Police Clearance Certificate (PCC)<br />
              <span className="text-[9px] text-gray-300 font-medium">Verify verification check status matches background records</span>
            </div>
          </div>
        )}

        {activeDocTab === 'video' && (
          <div className="w-full h-full flex items-center justify-center">
            {worker.video_url ? (
              <video 
                src={worker.video_url} 
                controls 
                className="max-w-full max-h-full rounded-lg" 
              />
            ) : (
              <div className="text-[10px] text-gray-400 font-bold">No Introduction Video Uploaded</div>
            )}
          </div>
        )}
      </div>

      {/* Verification Notes & Change Request templates */}
      <div className="space-y-2">
        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wide">Verification Notes & Decisions</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Log document audit results or change instructions..."
          className="w-full py-2 px-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none resize-none transition-colors"
        />
        
        {/* Quick template buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            "Selfie blurry, please re-upload",
            "Aadhaar front cut off",
            "Intro video quality low",
            "Document verified successfully"
          ].map((tpl) => (
            <button
              key={tpl}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100/80 rounded-lg text-[8px] font-bold text-gray-500 border border-slate-100/50 cursor-pointer active:scale-95 transition-all"
            >
              + {tpl.split(',')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
