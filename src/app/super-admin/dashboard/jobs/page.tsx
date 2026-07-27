"use client";

import React, { useState } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { JobQueue } from '../../../../components/admin/dashboard/JobQueue';
import { JobDetailModal } from '../../../../components/admin/dashboard/JobDetailModal';

export default function JobsPage() {
  const {
    loading,
    error,
    pendingJobsList,
    handleModerateJob
  } = useSuperAdminDashboard();

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="animate-fade-in max-w-5xl space-y-4">
      <JobQueue 
        loading={loading}
        error={error}
        jobs={pendingJobsList}
        onModerateJob={handleModerateJob}
        onSelectJob={(job) => {
          setSelectedJob(job);
          setIsModalOpen(true);
        }}
      />

      <JobDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        onModerateJob={handleModerateJob}
      />
    </div>
  );
}
