"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, MessageSquare, Search, Filter, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, Send, User, Calendar, ExternalLink
} from 'lucide-react';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'pending' | 'replied' | 'resolved' | 'archived';
  admin_notes?: string;
  created_at: string;
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.get('/api/admin/enquiries');
      if (data && Array.isArray(data.enquiries)) {
        setEnquiries(data.enquiries);
      } else {
        setEnquiries([]);
      }
    } catch (err) {
      console.warn("Failed to fetch enquiries:", err);
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: Enquiry['status'], notes?: string) => {
    setUpdatingId(id);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      await webApiClient.patch('/api/admin/enquiries', { id, status: newStatus, admin_notes: notes });

      setEnquiries(prev =>
        prev.map(item =>
          item.id === id ? { ...item, status: newStatus, admin_notes: notes ?? item.admin_notes } : item
        )
      );

      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry(prev => prev ? { ...prev, status: newStatus, admin_notes: notes ?? prev.admin_notes } : null);
      }
    } catch (err) {
      console.error("Failed to update enquiry status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredEnquiries = enquiries.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone && item.phone.includes(searchTerm));

    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesSubject = selectedSubject === 'all' || item.subject === selectedSubject;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  const pendingCount = enquiries.filter(e => e.status === 'pending').length;
  const repliedCount = enquiries.filter(e => e.status === 'replied').length;
  const resolvedCount = enquiries.filter(e => e.status === 'resolved').length;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="bg-blue-50 text-[#1A73E8] text-[10px] font-black uppercase px-3 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1.5 mb-2">
            <MessageSquare size={12} /> Support Inbox
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Contact &amp; Support Enquiries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
            Manage incoming enquiries from household employers, domestic workers, and partner RWAs.
          </p>
        </div>

        <button
          onClick={fetchEnquiries}
          disabled={loading}
          className="self-start sm:self-auto py-2.5 px-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-black text-slate-700 transition-all shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Queries</span>
          <p className="text-2xl font-black text-slate-900">{enquiries.length}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-700">Pending Review</span>
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-blue-200/80 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-[#1A73E8]">Replied</span>
          <p className="text-2xl font-black text-[#1A73E8]">{repliedCount}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-700">Resolved</span>
          <p className="text-2xl font-black text-[#34A853]">{resolvedCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email or message..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            {['all', 'pending', 'replied', 'resolved'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8] cursor-pointer"
          >
            <option value="all">All Topics</option>
            <option value="Employer Hiring">Employer Hiring</option>
            <option value="Worker Verification">Worker Verification</option>
            <option value="Billing & Tax Invoice">Billing &amp; Tax Invoice</option>
            <option value="Society Partnership">Society Partnership</option>
            <option value="General Enquiry">General Enquiry</option>
          </select>
        </div>
      </div>

      {/* Enquiries Table / Card List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400">Loading enquiries...</div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <MessageSquare size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-black text-slate-700">No enquiries found</p>
            <p className="text-xs text-slate-400 font-medium">Try clearing your search filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEnquiries.map((item) => (
              <div
                key={item.id}
                className={`p-6 transition-colors hover:bg-slate-50/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  item.status === 'pending' ? 'bg-amber-50/30' : ''
                }`}
              >
                {/* Info block */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-slate-900">{item.name}</span>
                    <span className="text-xs text-slate-500 font-medium">&lt;{item.email}&gt;</span>
                    {item.phone && (
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Phone size={11} /> {item.phone}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1A73E8] border border-blue-100">
                      {item.subject}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar size={11} /> {new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    &ldquo;{item.message}&rdquo;
                  </p>

                  {item.admin_notes && (
                    <p className="text-[11px] text-slate-500 font-semibold italic">
                      Note: {item.admin_notes}
                    </p>
                  )}
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <select
                    value={item.status}
                    disabled={updatingId === item.id}
                    onChange={(e) => handleUpdateStatus(item.id, e.target.value as Enquiry['status'])}
                    className={`py-2 px-3 rounded-2xl text-xs font-black border focus:outline-none cursor-pointer ${
                      item.status === 'pending'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : item.status === 'replied'
                        ? 'bg-blue-50 text-[#1A73E8] border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <option value="pending">⏳ Pending Review</option>
                    <option value="replied">💬 Replied / Contacted</option>
                    <option value="resolved">✅ Resolved</option>
                    <option value="archived">📁 Archived</option>
                  </select>

                  <a
                    href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject)} - Sevikaa Support`}
                    className="p-2 bg-white border border-slate-200 hover:border-[#1A73E8] hover:text-[#1A73E8] rounded-xl text-slate-600 transition-all shadow-xs cursor-pointer"
                    title="Send Email Reply"
                  >
                    <Mail size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
