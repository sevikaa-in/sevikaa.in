"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InterviewsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/tele-onboarding');
  }, [router]);

  return (
    <div className="p-12 text-center text-xs font-semibold text-slate-500">
      Redirecting to Telephonic Onboarding &amp; Scheduled Tele-Interviews Hub...
    </div>
  );
}
