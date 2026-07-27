"use client";

import React, { useState } from 'react';
import { useAdminDashboard } from '../layout';
import { JobQueue } from '../../../../components/admin/dashboard/JobQueue';
import { JobDetailModal } from '../../../../components/admin/dashboard/JobDetailModal';

export default function JobsPage() {
  const {
    loading,
    error,
    pendingJobsList,
    handleModerateJob
  } = useAdminDashboard();

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="animate-fade-in max-w-4xl space-y-4">
      <JobQueue 
        loading={loading}
        error={error}
        jobs={pendingJobsList}
        onModerateJob={handleModerateJob}
        onSelectJob={(job, feedback = false) => {
          setSelectedJob(job);
          setShowFeedback(feedback);
          setIsModalOpen(true);
        }}
      />

      <JobDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        onModerateJob={handleModerateJob}
        initialShowFeedback={showFeedback}
      />
    </div>
  );
}
