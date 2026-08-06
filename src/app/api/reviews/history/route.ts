import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { formatIstTimestamp } from '@/lib/auditLogger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role') || 'employer';

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // Ensure public.reviews table exists
    await queryDb(`
      CREATE TABLE IF NOT EXISTS public.reviews (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        interview_id text,
        reviewer_id text,
        reviewer_name text,
        reviewer_role text,
        reviewee_id text,
        reviewee_name text,
        reviewee_role text,
        interaction_type text DEFAULT 'interview_impression',
        rating integer DEFAULT 5,
        categories jsonb DEFAULT '{}'::jsonb,
        comment text,
        status text DEFAULT 'pending',
        created_at timestamptz DEFAULT NOW()
      );
    `).catch(() => {});

    // Fetch reviews given by this user
    const givenRes = await queryDb(
      `SELECT * FROM public.reviews WHERE reviewer_id = $1 ORDER BY created_at DESC;`,
      [userId]
    );

    const reviewsGiven = (givenRes?.rows || []).map((r) => ({
      id: r.id,
      reviewee_id: r.reviewee_id,
      reviewee_name: r.reviewee_name,
      reviewee_role: r.reviewee_role,
      interaction_type: r.interaction_type || 'interview_impression',
      rating: r.rating || 5,
      comment: r.comment || '',
      status: r.status || 'pending',
      timestamp: formatIstTimestamp(r.created_at)
    }));

    // Fetch reviews received by this user
    const recRes = await queryDb(
      `SELECT * FROM public.reviews WHERE reviewee_id = $1 AND status = 'approved' ORDER BY created_at DESC;`,
      [userId]
    );

    const reviewsReceived = (recRes?.rows || []).map((r) => ({
      id: r.id,
      reviewer_name: r.reviewer_name,
      reviewer_role: r.reviewer_role,
      interaction_type: r.interaction_type || 'interview_impression',
      rating: r.rating || 5,
      comment: r.comment || '',
      timestamp: formatIstTimestamp(r.created_at)
    }));

    // -------------------------------------------------------
    // Build "Past Interacted People" list (no mock fallback)
    // Sources: interview_schedules + applications + reviews given
    // -------------------------------------------------------
    const interactedMap: Record<string, {
      id: string;
      name: string;
      role: 'worker' | 'employer';
      jobCategory: string;
      lastInteractionDate: string;
      interactionType: 'interview_call' | 'worked_together';
      hasReviewed: boolean;
    }> = {};

    // Mark everyone already reviewed
    const reviewedIds = new Set((givenRes?.rows || []).map((r: any) => r.reviewee_id));

    // Source 1: interview_schedules (employer side)
    if (role === 'employer') {
      const intRes = await queryDb(
        `SELECT DISTINCT ON (worker_id) worker_id, worker_name, interview_slot, interview_type, category
         FROM public.interview_schedules
         WHERE employer_id = $1
         ORDER BY worker_id, interview_slot DESC NULLS LAST;`,
        [userId]
      ).catch(() => null);

      for (const row of (intRes?.rows || [])) {
        if (!row.worker_id) continue;
        interactedMap[row.worker_id] = {
          id: row.worker_id,
          name: row.worker_name || 'Worker',
          role: 'worker',
          jobCategory: row.category || 'Domestic Worker',
          lastInteractionDate: row.interview_slot ? formatIstTimestamp(row.interview_slot) : 'Scheduled',
          interactionType: 'interview_call',
          hasReviewed: reviewedIds.has(row.worker_id)
        };
      }
    }

    // Source 2: applications (employer side — workers who applied to employer's jobs)
    if (role === 'employer') {
      const appRes = await queryDb(
        `SELECT DISTINCT ON (a.worker_id) a.worker_id, wp.full_name AS worker_name, j.title AS job_title, a.created_at
         FROM public.applications a
         LEFT JOIN public.worker_profiles wp ON wp.user_id = a.worker_id
         LEFT JOIN public.jobs j ON j.id = a.job_id
         WHERE j.employer_id = $1
         ORDER BY a.worker_id, a.created_at DESC;`,
        [userId]
      ).catch(() => null);

      for (const row of (appRes?.rows || [])) {
        if (!row.worker_id) continue;
        if (!interactedMap[row.worker_id]) {
          interactedMap[row.worker_id] = {
            id: row.worker_id,
            name: row.worker_name || 'Worker',
            role: 'worker',
            jobCategory: row.job_title || 'Job Application',
            lastInteractionDate: row.created_at ? formatIstTimestamp(row.created_at) : 'Applied recently',
            interactionType: 'interview_call',
            hasReviewed: reviewedIds.has(row.worker_id)
          };
        }
      }
    }

    // Source 3: worker side — employers they applied to / interviewed with
    if (role === 'worker') {
      const wAppRes = await queryDb(
        `SELECT DISTINCT ON (j.employer_id) j.employer_id, ep.company_name AS employer_name, j.title AS job_title, a.created_at
         FROM public.applications a
         LEFT JOIN public.jobs j ON j.id = a.job_id
         LEFT JOIN public.employer_profiles ep ON ep.user_id = j.employer_id
         WHERE a.worker_id = $1
         ORDER BY j.employer_id, a.created_at DESC;`,
        [userId]
      ).catch(() => null);

      for (const row of (wAppRes?.rows || [])) {
        if (!row.employer_id) continue;
        interactedMap[row.employer_id] = {
          id: row.employer_id,
          name: row.employer_name || 'Employer Household',
          role: 'employer',
          jobCategory: row.job_title || 'Job Requisition',
          lastInteractionDate: row.created_at ? formatIstTimestamp(row.created_at) : 'Applied recently',
          interactionType: 'interview_call',
          hasReviewed: reviewedIds.has(row.employer_id)
        };
      }

      // Worker interview schedules
      const wIntRes = await queryDb(
        `SELECT DISTINCT ON (employer_id) employer_id, employer_name, interview_slot, category
         FROM public.interview_schedules
         WHERE worker_id = $1
         ORDER BY employer_id, interview_slot DESC NULLS LAST;`,
        [userId]
      ).catch(() => null);

      for (const row of (wIntRes?.rows || [])) {
        if (!row.employer_id) continue;
        if (!interactedMap[row.employer_id]) {
          interactedMap[row.employer_id] = {
            id: row.employer_id,
            name: row.employer_name || 'Employer Household',
            role: 'employer',
            jobCategory: row.category || 'Interview',
            lastInteractionDate: row.interview_slot ? formatIstTimestamp(row.interview_slot) : 'Scheduled',
            interactionType: 'interview_call',
            hasReviewed: reviewedIds.has(row.employer_id)
          };
        }
      }
    }

    // Source 4: People we've already written reviews for (in case not in schedules/apps)
    for (const r of (givenRes?.rows || [])) {
      if (!interactedMap[r.reviewee_id]) {
        interactedMap[r.reviewee_id] = {
          id: r.reviewee_id,
          name: r.reviewee_name || 'Person',
          role: r.reviewee_role as 'worker' | 'employer',
          jobCategory: r.interaction_type === 'worked_together' ? 'Worked Together' : 'Interview / Call',
          lastInteractionDate: formatIstTimestamp(r.created_at),
          interactionType: r.interaction_type === 'worked_together' ? 'worked_together' : 'interview_call',
          hasReviewed: true
        };
      }
    }

    const interactedPeople = Object.values(interactedMap);

    return NextResponse.json({
      success: true,
      reviewsGiven,
      reviewsReceived,
      interactedPeople
    });
  } catch (err: any) {
    console.error("GET /api/reviews/history error:", err);
    return NextResponse.json({
      success: false,
      error: err.message,
      reviewsGiven: [],
      reviewsReceived: [],
      interactedPeople: []
    }, { status: 500 });
  }
}
