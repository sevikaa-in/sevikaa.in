"use client";

import React, { useState } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { 
  CreditCard, Search, Download, DollarSign, CheckCircle2, AlertCircle, 
  RefreshCcw, ArrowUpRight, ShieldCheck, Clock, FileText
} from 'lucide-react';

interface Transaction {
  id: string;
  orderId: string;
  employerName: string;
  employerPhone: string;
  planName: string;
  amount: number;
  paymentMethod: 'UPI / GPay' | 'Razorpay Netbanking' | 'Credit Card' | 'Debit Card';
  status: 'captured' | 'pending' | 'refunded';
  timestamp: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'pay_N8912491',
    orderId: 'order_M90124',
    employerName: 'Ria Bhagat',
    employerPhone: '+91 9876543210',
    planName: 'Standard Plan (60 Days)',
    amount: 699,
    paymentMethod: 'UPI / GPay',
    status: 'captured',
    timestamp: '2026-07-27 13:10:00'
  },
  {
    id: 'pay_N8912492',
    orderId: 'order_M90125',
    employerName: 'Janhvi Diwan',
    employerPhone: '+91 9812345678',
    planName: 'Aadhaar Verification Add-on',
    amount: 199,
    paymentMethod: 'Razorpay Netbanking',
    status: 'captured',
    timestamp: '2026-07-27 12:35:12'
  },
  {
    id: 'pay_N8912493',
    orderId: 'order_M90126',
    employerName: 'Lakhan Lal Sah',
    employerPhone: '+91 9988776655',
    planName: 'Basic Plan (30 Days)',
    amount: 299,
    paymentMethod: 'Credit Card',
    status: 'captured',
    timestamp: '2026-07-27 11:20:45'
  },
  {
    id: 'pay_N8912494',
    orderId: 'order_M90127',
    employerName: 'Sunita Sharma',
    employerPhone: '+91 9765432109',
    planName: 'Pro Enterprise Plan (90 Days)',
    amount: 1499,
    paymentMethod: 'UPI / GPay',
    status: 'captured',
    timestamp: '2026-07-27 09:40:00'
  },
  {
    id: 'pay_N8912495',
    orderId: 'order_M90128',
    employerName: 'Alok Goel',
    employerPhone: '+91 9845012345',
    planName: 'Featured Job Listing Boost',
    amount: 99,
    paymentMethod: 'Debit Card',
    status: 'refunded',
    timestamp: '2026-07-26 18:15:30'
  },
  {
    id: 'pay_N8912496',
    orderId: 'order_M90129',
    employerName: 'Rajesh Mehta',
    employerPhone: '+91 9820011223',
    planName: 'Standard Plan (60 Days)',
    amount: 699,
    paymentMethod: 'UPI / GPay',
    status: 'captured',
    timestamp: '2026-07-26 15:50:10'
  }
];

export default function TransactionsPage() {
  const { showToast } = useSuperAdminDashboard();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filtered = MOCK_TRANSACTIONS.filter(t => {
    const matchesSearch = t.employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.planName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const totalProcessedRevenue = MOCK_TRANSACTIONS
    .filter(t => t.status === 'captured')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Transaction ID,Order ID,Employer,Plan,Amount (INR),Payment Method,Status,Timestamp"]
        .concat(filtered.map(t => `${t.id},${t.orderId},"${t.employerName}","${t.planName}",${t.amount},${t.paymentMethod},${t.status},${t.timestamp}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sevikaa_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("Transactions CSV ledger exported successfully!", "success");
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
              Razorpay Sync
            </span>
          </h3>
          <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
            Audit employer subscription purchases, contact unlocks, verification add-on fees &amp; refund histories.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Download size={14} />
          <span>Export Ledger CSV</span>
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
            <DollarSign size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Successful Orders</span>
            <span className="text-xl font-black text-slate-900">
              {MOCK_TRANSACTIONS.filter(t => t.status === 'captured').length}
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
              {MOCK_TRANSACTIONS.filter(t => t.status === 'refunded').length}
            </span>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
            <RefreshCcw size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg Order Value</span>
            <span className="text-xl font-black text-slate-900">₹580</span>
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
          </select>

          <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2.5 py-1 rounded-full uppercase ml-1">
            {filtered.length} Total
          </span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-xs text-slate-400 font-bold">
            No transactions found matching your search.
          </div>
        ) : (
          paginated.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">{t.planName}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                    t.status === 'captured' 
                      ? 'bg-emerald-50 text-[#34A853] border border-emerald-200/50' 
                      : t.status === 'refunded'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200/50'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                  }`}>
                    {t.status === 'captured' ? 'Captured' : t.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
                  <span>Employer: <strong className="text-slate-800">{t.employerName}</strong> ({t.employerPhone})</span>
                  <span>&bull; Txn ID: <span className="font-mono text-slate-600">{t.id}</span></span>
                  <span>&bull; Method: <span className="text-slate-700">{t.paymentMethod}</span></span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                <span className="text-base font-black text-slate-900 font-mono">₹{t.amount}</span>
                <span className="text-[9.5px] font-medium text-slate-400 flex items-center gap-1">
                  <Clock size={9} /> {t.timestamp}
                </span>
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
