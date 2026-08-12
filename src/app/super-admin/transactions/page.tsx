"use client";

import React, { useState, useEffect } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { supabase } from '@/lib/supabaseClient';
import { 
  CreditCard, Search, Download, IndianRupee, CheckCircle2, AlertCircle, 
  RefreshCcw, ArrowUpRight, ShieldCheck, Clock, FileText, XCircle, Loader2, PlusCircle
} from 'lucide-react';

interface Transaction {
  id: string;
  orderId: string;
  employerName: string;
  employerPhone: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  status: 'captured' | 'pending' | 'refunded' | 'failed' | string;
  timestamp: string;
}

export default function TransactionsPage() {
  const { showToast } = useSuperAdminDashboard();

  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPagesCount, setTotalPagesCount] = useState<number>(1);

  const fetchLiveTransactions = async (page = currentPage) => {
    setLoading(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.get(`/api/super-admin/transactions?page=${page}&limit=10`);
      if (data && data.success && Array.isArray(data.transactions)) {
        setTransactionsList(data.transactions);
        setTotalCount(data.total || data.transactions.length);
        setTotalPagesCount(data.totalPages || 1);
      }
    } catch (err) {
      console.warn("Error fetching live transactions:", err);
      setTransactionsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTransactions(currentPage);
  }, [currentPage]);

  const filtered = transactionsList.filter(t => {
    const matchesSearch = t.employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.planName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const totalProcessedRevenue = transactionsList
    .filter(t => t.status === 'captured')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleExportITRCSV = () => {
    if (filtered.length === 0) {
      showToast("No transaction records available to export.", "info");
      return;
    }

    const headers = "Invoice Number,Invoice Date,Due Date,Employer Name,Employer Phone,Employer City,Employer State,Employer GSTIN,SAC Code,Plan Name,Base Subtotal (INR),CGST 9% (INR),SGST 9% (INR),IGST 18% (INR),Total Amount (INR),Payment Method,Transaction ID,Status";

    const rows = filtered.map((t, idx) => {
      const invNum = `SV/26-27/${(idx + 1).toString().padStart(4, '0')}`;
      const totalAmt = Number(t.amount || 0);
      const subtotal = Number((totalAmt / 1.18).toFixed(2));
      const totalTax = Number((totalAmt - subtotal).toFixed(2));
      
      const isKarnataka = false;
      const cgst = isKarnataka ? (totalTax / 2).toFixed(2) : '0.00';
      const sgst = isKarnataka ? (totalTax / 2).toFixed(2) : '0.00';
      const igst = !isKarnataka ? totalTax.toFixed(2) : '0.00';

      return `"${invNum}","${t.timestamp}","${t.timestamp}","${t.employerName}","${t.employerPhone}","Kolkata","West Bengal","","998519","${t.planName}",${subtotal},${cgst},${sgst},${igst},${totalAmt},"${t.paymentMethod}","${t.id}","${t.status}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sevikaa_ITR_GST_Sales_Register_FY26-27_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("ITR & GST Sales Register CSV Report exported for CA Tax filing!", "success");
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'captured' || s === 'paid' || s === 'success') {
      return (
        <span className="px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase bg-emerald-50 text-[#34A853] border border-emerald-200/50 flex items-center gap-1">
          <CheckCircle2 size={10} /> Captured
        </span>
      );
    }
    if (s === 'refunded') {
      return (
        <span className="px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200/50 flex items-center gap-1">
          <RefreshCcw size={10} /> Refunded
        </span>
      );
    }
    if (s === 'failed' || s === 'cancelled') {
      return (
        <span className="px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase bg-red-50 text-[#EA4335] border border-red-200/50 flex items-center gap-1">
          <XCircle size={10} /> Failed
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200/50 flex items-center gap-1">
        <Clock size={10} /> Pending
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <CreditCard size={18} className="text-[#1A73E8]" />
            <span>Payments &amp; Revenue Transactions Ledger</span>
            <span className="bg-emerald-50 text-[#34A853] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200/50">
              Live DB Sync
            </span>
          </h3>
          <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
            Audit live employer subscription purchases, contact unlocks, verification add-on fees &amp; refund histories directly from database records.
          </p>
        </div>

        <button
          onClick={handleExportITRCSV}
          disabled={transactionsList.length === 0}
          className="py-2.5 px-4 bg-[#2E7D32] hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          <span>Export ITR & GST Sales Register (.CSV)</span>
        </button>
      </div>

      {/* Financial Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Captured Income</span>
            <span className="text-xl font-black text-[#34A853]">₹{totalProcessedRevenue.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-[#34A853] rounded-xl">
            <IndianRupee size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Successful Orders</span>
            <span className="text-xl font-black text-slate-900">
              {transactionsList.filter(t => t.status === 'captured').length}
            </span>
          </div>
          <div className="p-2.5 bg-blue-50 text-[#1A73E8] rounded-xl">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Refunded Orders</span>
            <span className="text-xl font-black text-purple-700">
              {transactionsList.filter(t => t.status === 'refunded').length}
            </span>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
            <RefreshCcw size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg Order Value</span>
            <span className="text-xl font-black text-slate-900">
              ₹{transactionsList.length > 0 ? Math.round(totalProcessedRevenue / (transactionsList.filter(t => t.status === 'captured').length || 1)) : 0}
            </span>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
            <ArrowUpRight size={18} />
          </div>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Txn ID, Employer name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs font-bold">
          <span className="text-[10px] text-slate-400 uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="captured">Captured (Success)</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>

          <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2.5 py-1 rounded-full uppercase ml-1">
            {filtered.length} Total
          </span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-[#1A73E8]" /> Querying live database transactions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3 shadow-xs">
            <CreditCard size={36} className="mx-auto text-slate-300" />
            <div>
              <h4 className="text-xs font-black text-slate-800">No Live Payment Transactions Found</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                When employers purchase subscriptions, job boosts, or verification add-ons, transactions will appear here live.
              </p>
            </div>
          </div>
        ) : (
          paginated.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">{t.planName}</span>
                  {renderStatusBadge(t.status)}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
                  <span>Employer: <strong className="text-slate-800">{t.employerName}</strong> ({t.employerPhone})</span>
                  <span>&bull; Txn ID: <span className="font-mono text-slate-600">{t.id}</span></span>
                  <span>&bull; Method: <span className="text-slate-700">{t.paymentMethod}</span></span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                <span className={`text-base font-black font-mono ${t.status === 'captured' ? 'text-slate-900' : t.status === 'failed' ? 'text-red-500 line-through' : 'text-purple-700'}`}>
                  ₹{t.amount}
                </span>
                <span className="text-[9.5px] font-medium text-slate-400 flex items-center gap-1">
                  <Clock size={9} /> {t.timestamp}
                </span>
                <a 
                  href={`/invoice/${t.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-[#2E7D32] hover:bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60 transition-all flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <FileText size={10} /> View Tax Invoice
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {filtered.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{startIndex + 1}</strong> to <strong className="text-slate-800">{Math.min(startIndex + itemsPerPage, filtered.length)}</strong> of <strong className="text-slate-800">{filtered.length}</strong> transactions
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
