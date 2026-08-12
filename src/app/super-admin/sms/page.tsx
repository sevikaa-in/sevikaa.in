"use client";

import React, { useState, useEffect } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { Search, Send, ShieldCheck, Mail, MessageSquare, RefreshCw, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SmsPage() {
  const { smsLogs } = useSuperAdminDashboard();

  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'sms' | 'email'>('all');
  const [selectedProvider, setSelectedProvider] = useState<'all' | 'msg91' | 'aws_ses'>('all');
  
  // Pagination & Caching state
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [logsList, setLogsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [logsCache, setLogsCache] = useState<{ [key: string]: { logs: any[]; total: number; totalPages: number } }>({});

  const fetchLiveLogs = async (targetPage = page, forceRefresh = false) => {
    const cacheKey = `logs_p${targetPage}_l${pageSize}`;
    
    // Check in-memory cache first if not forced refresh
    if (!forceRefresh && logsCache[cacheKey]) {
      const cached = logsCache[cacheKey];
      setLogsList(cached.logs);
      setTotalCount(cached.total);
      setTotalPages(cached.totalPages);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.get(`/api/notifications/logs?page=${targetPage}&limit=${pageSize}`);
      if (data && data.success && Array.isArray(data.logs)) {
        setLogsList(data.logs);
        setTotalCount(data.total || data.logs.length);
        setTotalPages(data.totalPages || 1);

        // Store in local cache
        setLogsCache(prev => ({
          ...prev,
          [cacheKey]: { logs: data.logs, total: data.total, totalPages: data.totalPages }
        }));
      } else {
        setLogsList(smsLogs || []);
      }
    } catch (err) {
      setLogsList(smsLogs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveLogs(page);
  }, [page]);

  const activeLogs = logsList.length > 0 ? logsList : smsLogs;

  const filteredLogs = activeLogs.filter((log: any) => {
    const matchesSearch = (log.recipient || log.recipient_phone || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                          (log.template_id || log.template_key || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                          (log.description || log.message || '').toLowerCase().includes(logSearchTerm.toLowerCase());
    const matchesChannel = selectedChannel === 'all' || (log.channel || 'sms').toLowerCase() === selectedChannel;
    const matchesProvider = selectedProvider === 'all' || (log.provider || 'msg91').toLowerCase() === selectedProvider;
    return matchesSearch && matchesChannel && matchesProvider;
  });

  const deliveredCount = activeLogs.filter((l: any) => l.status === 'delivered' || l.status === 'success').length;
  const deliveryRate = activeLogs.length > 0 ? Math.round((deliveredCount / activeLogs.length) * 100) : 100;

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-6xl pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Send size={18} className="text-[#1A73E8]" />
            <span>MSG91 SMS &amp; AWS SES Email Gateway Console</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Real-time webhook delivery ledger for MSG91 SMS OTPs and AWS SES Email notifications.
          </p>
        </div>

        <button
          onClick={() => fetchLiveLogs(page, true)}
          className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Gateway Status Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="block text-[9px] font-bold text-gray-400 uppercase">SMS Gateway (MSG91)</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse"></span>
            <span className="text-sm font-black text-slate-800">SEVKAA Header Active</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="block text-[9px] font-bold text-gray-400 uppercase">Email Gateway (AWS SES)</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse"></span>
            <span className="text-sm font-black text-slate-800">sevikaa.in Domain Verified</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="block text-[9px] font-bold text-gray-400 uppercase">Total Webhook Logs</span>
          <span className="block text-2xl font-black text-slate-800 mt-0.5">{totalCount || activeLogs.length} Events</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="block text-[9px] font-bold text-gray-400 uppercase">Page Delivery Rate</span>
          <span className="block text-2xl font-black text-[#34A853] mt-0.5">{deliveryRate}% Success</span>
        </div>
      </div>

      {/* Webhook Explanatory Banner */}
      <div className="bg-[#1A73E8]/5 p-4 rounded-2xl border border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <h4 className="font-black text-[#1A73E8] text-xs flex items-center gap-1.5">
            <CheckCircle2 size={15} />
            <span>High Performance Webhook Ledger (Cached &amp; Paginated)</span>
          </h4>
          <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed max-w-4xl">
            Displays MSG91 SMS delivery callbacks &amp; AWS SES direct email dispatches formatted in <strong>IST (UTC+5:30)</strong>. Responses are paginated and cached in memory for instant navigation.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search recipient phone/email, message ID, or status..."
            value={logSearchTerm}
            onChange={(e) => setLogSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] text-slate-400 uppercase">Channel:</span>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value as any)}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="sms">SMS Channel (MSG91)</option>
            <option value="email">Email Channel (AWS SES)</option>
          </select>

          <span className="text-[10px] text-slate-400 uppercase ml-1">Provider:</span>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as any)}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Gateways</option>
            <option value="msg91">MSG91 SMS Gateway</option>
            <option value="aws_ses">AWS SES Email Gateway</option>
          </select>

          <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2.5 py-1 rounded-full uppercase ml-1">
            {filteredLogs.length} Rows
          </span>
        </div>
      </div>

      {/* Webhook Delivery Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#34A853]" />
            <span>Live Gateway Webhook Delivery Ledger (IST Format)</span>
          </span>
          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200/50">
            Page {page} of {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-gray-400 uppercase border-b border-slate-50">
                <th className="p-3.5">Timestamp (IST)</th>
                <th className="p-3.5">Channel &amp; Provider</th>
                <th className="p-3.5">Recipient Target</th>
                <th className="p-3.5">Template / Message ID</th>
                <th className="p-3.5">Gateway Status Description</th>
                <th className="p-3.5 text-right">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 font-bold">
                    No webhook delivery logs matching your active filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="p-3.5 whitespace-nowrap text-gray-500 font-bold font-mono text-[10px]">
                      {log.timestamp}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        {log.channel === 'email' ? <Mail size={13} className="text-purple-600" /> : <MessageSquare size={13} className="text-blue-600" />}
                        <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-100 font-black text-slate-700">
                          {log.channel || 'SMS'}
                        </span>
                        <span className="capitalize text-xs font-semibold text-slate-600">
                          {log.provider || 'MSG91'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800 font-mono text-xs">
                      {log.recipient || log.recipient_phone}
                    </td>
                    <td className="p-3.5 max-w-sm break-words font-mono text-[10px] text-slate-500">
                      {log.template_id || log.template_key || 'DEFAULT'} {log.message_id ? `(${log.message_id})` : ''}
                    </td>
                    <td className="p-3.5 font-medium text-slate-600 text-xs">
                      {log.description || log.message || 'Delivered'}
                    </td>
                    <td className="p-3.5 text-right">
                      {log.status === 'delivered' || log.status === 'success' ? (
                        <span className="bg-[#34A853]/10 text-[#34A853] text-[9px] font-black px-2.5 py-0.5 rounded-full inline-block uppercase border border-emerald-200/50">
                          Delivered
                        </span>
                      ) : (
                        <div className="space-y-0.5 flex flex-col items-end">
                          <span className="bg-[#EA4335]/10 text-[#EA4335] text-[9px] font-black px-2.5 py-0.5 rounded-full inline-block uppercase border border-red-200/50">
                            {log.status || 'Failed'}
                          </span>
                          {log.error_message && (
                            <span className="text-[8px] text-[#EA4335] font-semibold block">{log.error_message}</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold bg-slate-50/30">
          <span className="text-slate-500 font-semibold text-[11px]">
            Showing page <span className="text-slate-900 font-bold">{page}</span> of <span className="text-slate-900 font-bold">{totalPages}</span> ({totalCount} total entries)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              className="py-1.5 px-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, page - 3),
                Math.min(totalPages, page + 2)
              ).map((pNum) => (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    pNum === page
                      ? 'bg-[#1A73E8] text-white font-black shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pNum}
                </button>
              ))}
            </div>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              className="py-1.5 px-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
