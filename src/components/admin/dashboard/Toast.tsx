"use client";

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={15} className="shrink-0 text-[#34A853]" />,
  error:   <XCircle size={15} className="shrink-0 text-[#EA4335]" />,
  warning: <AlertTriangle size={15} className="shrink-0 text-[#FBBC05]" />,
  info:    <Info size={15} className="shrink-0 text-[#1A73E8]" />,
};

const BG: Record<ToastType, string> = {
  success: 'border-[#34A853]/20 bg-white',
  error:   'border-[#EA4335]/20 bg-white',
  warning: 'border-[#FBBC05]/20 bg-white',
  info:    'border-[#1A73E8]/20 bg-white',
};

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-lg shadow-slate-200/60 text-xs font-bold text-slate-800 animate-slide-up max-w-sm w-full ${BG[toast.type]}`}
    >
      {ICONS[toast.type]}
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-300 hover:text-slate-600 transition-colors cursor-pointer shrink-0 mt-0.5"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
