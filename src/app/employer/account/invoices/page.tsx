"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useEmployerDashboard } from '../../layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  FileText, ArrowLeft, Download, Eye, CheckCircle2, ShieldCheck, 
  CreditCard, Calendar, IndianRupee, Printer, Sparkles, Filter, ExternalLink
} from 'lucide-react';

export default function EmployerInvoicesListPage() {
  const { employerProfile } = useEmployerDashboard();
  const { t } = useLanguage();

  const [invoices] = useState([
    {
      id: 'SV-26-27-0001',
      invoiceNumber: 'SV/26-27/0001',
      planName: 'Sevikaa Pro Employer Hiring Subscription',
      date: '09 Aug 2026',
      dueDate: '08 Oct 2026',
      sacCode: '998519',
      status: 'Paid',
      paymentMethod: 'Online Payment (Razorpay UPI)',
      transactionId: 'pay_N8xK29vL1mP',
      amount: 699.00,
      gstAmount: 106.62,
      netAmount: 592.38
    },
    {
      id: 'SV-25-26-0042',
      invoiceNumber: 'SV/25-26/0042',
      planName: 'Sevikaa Standard 30-Day Hiring Pass',
      date: '10 Jun 2026',
      dueDate: '10 Jul 2026',
      sacCode: '998519',
      status: 'Paid',
      paymentMethod: 'NetBanking / Debit Card',
      transactionId: 'pay_M7yJ18uK0nO',
      amount: 699.00,
      gstAmount: 106.62,
      netAmount: 592.38
    }
  ]);

  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  const handleInvoiceClick = (invId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // On Mobile Web: Trigger direct file download
      const link = document.createElement('a');
      link.href = `/employer/account/invoices/${invId}`;
      link.download = `Sevikaa_Invoice_${invId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // On PC / Laptop: Open in a new browser tab for rich print preview
      window.open(`/employer/account/invoices/${invId}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-24 mx-auto">
      
      {/* Back Link */}
      <div>
        <Link 
          href="/employer/account" 
          className="inline-flex items-center gap-2 text-xs font-black text-[#1A73E8] hover:underline bg-blue-50/80 px-3.5 py-2 rounded-xl border border-blue-200/80 transition-all active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>Back to Employer Account Settings</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#1A73E8] text-white rounded-2xl shadow-xs shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tax Invoices &amp; Payment Receipts History
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
              View all past subscription payments, download official GST Tax Invoice receipts &amp; track Razorpay transaction IDs.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Amount Spent</span>
          <span className="text-xl font-black text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}.00</span>
          <span className="text-[11px] font-bold text-slate-500 block pt-0.5">Incl. 18% GST Credit</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Issued Invoices</span>
          <span className="text-xl font-black text-slate-900">{invoices.length} Tax Invoices</span>
          <span className="text-[11px] font-bold text-blue-600 block pt-0.5">SAC Code 998519</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">GST Tax Compliance</span>
          <span className="text-xl font-black text-blue-600 flex items-center gap-1.5">
            <ShieldCheck size={20} className="text-[#1A73E8]" />
            100% Compliant
          </span>
          <span className="text-[11px] font-bold text-slate-500 block pt-0.5">Input Tax Credit Eligible</span>
        </div>

      </div>

      {/* Invoices List Container */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Payment Receipts &amp; Invoices</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black rounded-full">
              {invoices.length}
            </span>
          </h3>
          <span className="text-xs text-slate-500 font-bold">Billed to: {employerProfile?.company_name || employerProfile?.name || 'Household Employer'}</span>
        </div>

        <div className="space-y-4">
          {invoices.map((inv) => (
            <div 
              key={inv.id}
              className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4 hover:border-blue-300 transition-all"
            >
              
              {/* Top Row: Invoice Number, Status, Amount */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 font-mono">{inv.invoiceNumber}</span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full border border-emerald-200">
                      {inv.status} 🟢
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-[#1A73E8] pt-1">{inv.planName}</h4>
                </div>

                <div className="sm:text-right">
                  <span className="text-lg font-black text-emerald-700 block">₹{inv.amount.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500 font-semibold block">Net ₹{inv.netAmount.toFixed(2)} + GST ₹{inv.gstAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Meta Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-xs font-semibold text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Invoice Date</span>
                  <span>{inv.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">SAC Code</span>
                  <span>{inv.sacCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Payment Method</span>
                  <span>{inv.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Transaction ID</span>
                  <span className="font-mono text-[11px] text-slate-700">{inv.transactionId}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={(e) => handleInvoiceClick(inv.id, e)}
                  className="px-4 py-2 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Eye size={14} />
                  <span>View / Download Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.open(`/employer/account/invoices/${inv.id}`, '_blank')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
