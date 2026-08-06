import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { logAuditAction } from '@/lib/auditLogger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      reviewer_id, 
      reviewer_name, 
      reviewer_role, 
      reviewee_id, 
      reviewee_name, 
      reviewee_role, 
      interaction_type, // 'interview_impression' | 'worked_together'
      rating, 
      comment, 
      categories,
      interview_id
    } = body;

    if (!reviewer_id || !reviewee_id || !rating) {
      return NextResponse.json({ error: 'Missing required review fields' }, { status: 400 });
    }

    const stageType = interaction_type || 'interview_impression';

    // Ensure public.reviews table exists with interaction_type column
    await queryDb(`
      CREATE TABLE IF NOT EXISTS public.reviews (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        author_id text,
        author_name text,
        worker_id text,
        employer_id text,
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

    await queryDb(`ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS interaction_type text DEFAULT 'interview_impression';`).catch(() => {});
    await queryDb(`ALTER TABLE public.reviews ALTER COLUMN author_id DROP NOT NULL;`).catch(() => {});
    await queryDb(`ALTER TABLE public.reviews ALTER COLUMN worker_id DROP NOT NULL;`).catch(() => {});
    await queryDb(`ALTER TABLE public.reviews ALTER COLUMN employer_id DROP NOT NULL;`).catch(() => {});

    const res = await queryDb(`
      INSERT INTO public.reviews (
        author_id, author_name, worker_id, employer_id,
        interview_id, reviewer_id, reviewer_name, reviewer_role, 
        reviewee_id, reviewee_name, reviewee_role, interaction_type, rating, categories, comment, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', NOW())
      RETURNING *;
    `, [
      String(reviewer_id),
      String(reviewer_name || 'Anonymous User'),
      String(reviewer_role === 'worker' ? reviewer_id : reviewee_id),
      String(reviewer_role === 'employer' ? reviewer_id : reviewee_id),
      interview_id ? String(interview_id) : null,
      String(reviewer_id),
      String(reviewer_name || 'Anonymous User'),
      String(reviewer_role || 'employer'),
      String(reviewee_id),
      String(reviewee_name || 'Target User'),
      String(reviewee_role || 'worker'),
      stageType,
      parseInt(rating, 10) || 5,
      JSON.stringify(categories || {}),
      String(comment || ''),
    ]);

    const review = res?.rows?.[0];

    // Audit log entry
    logAuditAction({
      action: `Review Submitted (${stageType === 'worked_together' ? 'Worked Together' : 'Interview Call'})`,
      category: 'user_activity',
      severity: 'info',
      actor: reviewer_name,
      actorRole: reviewer_role === 'employer' ? 'Employer' : 'Worker',
      target_name: reviewee_name,
      target_id: String(reviewee_id),
      changes_summary: `${reviewer_name} (${reviewer_role}) submitted a ${rating}-star ${stageType === 'worked_together' ? 'Workplace' : 'Call Impression'} review for ${reviewee_name}. Pending Super Admin moderation.`,
      raw_payload: body
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your feedback has been submitted and is pending moderator review.',
      review
    });
  } catch (err: any) {
    console.error("POST /api/reviews/submit error:", err);
    return NextResponse.json({ error: err.message || 'Failed to submit review' }, { status: 500 });
  }
}
