import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryDb } from '@/lib/db';
import { getCached, setCached, invalidateCache } from '@/lib/ttlCache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const TEMPLATES_CACHE_KEY = 'platform:sms_templates';

async function requireAdmin(request: NextRequest): Promise<{ userId: string } | NextResponse> {
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

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile?.role || !['admin', 'super-admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden', message: 'Admin privileges required.' }, { status: 403 });
  }

  return { userId: user.id };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    // Check TTL cache (10 min TTL for SMS template definitions)
    const cachedTemplates = getCached<any[]>(TEMPLATES_CACHE_KEY);
    if (cachedTemplates) {
      return NextResponse.json({ success: true, templates: cachedTemplates, cached: true });
    }

    // Fetch ONLY MSG91 (SMS) and AWS SES (Email) templates with explicit column list
    const res = await queryDb(`
      SELECT DISTINCT ON (template_key, provider) 
             id, template_key, category, provider, sender_id, dlt_template_id, language, title, message, is_active, version, created_at
      FROM public.sms_templates 
      WHERE LOWER(provider) IN ('msg91', 'aws_ses') 
      ORDER BY template_key ASC, provider ASC, created_at DESC;
    `);

    const templates = (res?.rows || []).map((t, idx) => ({
      id: t.id || `tpl_${idx}`,
      template_key: t.template_key || 'LOGIN_OTP',
      category: t.category || 'authentication',
      provider: t.provider || 'msg91',
      sender_id: t.sender_id || 'SEVKAA',
      dlt_template_id: t.dlt_template_id || null,
      language: t.language || 'en',
      title: t.title || 'MSG91 DLT Template',
      message: t.message || '',
      is_active: t.is_active !== false,
      version: t.version || 1
    }));

    setCached(TEMPLATES_CACHE_KEY, templates, 600); // 10 min TTL

    return NextResponse.json({ success: true, templates });
  } catch (err: any) {
    console.error("GET /api/notifications/sms/templates error:", err);
    return NextResponse.json({ success: false, error: err.message, templates: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { template_key, category, provider, sender_id, dlt_template_id, language, title, message } = body;

    const res = await queryDb(`
      INSERT INTO public.sms_templates (template_key, category, provider, sender_id, dlt_template_id, language, title, message, is_active, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 1)
      RETURNING id, template_key, category, provider, sender_id, dlt_template_id, language, title, message, is_active, version, created_at;
    `, [
      template_key || 'CUSTOM_TEMPLATE',
      category || 'general',
      provider || 'msg91',
      sender_id || 'SEVKAA',
      dlt_template_id || null,
      language || 'en',
      title || 'Custom DLT Template',
      message || ''
    ]);

    // Invalidate template cache on update
    invalidateCache(TEMPLATES_CACHE_KEY);

    return NextResponse.json({ success: true, template: res?.rows?.[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
