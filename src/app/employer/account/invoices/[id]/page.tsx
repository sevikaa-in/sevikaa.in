"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useEmployerDashboard } from '../../../layout';
import { generateInvoiceHtml, InvoiceData } from '@/lib/invoiceGenerator';

export default function EmployerInvoiceViewPage() {
  const params = useParams();
  const invoiceId = (params?.id as string) || 'SV-26-27-0001';
  const { employerProfile } = useEmployerDashboard();

  const [invoiceHtml, setInvoiceHtml] = useState<string>('');

  useEffect(() => {
    // Reconstruct or fetch invoice data
    const formattedNum = invoiceId.replace(/-/g, '/');
    const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // Calculate 60 days default expiry
    const expiryDateObj = new Date();
    expiryDateObj.setDate(expiryDateObj.getDate() + 60);
    const expiryStr = expiryDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const sampleData: InvoiceData = {
      invoiceNumber: formattedNum.startsWith('SV') ? formattedNum : `SV/26-27/${invoiceId}`,
      invoiceDate: todayStr,
      dueDate: expiryStr,
      sacCode: '998519',
      paymentStatus: 'Paid',
      paymentMethod: 'Online Payment (Razorpay / UPI)',
      transactionId: `pay_${Date.now().toString(36)}`,
      buyerName: employerProfile?.company_name || employerProfile?.name || 'Sharama House',
      buyerEmail: employerProfile?.email || 'employer@sevikaa.in',
      buyerPhone: employerProfile?.phone || '7319127627',
      buyerAddress: employerProfile?.address || employerProfile?.billing_address || 'Flat B-402, Tower 4',
      buyerSociety: employerProfile?.society_name || 'DLF Westend Heights',
      buyerCity: employerProfile?.city || 'Kolkata',
      buyerState: employerProfile?.state || 'West Bengal',
      buyerPincode: employerProfile?.pincode || '700001',
      buyerGstin: employerProfile?.gstin || '',
      planName: employerProfile?.subscription_status === 'pro' ? 'Sevikaa Pro Hiring Plan' : 'Sevikaa Standard Hiring Plan',
      duration: '60 Days',
      totalAmount: 699.00
    };

    const html = generateInvoiceHtml(sampleData);
    setInvoiceHtml(html);
  }, [invoiceId, employerProfile]);

  return (
    <div 
      className="min-h-screen bg-slate-100" 
      dangerouslySetInnerHTML={{ __html: invoiceHtml }} 
    />
  );
}
