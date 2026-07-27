"use client";

import React, { useState } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { 
  ShieldAlert, ShieldCheck, Search, Filter, Download, Terminal, 
  UserCheck, Key, CreditCard, Settings, AlertTriangle, Info, Clock, RefreshCw
} from 'lucide-react';

interface AuditLogEvent {
  id: string;
  action: string;
  category: 'admin_action' | 'auth_security' | 'moderation' | 'payment_webhook' | 'system_alert';
  severity: 'info' | 'warning' | 'critical';
  actor: string;
  actorRole: 'Super Admin' | 'Moderator' | 'System Trigger' | 'Employer';
  ipAddress: string;
  timestamp: string;
  details: string;
}

const MOCK_AUDIT_LOGS: AuditLogEvent[] = [
  {
    id: 'log_901',
    action: 'Platform Pricing Configuration Updated',
    category: 'admin_action',
    severity: 'info',
    actor: 'admin@sevikaa.com',
    actorRole: 'Super Admin',
    ipAddress: '103.142.12.44',
    timestamp: '2026-07-27 13:28:44 UTC',
    details: 'Updated employer pricing tiers: Basic ₹299, Standard ₹699, Pro ₹1499. Saved to platform_settings.'
  },
  {
    id: 'log_902',
    action: 'Worker Identity Profile Approved',
    category: 'moderation',
    severity: 'info',
    actor: 'moderator1@sevikaa.com',
    actorRole: 'Moderator',
    ipAddress: '103.142.12.50',
    timestamp: '2026-07-27 12:45:10 UTC',
    details: 'Approved worker profile for Ramesh Kumar (Aadhaar & Selfie verified).'
  },
  {
    id: 'log_903',
    action: 'Razorpay Payment Webhook Processed',
    category: 'payment_webhook',
    severity: 'info',
    actor: 'Razorpay Gateway',
    actorRole: 'System Trigger',
    ipAddress: '52.66.120.14',
    timestamp: '2026-07-27 11:30:00 UTC',
    details: 'Subscription payment of ₹699 captured for Employer: Janhvi Diwan (Order ID: pay_901248).'
  },
  {
    id: 'log_904',
    action: 'New Admin Moderator Account Created',
    category: 'admin_action',
    severity: 'warning',
    actor: 'admin@sevikaa.com',
    actorRole: 'Super Admin',
    ipAddress: '103.142.12.44',
    timestamp: '2026-07-27 10:15:22 UTC',
    details: 'Granted moderator role to user email: ops.lead@sevikaa.com.'
  },
  {
    id: 'log_905',
    action: 'Multiple Failed OTP Verification Attempts',
    category: 'auth_security',
    severity: 'warning',
    actor: '+91 9876543210',
    actorRole: 'Employer',
    ipAddress: '49.36.18.90',
    timestamp: '2026-07-27 09:50:18 UTC',
    details: '5 failed SMS OTP login attempts within 3 minutes from single IP address.'
  },
  {
    id: 'log_906',
    action: 'Worker Account Suspended',
    category: 'moderation',
    severity: 'critical',
    actor: 'moderator2@sevikaa.com',
    actorRole: 'Moderator',
    ipAddress: '103.142.12.88',
    timestamp: '2026-07-27 08:20:05 UTC',
    details: 'Suspended worker profile: Sunita Devi due to unverified Aadhaar mismatch.'
  },
  {
    id: 'log_907',
    action: 'New Residential Society Registered',
    category: 'admin_action',
    severity: 'info',
    actor: 'admin@sevikaa.com',
    actorRole: 'Super Admin',
    ipAddress: '103.142.12.44',
    timestamp: '2026-07-27 07:10:30 UTC',
    details: 'Added Prestige Ferns Residency, Bangalore to gated community catalog.'
  }
];

