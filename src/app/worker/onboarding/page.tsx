"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useWorkerDashboard } from '../layout';
import { WorkerFunnel } from '@/components/onboarding/WorkerFunnel';

export default function WorkerOnboardingPage() {
  const router = useRouter();
  const { user, workerProfile, setWorkerProfile, showToast } = useEmployerDashboardWrapper();

  const activeUserId = user?.id || workerProfile?.user_id || 'worker_guest';

  const handleComplete = () => {
    showToast('Worker profile setup & selfie capture completed!', 'success');
    setWorkerProfile((prev: any) => ({
      ...prev,
      status: 'pending_verification'
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
          userId={activeUserId}
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
      workerProfile: null,
      setWorkerProfile: () => {},
      showToast: (msg: string) => console.log(msg)
    };
  }
}
