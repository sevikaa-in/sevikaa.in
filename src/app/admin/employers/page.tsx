"use client";

import React, { useState } from 'react';
import { useAdminDashboard } from '../layout';
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
  } = useAdminDashboard();

  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onApproveEmployer = async (id: string) => {
    const previousState = [...employersList];
    const previousSelected = selectedEmp;
    setEmployersList(prev => prev.map(e => (e.id === id || e.user_id === id) ? { ...e, status: 'live', is_approved: true } : e));
    if (selectedEmp?.id === id || selectedEmp?.user_id === id) {
      setSelectedEmp((prev: any) => ({ ...prev, status: 'live', is_approved: true }));
    }

    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/admin/employer/update', { id, is_approved: true, status: 'live' });
      if (!data || data.error) throw new Error('Server update failed');
      fetchDashboardData();
    } catch (err: any) {
      setEmployersList(previousState);
      setSelectedEmp(previousSelected);
      alert("⚠️ Network/Database Notice: Failed to approve employer profile on server. State restored.");
    }
  };

  const onRejectEmployer = async (id: string) => {
    const previousState = [...employersList];
    const previousSelected = selectedEmp;
    setEmployersList(prev => prev.map(e => (e.id === id || e.user_id === id) ? { ...e, status: 'rejected', is_approved: false } : e));
    if (selectedEmp?.id === id || selectedEmp?.user_id === id) {
      setSelectedEmp((prev: any) => ({ ...prev, status: 'rejected', is_approved: false }));
    }

    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/admin/employer/update', { id, is_approved: false, status: 'rejected' });
      if (!data || data.error) throw new Error('Server update failed');
      fetchDashboardData();
    } catch (err: any) {
      setEmployersList(previousState);
      setSelectedEmp(previousSelected);
      alert("⚠️ Network/Database Notice: Failed to reject employer profile on server. State restored.");
    }
  };

  const onUnapproveEmployer = async (id: string) => {
    const previousState = [...employersList];
    const previousSelected = selectedEmp;
    setEmployersList(prev => prev.map(e => (e.id === id || e.user_id === id) ? { ...e, status: 'pending_review', is_approved: false } : e));
    if (selectedEmp?.id === id || selectedEmp?.user_id === id) {
      setSelectedEmp((prev: any) => ({ ...prev, status: 'pending_review', is_approved: false }));
    }

    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/admin/employer/update', { id, is_approved: false, status: 'pending_review' });
      if (!data || data.error) throw new Error('Server update failed');
      fetchDashboardData();
    } catch (err: any) {
      setEmployersList(previousState);
      setSelectedEmp(previousSelected);
      alert("⚠️ Network/Database Notice: Failed to unapprove employer profile on server. State restored.");
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl space-y-4">
      <EmployerQueue 
        loading={loading}
        error={error}
        employers={employersList}
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
        onUnapproveEmployer={onUnapproveEmployer}
      />
    </div>
  );
}
