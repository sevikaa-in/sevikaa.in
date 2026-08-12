"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkerDashboard } from '../layout';
import { WorkerFunnel } from '@/components/onboarding/WorkerFunnel';

export default function WorkerOnboardingPage() {
  const router = useRouter();
  const { user, workerProfile, setWorkerProfile, showToast, loading } = useEmployerDashboardWrapper();

  const activeUserId = user?.id || workerProfile?.user_id || workerProfile?.id;
  const isAuthenticated = Boolean(activeUserId);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-semibold text-xs">Verifying onboarding session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleComplete = () => {
    showToast('Worker profile setup completed!', 'success');
    setWorkerProfile((prev: any) => ({
      ...prev,
      status: 'pending_review'
    }));
    router.push('/worker/jobs');
  };

  const handleCancel = () => {
    router.push('/worker/profile');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <WorkerFunnel 
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

function useEmployerDashboardWrapper() {
  try {
    return useWorkerDashboard();
  } catch (e) {
    return {
      user: null,
      loading: false,
      workerProfile: null,
      setWorkerProfile: () => {},
      showToast: (msg: string) => console.log(msg)
    };
  }
}
