"use client";

import React, { useState } from 'react';
import { useAdminDashboard } from '../layout';
import { DisputesQueue } from '../../../../components/admin/dashboard/DisputesQueue';
import { DisputeDetailModal } from '../../../../components/admin/dashboard/DisputeDetailModal';

export default function DisputesPage() {
  const {
    loading,
    error,
    disputesList,
    handleResolveDispute
  } = useAdminDashboard();

  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="animate-fade-in max-w-4xl space-y-4">
      <DisputesQueue 
        loading={loading}
        error={error}
        disputes={disputesList}
        onResolveDispute={handleResolveDispute}
        onSelectDispute={(dispute) => {
          setSelectedDispute(dispute);
          setIsModalOpen(true);
        }}
      />

      <DisputeDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dispute={selectedDispute}
        onResolveDispute={handleResolveDispute}
      />
    </div>
  );
}
