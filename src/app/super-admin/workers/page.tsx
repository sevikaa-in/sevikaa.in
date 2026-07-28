"use client";

import React, { useState } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { WorkerQueue } from '@/components/admin/dashboard/WorkerQueue';
import { WorkerDetailModal } from '@/components/admin/dashboard/WorkerDetailModal';

export default function WorkersPage() {
  const {
    loading,
    error,
    workersList,
    selectedWorker,
    setSelectedWorker,
    handleUpdateWorkerStatus,
    handleUpdateBadge
  } = useSuperAdminDashboard();

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-4 animate-fade-in max-w-5xl">
      <WorkerQueue 
        loading={loading}
        error={error}
        workers={workersList}
        selectedWorkerId={selectedWorker?.id || ''}
        onSelectWorker={(worker) => {
          setSelectedWorker(worker);
          setIsModalOpen(true);
        }}
        onUpdateStatus={handleUpdateWorkerStatus}
      />

      <WorkerDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        worker={selectedWorker}
        onUpdateStatus={handleUpdateWorkerStatus}
        onUpdateBadge={handleUpdateBadge}
      />
    </div>
  );
}
