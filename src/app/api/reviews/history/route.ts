import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import { formatIstTimestamp } from '@/lib/auditLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export async function GET(request: NextRequest) {
  try {
    // Authenticate — reviewer history is private; derive identity from token
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

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required to view review history.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    // Identity comes from auth.uid() — ?userId= query param is ignored
    const userId = user.id;

    // Role is derived from DB — ?role= query param is ignored
    const profileRes = await queryDb(
      `SELECT role FROM public.profiles WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const role = profileRes?.rows?.[0]?.role || 'worker';

    // Table is created via migration 20260810000002 — no runtime DDL
    const givenRes = await queryDb(
      `SELECT id, reviewee_id, reviewee_name, reviewee_role, interaction_type, rating, comment, status, created_at
       FROM public.reviews WHERE reviewer_id = $1 ORDER BY created_at DESC LIMIT 50`,
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

    const receivedRes = await queryDb(
      `SELECT id, reviewer_id, reviewer_name, reviewer_role, interaction_type, rating, comment, status, created_at
       FROM public.reviews WHERE reviewee_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    const reviewsReceived = (receivedRes?.rows || []).map((r) => ({
      id: r.id,
      reviewer_id: r.reviewer_id,
      reviewer_name: r.reviewer_name,
      reviewer_role: r.reviewer_role,
      interaction_type: r.interaction_type || 'interview_impression',
      rating: r.rating || 5,
      comment: r.comment || '',
      status: r.status || 'pending',
      timestamp: formatIstTimestamp(r.created_at)
    }));

    const avgRatingRes = await queryDb(
      `SELECT AVG(rating)::numeric(3,1) as avg_rating, COUNT(*) as total_count
       FROM public.reviews WHERE reviewee_id = $1 AND status = 'approved'`,
      [userId]
    );
    const avgStats = avgRatingRes?.rows?.[0] || {};

    return NextResponse.json({
      success: true,
      userId,
      role,
      reviewsGiven,
      reviewsReceived,
      averageRating: parseFloat(avgStats.avg_rating) || 0,
      totalReviews: parseInt(avgStats.total_count, 10) || 0,
    });
  } catch (err: any) {
    console.error("GET /api/reviews/history error:", err);
    return NextResponse.json({ error: err.message || 'Failed to fetch review history' }, { status: 500 });
  }
}
