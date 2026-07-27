import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdminClient';

// Helper function to check admin/super-admin role via Supabase Session Token
async function isAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // Use a temporary client to verify the user JWT safely
  const { createClient } = require('@supabase/supabase-js');
  const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  
  try {
    const { data: { user }, error } = await tempClient.auth.getUser(token);
    if (error || !user) return false;
    
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    return profile?.role === 'admin' || profile?.role === 'super-admin';
  } catch (err) {
    console.error("API Admin verification failed:", err);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: templates, error } = await supabaseAdmin
      .from('sms_templates')
      .select('*')
      .order('template_key', { ascending: true })
      .order('provider', { ascending: true })
      .order('language', { ascending: true })
      .order('version', { ascending: false });
      
    if (error) throw error;
    
    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { templateKey, category, provider, senderId, dltTemplateId, language = 'en', title, message, isActive = true } = body;
    
    if (!templateKey || !category || !provider || !message) {
      return NextResponse.json({ error: 'Missing required fields: templateKey, category, provider, message' }, { status: 400 });
    }
    
    // Find maximum version for this template key, provider and language
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('sms_templates')
      .select('version')
      .eq('template_key', templateKey)
      .eq('provider', provider)
      .eq('language', language)
      .order('version', { ascending: false })
      .limit(1);
      
    if (fetchErr) throw fetchErr;
    
    const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;
    
    // If this new template is active, deactivate other versions of same template key + provider + language
    if (isActive) {
      await supabaseAdmin
        .from('sms_templates')
        .update({ is_active: false })
        .eq('template_key', templateKey)
        .eq('provider', provider)
        .eq('language', language);
    }
    
    const { data: newTemplate, error: insertErr } = await supabaseAdmin
      .from('sms_templates')
      .insert({
        template_key: templateKey,
        category,
        provider,
        sender_id: senderId || 'SEVKAA',
        dlt_template_id: dltTemplateId || null,
        language,
        title: title || templateKey,
        message,
        is_active: isActive,
        version: nextVersion
      })
      .select()
      .single();
      
    if (insertErr) throw insertErr;
    
    return NextResponse.json({ success: true, template: newTemplate });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create template' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, isActive, dltTemplateId, senderId } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
    }
    
    // Fetch current template details
    const { data: current, error: getErr } = await supabaseAdmin
      .from('sms_templates')
      .select('*')
      .eq('id', id)
      .single();
      
    if (getErr || !current) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    const updateData: Record<string, any> = {};
    if (isActive !== undefined) {
      updateData.is_active = isActive;
      
      // If we are activating this version, deactivate all other versions of the same template key + provider + language
      if (isActive === true) {
        await supabaseAdmin
          .from('sms_templates')
          .update({ is_active: false })
          .eq('template_key', current.template_key)
          .eq('provider', current.provider)
          .eq('language', current.language)
          .neq('id', id);
      }
    }
    if (dltTemplateId !== undefined) updateData.dlt_template_id = dltTemplateId || null;
    if (senderId !== undefined) updateData.sender_id = senderId || 'SEVKAA';
    
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('sms_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (updateErr) throw updateErr;
    
    return NextResponse.json({ success: true, template: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update template' }, { status: 500 });
  }
}
