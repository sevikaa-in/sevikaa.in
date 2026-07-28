"use client";

import React, { useState } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { ReviewQueue } from '@/components/admin/dashboard/ReviewQueue';
import { ReviewDetailModal } from '@/components/admin/dashboard/ReviewDetailModal';

export default function ReviewsPage() {
  const {
    loading,
    error,
    pendingReviewsList,
    handleModerateReview
  } = useSuperAdminDashboard();

  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="animate-fade-in max-w-5xl space-y-4">
      <ReviewQueue 
        loading={loading}
        error={error}
        reviews={pendingReviewsList}
        onModerateReview={handleModerateReview}
        onSelectReview={(rev) => {
          setSelectedReview(rev);
          setIsModalOpen(true);
        }}
      />

      <ReviewDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        review={selectedReview}
        onModerateReview={handleModerateReview}
      />
    </div>
  );
}
