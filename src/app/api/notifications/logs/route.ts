import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { formatIstTimestamp } from '@/lib/auditLogger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    // Ensure public.notification_logs table exists
    await queryDb(`
      CREATE TABLE IF NOT EXISTS public.notification_logs (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        channel text NOT NULL DEFAULT 'sms',
        provider text NOT NULL DEFAULT 'msg91',
        recipient text NOT NULL,
        template_id text,
        message_id text,
        status text NOT NULL DEFAULT 'delivered',
        description text,
        raw_payload text,
        created_at timestamptz DEFAULT NOW()
      );
    `).catch(() => {});

    // Get total count
    const countRes = await queryDb(`SELECT COUNT(*) FROM public.notification_logs;`).catch(() => null);
    const total = parseInt(countRes?.rows?.[0]?.count || '0', 10);
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch paginated rows
    const res = await queryDb(
      `SELECT * FROM public.notification_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const logs = (res?.rows || []).map((row, idx) => ({
      id: row.id || `notif_${idx}_${Date.now()}`,
      channel: row.channel || 'sms',
      provider: row.provider || 'msg91',
      recipient: row.recipient || 'Unknown',
      template_id: row.template_id || 'DEFAULT',
      message_id: row.message_id || 'N/A',
      status: row.status || 'delivered',
      description: row.description || 'Notification dispatched',
      timestamp: formatIstTimestamp(row.created_at)
    }));

    const response = NextResponse.json({
      success: true,
      total,
      page,
      totalPages,
      limit,
      logs
    });

    // Cache header: stale-while-revalidate for super fast UI performance
    response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
    return response;
  } catch (err: any) {
    console.error("GET /api/notifications/logs error:", err);
    return NextResponse.json({ success: false, error: err.message, logs: [], total: 0, totalPages: 1 }, { status: 500 });
  }
}
