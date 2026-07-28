"use client";

import React, { useState } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { EmployerQueue } from '@/components/admin/dashboard/EmployerQueue';
import { EmployerDetailModal } from '@/components/admin/dashboard/EmployerDetailModal';
import { supabase } from '@/lib/supabaseClient';

export default function EmployersPage() {
  const {
    loading,
    error,
    employersList,
    setEmployersList,
    fetchDashboardData
  } = useSuperAdminDashboard();

  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onToggleSubscription = async (id: string, currentSub: string) => {
    const nextSub = currentSub === 'premium' ? 'free' : 'premium';
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    try {
      if (!isPlaceholder) {
        const { error } = await supabase
          .from('employer_profiles')
          .update({ subscription_status: nextSub })
          .eq('id', id);
        if (error) throw error;
      }
      setEmployersList(prev => prev.map(e => e.id === id ? { ...e, subscription_status: nextSub } : e));
      if (selectedEmp?.id === id) {
        setSelectedEmp((prev: any) => ({ ...prev, subscription_status: nextSub }));
      }
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const onApproveEmployer = async (id: string) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    const empItem = employersList.find((e: any) => e.id === id);
    const userId = empItem?.user_id || id;
    try {
      if (!isPlaceholder) {
        await supabase
          .from('employer_profiles')
          .update({ status: 'approved' })
          .eq('id', id);

        if (userId) {
          await supabase
            .from('profiles')
            .update({ status: 'approved' })
            .eq('id', userId);
        }
      }
      setEmployersList(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e));
      if (selectedEmp?.id === id) {
        setSelectedEmp((prev: any) => ({ ...prev, status: 'approved' }));
      }
      fetchDashboardData();
    } catch (err: any) {
      console.error("Approve employer error:", err.message);
    }
  };

  const onRejectEmployer = async (id: string) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    const empItem = employersList.find((e: any) => e.id === id);
    const userId = empItem?.user_id || id;
    try {
      if (!isPlaceholder) {
        await supabase
          .from('employer_profiles')
          .update({ status: 'rejected' })
          .eq('id', id);

        if (userId) {
          await supabase
            .from('profiles')
            .update({ status: 'rejected' })
            .eq('id', userId);
        }
      }
      setEmployersList(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' } : e));
      if (selectedEmp?.id === id) {
        setSelectedEmp((prev: any) => ({ ...prev, status: 'rejected' }));
      }
      fetchDashboardData();
    } catch (err: any) {
      console.error("Reject employer error:", err.message);
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl space-y-4">
      <EmployerQueue 
        loading={loading}
        error={error}
        employers={employersList}
        onToggleSubscription={onToggleSubscription}
        onApproveEmployer={onApproveEmployer}
        onRejectEmployer={onRejectEmployer}
        onSelectEmployer={(emp) => {
          setSelectedEmp(emp);
          setIsModalOpen(true);
        }}
      />

      <EmployerDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employer={selectedEmp}
        onApproveEmployer={onApproveEmployer}
        onRejectEmployer={onRejectEmployer}
      />
    </div>
  );
}
