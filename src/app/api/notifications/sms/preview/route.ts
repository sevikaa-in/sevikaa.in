import { NextRequest, NextResponse } from 'next/server';
import { interpolateVariables, validateTemplateVariables } from '../../../../../lib/smsService';
import { supabaseAdmin } from '../../../../../lib/supabaseAdminClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, templateText, variables = {} } = body;
    
    let textToInterpolate = templateText || '';
    
    if (templateId) {
      const { data: template, error } = await supabaseAdmin
        .from('sms_templates')
        .select('message')
        .eq('id', templateId)
        .single();
        
      if (error || !template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      textToInterpolate = template.message;
    }
    
    if (!textToInterpolate) {
      return NextResponse.json({ error: 'No template text or template ID provided' }, { status: 400 });
    }
    
    const validation = validateTemplateVariables(textToInterpolate, variables);
    const interpolated = interpolateVariables(textToInterpolate, variables);
    
    return NextResponse.json({
      success: true,
      preview: interpolated,
      valid: validation.valid,
      missingVariables: validation.missing
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to render preview' }, { status: 500 });
  }
}
