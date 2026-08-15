import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import { logAuditAction } from '@/lib/auditLogger';
import crypto from 'crypto';

import { getServerEnv } from '@/lib/env';

const env = getServerEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  let token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    const sbCookie = Array.from(request.cookies.getAll()).find(c =>
      c.name.includes('auth-token') || c.name.includes('access-token') || c.name.endsWith('-auth-token')
    );
    if (sbCookie?.value) {
      try {
        const parsed = JSON.parse(sbCookie.value);
        token = parsed.access_token || (Array.isArray(parsed) ? parsed[0] : null) || sbCookie.value;
      } catch { token = sbCookie.value; }
    }
  }

  if (!token) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: { user } } = await supabase.auth.getUser(token);
  return user || null;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate — reviewer identity comes from verified token only
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to submit reviews.' }, { status: 401 });
    }

    const reviewerId = user.id;

    // 2. Derive reviewer role from DB — never trust the client
    const profileRes = await queryDb(
      `SELECT role, full_name FROM public.profiles WHERE id = $1 LIMIT 1`,
      [reviewerId]
    );
    const reviewerProfile = profileRes?.rows?.[0];
    const reviewerRole = reviewerProfile?.role || 'worker';
    const reviewerName = reviewerProfile?.full_name || 'Anonymous User';

    // 3. Parse client body — only accept non-identity fields from client
    const body = await request.json();
    const { revieweeId, rating, comment, interviewId, interaction_type } = body;

    if (!revieweeId || !rating) {
      return NextResponse.json({ error: 'revieweeId and rating are required' }, { status: 400 });
    }

    const parsedRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    const stageType = interaction_type || 'interview_impression';

    // 4. Fetch reviewee name from DB — never trust the client
    const revieweeRes = await queryDb(
      `SELECT id, role, full_name FROM public.profiles WHERE id = $1 LIMIT 1`,
      [revieweeId]
    );
    const revieweeProfile = revieweeRes?.rows?.[0];
    if (!revieweeProfile) {
      return NextResponse.json({ error: 'Reviewee not found.' }, { status: 404 });
    }
    const revieweeName = revieweeProfile.full_name || 'Unknown User';
    const revieweeRole = revieweeProfile.role || 'worker';

    // 5. For interview-linked reviews: verify the authenticated user is a participant in that interview
    if (interviewId) {
      const interviewRes = await queryDb(
        `SELECT id FROM public.interviews 
         WHERE id::text = $1 AND (employer_id::text = $2 OR worker_id::text = $2)
         LIMIT 1`,
        [interviewId, reviewerId]
      ).catch(() => null);

      if (!interviewRes?.rows?.length) {
        return NextResponse.json({
          error: 'Forbidden',
          message: 'You are not a participant in this interview.'
        }, { status: 403 });
      }
    }

    // 6. Table is created via migration 20260810000002 — no runtime DDL
    const res = await queryDb(`
      INSERT INTO public.reviews (
        author_id, author_name, worker_id, employer_id,
        interview_id, reviewer_id, reviewer_name, reviewer_role, 
        reviewee_id, reviewee_name, reviewee_role, interaction_type, rating, comment, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', NOW())
      RETURNING id;
    `, [
      reviewerId,
      reviewerName,
      reviewerRole === 'worker' ? reviewerId : revieweeId,
      reviewerRole === 'employer' ? reviewerId : revieweeId,
      interviewId ? String(interviewId) : null,
      reviewerId,
      reviewerName,
      reviewerRole,
      revieweeId,
      revieweeName,
      revieweeRole,
      stageType,
      parsedRating,
      String(comment || ''),
    ]);

    const review = res?.rows?.[0];

    logAuditAction({
      action: `Review Submitted (${stageType})`,
      category: 'user_activity',
      severity: 'info',
      actor: reviewerName,
      actorRole: reviewerRole === 'employer' ? 'Employer' : 'Worker',
      target_name: revieweeName,
      target_id: String(revieweeId),
      changes_summary: `${reviewerName} (${reviewerRole}) submitted a ${parsedRating}-star review for ${revieweeName}. Pending moderation.`,
      raw_payload: { revieweeId, rating: parsedRating, interviewId, stageType }
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
