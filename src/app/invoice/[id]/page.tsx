"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { generateInvoiceHtml, InvoiceData } from '@/lib/invoiceGenerator';

export default function StandaloneInvoiceViewPage() {
  const params = useParams();
  const rawId = (params?.id as string) || '';
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      setLoading(true);
      setError(null);

      if (!rawId) {
        setError('Invoice ID is required.');
        setLoading(false);
        return;
      }

      try {
        const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
        const { webApiClient } = await import('@/lib/webApiClient');
        const data = await webApiClient.get(`/api/super-admin/transactions?page=1&limit=100`);
        
        let matchedTxn: any = null;
        if (data && data.success && Array.isArray(data.transactions)) {
          matchedTxn = data.transactions.find((t: any) => 
            t.id === cleanId || 
            t.invoiceNumber === cleanId ||
            t.invoiceNumber?.replace(/\//g, '-') === cleanId ||
            cleanId.includes(t.id)
          );
        }

        if (!matchedTxn) {
          setError(`Invoice record not found for transaction ID "${cleanId}".`);
          setLoading(false);
          return;
        }

        const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const expiryDateObj = new Date();
        expiryDateObj.setDate(expiryDateObj.getDate() + 60);
        const expiryStr = expiryDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        const invoiceNum = matchedTxn.invoiceNumber || (
          cleanId.startsWith('SV') ? cleanId.replace(/-/g, '/') : cleanId
        );

        const realInvoiceData: InvoiceData = {
          invoiceNumber: invoiceNum,
          invoiceDate: matchedTxn.timestamp || todayStr,
          dueDate: expiryStr,
          sacCode: '998519',
          paymentStatus: (matchedTxn.status || 'captured').toUpperCase() === 'CAPTURED' ? 'Paid' : matchedTxn.status,
          paymentMethod: matchedTxn.paymentMethod || 'Online Payment',
          transactionId: matchedTxn.id,
          buyerName: matchedTxn.employerName || 'Employer Requisition',
          buyerEmail: matchedTxn.employerEmail || 'N/A',
          buyerPhone: matchedTxn.employerPhone || 'N/A',
          buyerAddress: 'Registered Unit Requisition',
          buyerSociety: matchedTxn.societyName || 'N/A',
          buyerCity: 'India',
          buyerState: 'IN',
          buyerPincode: '',
          buyerGstin: '',
          planName: matchedTxn.planName || 'Subscription Plan',
          duration: '60 Days',
          totalAmount: parseFloat(matchedTxn.amount || 0)
        };

        const html = generateInvoiceHtml(realInvoiceData);
        setInvoiceHtml(html);
      } catch (err: any) {
        console.error("Error fetching invoice transaction:", err);
        setError(err.message || 'Failed to load transaction invoice.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [rawId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-bold gap-2">
        <div className="w-6 h-6 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
        <span>Generating Tax Invoice PDF...</span>
      </div>
    );
  }

  if (error || !invoiceHtml) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full text-center shadow-xl">
          <h2 className="text-base font-semibold text-rose-400 mb-2">Invoice Not Found</h2>
          <p className="text-xs text-slate-300 mb-4">{error || 'No valid transaction record matched the requested invoice ID.'}</p>
          <a
            href="/employer/account/invoices"
            className="inline-block px-4 py-2 bg-[#1A73E8] text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return to Invoices
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#1E293B] print:bg-white print:p-0">
      <div dangerouslySetInnerHTML={{ __html: invoiceHtml }} />
    </div>
  );
}