export default function LogsPage() {
  const {
    user,
    admins,
    showToast
  } = useSuperAdminDashboard();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const currentAdminEmail = user?.email || 'admin@sevikaa.com';
  const mod1Email = admins[0]?.email || 'moderator1@sevikaa.com';
  const mod2Email = admins[1]?.email || 'moderator2@sevikaa.com';

  // Dynamic audit logs using actual logged-in user & admin emails
  const dynamicLogs: AuditLogEvent[] = MOCK_AUDIT_LOGS.map((log) => {
    if (log.actorRole === 'Super Admin') {
      return { ...log, actor: currentAdminEmail };
    }
    if (log.actorRole === 'Moderator') {
      return { ...log, actor: log.id === 'log_906' ? mod2Email : mod1Email };
    }
    return log;
  });

  const filteredLogs = dynamicLogs.filter((log) => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesSev = selectedSeverity === 'all' || log.severity === selectedSeverity;
    return matchesSearch && matchesCat && matchesSev;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const getSeverityBadge = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 text-[#EA4335] border-red-200/60';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      default:
        return 'bg-blue-50 text-[#1A73E8] border-blue-200/60';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth_security':
        return <Key size={14} className="text-amber-600" />;
      case 'moderation':
        return <UserCheck size={14} className="text-[#34A853]" />;
      case 'payment_webhook':
        return <CreditCard size={14} className="text-purple-600" />;
      case 'system_alert':
        return <AlertTriangle size={14} className="text-[#EA4335]" />;
      default:
        return <Settings size={14} className="text-[#1A73E8]" />;
    }
  };

  const handleExportLogs = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredLogs, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `sevikaa_security_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Audit log export generated successfully!', 'success');
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Terminal size={18} className="text-[#1A73E8]" />
            <span>Global Security &amp; Compliance Audit Log</span>
            <span className="bg-blue-50 text-[#1A73E8] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200/50">
              Immutable Trail
            </span>
          </h3>
          <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
            Real-time record of admin operations, authentication events, payment webhooks, and identity moderation.
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Download size={14} />
          <span>Export Audit Log JSON</span>
        </button>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Logged Events</span>
            <span className="text-lg font-black text-slate-900">{MOCK_AUDIT_LOGS.length}</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-[#1A73E8] rounded-xl">
            <Terminal size={16} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Admin Actions</span>
            <span className="text-lg font-black text-slate-900">
              {MOCK_AUDIT_LOGS.filter(l => l.category === 'admin_action').length}
            </span>
          </div>
          <div className="p-2.5 bg-indigo-50 text-[#1A73E8] rounded-xl">
            <Settings size={16} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Moderation Events</span>
            <span className="text-lg font-black text-slate-900">
              {MOCK_AUDIT_LOGS.filter(l => l.category === 'moderation').length}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-[#34A853] rounded-xl">
            <UserCheck size={16} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Security Alerts</span>
            <span className="text-lg font-black text-amber-700">
              {MOCK_AUDIT_LOGS.filter(l => l.severity === 'warning' || l.severity === 'critical').length}
            </span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
            <AlertTriangle size={16} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, actor, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs font-bold">
          <span className="text-[10px] text-slate-400 uppercase">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="admin_action">Admin Operations</option>
            <option value="moderation">Identity Moderation</option>
            <option value="payment_webhook">Payment Webhooks</option>
            <option value="auth_security">Auth &amp; Security</option>
          </select>

          <span className="text-[10px] text-slate-400 uppercase ml-1">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2.5 py-1 rounded-full uppercase ml-1">
            {filteredLogs.length} Events
          </span>
        </div>
      </div>

      {/* Audit Log Cards Container */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-xs text-slate-400 font-bold">
            No audit log entries matching your active filters.
          </div>
        ) : (
          paginatedLogs.map((log) => (
            <div 
              key={log.id} 
              className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-slate-50 rounded-lg shrink-0">
                    {getCategoryIcon(log.category)}
                  </span>
                  <h4 className="text-xs font-black text-slate-900">{log.action}</h4>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getSeverityBadge(log.severity)}`}>
                    {log.severity}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[9.5px] font-mono text-slate-400">
                  <Clock size={10} />
                  <span>{log.timestamp}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/60 font-mono">
                {log.details}
              </p>

              <div className="flex flex-wrap items-center justify-between text-[9.5px] font-bold text-slate-400 pt-1">
                <div className="flex items-center gap-2">
                  <span>Initiator: <strong className="text-slate-700">{log.actor}</strong></span>
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 uppercase text-[8px] font-black">{log.actorRole}</span>
                </div>
                <span>IP Address: <span className="font-mono text-slate-600">{log.ipAddress}</span></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls Bar */}
      {filteredLogs.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{startIndex + 1}</strong> to <strong className="text-slate-800">{Math.min(startIndex + itemsPerPage, filteredLogs.length)}</strong> of <strong className="text-slate-800">{filteredLogs.length}</strong> audit log entries
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#1A73E8] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
