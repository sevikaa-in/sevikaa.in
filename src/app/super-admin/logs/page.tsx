"use client";

import React, { useState, useEffect } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { AuditLogDetailModal, AuditLogItem } from '@/components/super-admin/AuditLogDetailModal';
import { 
  ShieldAlert, ShieldCheck, Search, Filter, Download, Terminal, 
  UserCheck, Key, CreditCard, Settings, AlertTriangle, Info, Clock, RefreshCw, Eye, User
} from 'lucide-react';

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
  const [logsList, setLogsList] = useState<AuditLogItem[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const itemsPerPage = 10;

  const fetchRealLogs = async () => {
    setLoading(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.get('/api/super-admin/audit?limit=200');
      if (data && data.success && Array.isArray(data.logs)) {
        setLogsList(data.logs);
      } else {
        setLogsList([]);
      }
    } catch (err) {
      setLogsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealLogs();
  }, []);

  const filteredLogs = logsList.filter((log) => {
    const matchesSearch = (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.actor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.target_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesSev = selectedSeverity === 'all' || log.severity === selectedSeverity;
    return matchesSearch && matchesCat && matchesSev;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const getSeverityBadge = (severity: string) => {
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

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              fetchRealLogs();
              showToast("Refreshed real-time security audit logs!", "info");
            }}
            disabled={loading}
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportLogs}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            <span>Export Audit Log JSON</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Logged Events</span>
            <span className="text-lg font-black text-slate-900">{logsList.length}</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-[#1A73E8] rounded-xl">
            <Terminal size={16} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Admin Actions</span>
            <span className="text-lg font-black text-slate-900">
              {logsList.filter(l => l.category === 'admin_action' || !l.category).length}
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
              {logsList.filter(l => l.category === 'moderation').length}
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
              {logsList.filter(l => l.severity === 'warning' || l.severity === 'critical').length}
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs font-bold">
          <span className="text-[10px] text-slate-400 uppercase">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="admin_action">Admin Operations</option>
            <option value="moderation">Identity Moderation</option>
            <option value="worker_activity">Worker Onboarding &amp; Profile</option>
            <option value="employer_activity">Employer Activity &amp; Unlocks</option>
            <option value="payment_webhook">Payment Webhooks</option>
            <option value="auth_security">Auth &amp; Security</option>
          </select>

          <span className="text-[10px] text-slate-400 uppercase ml-1">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => {
              setSelectedSeverity(e.target.value);
              setCurrentPage(1);
            }}
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
          paginatedLogs.map((log, index) => {
            const itemNumber = startIndex + index + 1;
            const displayActor = log.admin_email || log.actor || log.admin_name || '';
            const targetSubject = log.target_name || 'System Resource';

            return (
              <div 
                key={log.id || `log_${itemNumber}`} 
                onClick={() => setSelectedLog(log)}
                className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all space-y-2.5 cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                      #{itemNumber}
                    </span>
                    <span className="p-1.5 bg-slate-50 rounded-lg shrink-0 group-hover:bg-blue-50 transition-colors">
                      {getCategoryIcon(log.category)}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1A73E8] transition-colors">{log.action}</h4>
                    
                    <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-200/50">
                      <User size={10} className="text-slate-400" />
                      <span>{targetSubject}</span>
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getSeverityBadge(log.severity)}`}>
                      {log.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[9.5px] font-mono text-slate-400">
                    <Clock size={10} />
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-700 font-semibold leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/80 group-hover:bg-blue-50/20 transition-colors">
                  {log.changes_summary || log.details}
                </p>

                <div className="flex flex-wrap items-center justify-between text-[9.5px] font-bold text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <span>Initiator: <strong className="text-slate-700">{displayActor}</strong></span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 uppercase text-[8px] font-black">{log.actorRole || 'Moderator'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>IP Address: <span className="font-mono text-slate-600">{log.ipAddress}</span></span>
                    <span className="text-[#1A73E8] group-hover:underline flex items-center gap-0.5 text-[9px] font-bold">
                      <Eye size={10} />
                      <span>Inspect Details</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
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
                onClick={() => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
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

      {/* Audit Log Detail Inspector Modal */}
      {selectedLog && (
        <AuditLogDetailModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}
    </div>
  );
}
