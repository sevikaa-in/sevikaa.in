"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { generateInvoiceHtml, InvoiceData } from '@/lib/invoiceGenerator';

export default function StandaloneInvoiceViewPage() {
  const params = useParams();
  const rawId = (params?.id as string) || 'pay_RZP1009814';
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      setLoading(true);
      try {
        const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
        // Query live transaction from API
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

        const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const expiryDateObj = new Date();
        expiryDateObj.setDate(expiryDateObj.getDate() + 60);
        const expiryStr = expiryDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        // Authentic Invoice Number (e.g. SV/26-27/0003)
        const invoiceNum = matchedTxn?.invoiceNumber || (
          cleanId.startsWith('SV') ? cleanId.replace(/-/g, '/') : `SV/26-27/0003`
        );

        const sampleData: InvoiceData = {
          invoiceNumber: invoiceNum,
          invoiceDate: matchedTxn?.timestamp || todayStr,
          dueDate: expiryStr,
          sacCode: '998519',
          paymentStatus: 'Paid',
          paymentMethod: matchedTxn?.paymentMethod || 'Online Payment',
          transactionId: matchedTxn?.id || cleanId,
          buyerName: matchedTxn?.employerName || 'Verma Residency',
          buyerEmail: matchedTxn?.employerEmail || 'employer@sevikaa.in',
          buyerPhone: matchedTxn?.employerPhone || '+91 98765 43212',
          buyerAddress: 'Residential Unit Requisition',
          buyerSociety: matchedTxn?.societyName || 'DLF Westend Heights',
          buyerCity: 'Bangalore',
          buyerState: 'Karnataka',
          buyerPincode: '560068',
          buyerGstin: '',
          planName: matchedTxn?.planName || 'Job Posting Requisition',
          duration: '60 Days',
          totalAmount: matchedTxn?.amount || 199.00
        };

        const html = generateInvoiceHtml(sampleData);
        setInvoiceHtml(html);
      } catch (err) {
        console.error("Error generating standalone invoice:", err);
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

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#1E293B] print:bg-white print:p-0">
      <div dangerouslySetInnerHTML={{ __html: invoiceHtml }} />
    </div>
  );
}
