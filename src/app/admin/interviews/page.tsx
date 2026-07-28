"use client";

import React, { useState } from 'react';
import { useAdminDashboard } from '../layout';
import { InterviewQueue } from '@/components/admin/dashboard/InterviewQueue';
import { InterviewDetailModal } from '@/components/admin/dashboard/InterviewDetailModal';

export default function InterviewsPage() {
  const {
    loading,
    error,
    interviewsList,
    handleLogInterviewResult
  } = useAdminDashboard();

  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="animate-fade-in max-w-4xl space-y-4">
      <InterviewQueue 
        loading={loading}
        error={error}
        interviews={interviewsList}
        onLogResult={handleLogInterviewResult}
        onSelectInterview={(item) => {
          setSelectedInterview(item);
          setIsModalOpen(true);
        }}
      />

      <InterviewDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        interview={selectedInterview}
        onLogResult={handleLogInterviewResult}
      />
    </div>
  );
}
