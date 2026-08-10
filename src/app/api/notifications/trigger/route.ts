import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSMS, sendEmail } from '../../../../lib/notifications';
import { supabaseAdmin } from '../../../../lib/supabaseAdminClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    approved_sms: "Hello {name}, your Sevikaa profile has been approved and is now Live!",
    approved_email_sub: "Your Sevikaa Profile is Approved!",
    approved_email_body: "<h1>Congratulations {name}!</h1><p>Your domestic worker profile on Sevikaa has been successfully verified by our administrator team and is now Live. Employers can now search and contact you.</p>",
    interview_sms: "Hello {name}, an employer has scheduled an interview request with you on Sevikaa. Please check your dashboard.",
    interview_email_sub: "New Interview Scheduled on Sevikaa",
    interview_email_body: "<h1>New Interview Scheduled</h1><p>An employer has requested an interview with you. Log into your dashboard to check the timings and details.</p>",
    job_changes_requested_sms: "Sevikaa Alert: Action required for your job post. Admin Feedback: '{note}'. Please update and resubmit: https://www.sevikaa.in/employer/dashboard/jobs",
    job_changes_requested_email_sub: "Action Required: Sevikaa Job Requisition Feedback",
    job_changes_requested_email_body: "<h1>Action Required on Job Requisition</h1><p>Admin has reviewed your job posting and requested the following changes:</p><blockquote style='background:#fff3cd;padding:12px;border-left:4px solid #ffc107;'>{note}</blockquote><p><a href='https://www.sevikaa.in/employer/dashboard/jobs'>Click here to update and resubmit your job posting</a>.</p>"
  },
  hi: {
    approved_sms: "नमस्ते {name}, आपकी सेविका प्रोफ़ाइल स्वीकृत हो गई है और अब लाइव है!",
    approved_email_sub: "आपकी सेविका प्रोफ़ाइल स्वीकृत हो गई है!",
    approved_email_body: "<h1>बधाई हो {name}!</h1><p>सेविका पर आपकी प्रोफाइल टीम द्वारा सत्यापित कर दी गई है और अब लाइव है। नियोक्ता अब आपसे संपर्क कर सकते हैं।</p>",
    interview_sms: "नमस्ते {name}, एक नियोक्ता ने सेविका पर आपके साथ साक्षात्कार (Interview) तय किया है। कृपया अपना डैशबोर्ड देखें।",
    interview_email_sub: "सेविका पर नया साक्षात्कार तय हुआ",
    interview_email_body: "<h1>नया साक्षात्कार तय हुआ</h1><p>एक नियोक्ता ने आपके साथ साक्षात्कार के लिए अनुरोध किया है। विवरण जांचने के लिए अपने डैशबोर्ड में लॉग इन करें।</p>",
    job_changes_requested_sms: "सेविका अलर्ट: आपकी नौकरी की आवश्यकता पर कार्रवाई आवश्यक है। एडमिन नोट: '{note}'। अपडेट करने के लिए लॉग इन करें: https://www.sevikaa.in/employer/dashboard/jobs",
    job_changes_requested_email_sub: "कार्रवाई आवश्यक: सेविका जॉब आवश्यकता फ़ीडबैक",
    job_changes_requested_email_body: "<h1>नौकरी की आवश्यकता पर कार्रवाई आवश्यक है</h1><p>एडमिन ने आपकी नौकरी की समीक्षा की है और निम्नलिखित बदलाव का अनुरोध किया है:</p><blockquote>{note}</blockquote>"
  }
};

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate Session
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
        } catch {
          token = sbCookie.value;
        }
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required.' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid or expired session token.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const requesterRole = profile?.role || 'worker';

    const { 
      type, userId, role = 'worker', name = 'User', email, phone, 
      title, message, pushToken, actionUrl, actionLabel, note, userLanguage = 'en' 
    } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'type parameter is required' }, { status: 400 });
    }

    // 2. Authorize Notification Trigger
    const isAdmin = requesterRole === 'admin' || requesterRole === 'super-admin';
    const isSendingToSelf = user.id === userId;

    // Non-admin callers may only trigger notifications to themselves.
    // Admins may trigger to any user.
    // The previous broad exemption for interview_scheduled/applicant_received was removed
    // to prevent unauthorized notification spam to arbitrary users.
    if (!isAdmin && !isSendingToSelf) {
      return NextResponse.json({ error: 'Forbidden', message: 'You may only trigger notifications for your own account.' }, { status: 403 });
    }


    const lang = TRANSLATIONS[userLanguage] ? userLanguage : 'en';
    const templates = TRANSLATIONS[lang];

    let notifTitle = title || 'Sevikaa Platform Alert';
    let notifMessage = message || '';
    let smsContent = '';
    let emailSubject = '';
    let emailBody = '';
    let defaultActionUrl = actionUrl || '/worker/notifications';
    let defaultActionLabel = actionLabel || 'View Details';

    if (type === 'profile_approved') {
      notifTitle = notifTitle || 'Worker Passport Verified & Live 🟢';
      notifMessage = notifMessage || 'Your candidate profile passed Aadhaar & background audit. Employers in your preferred society can now view and contact you.';
      smsContent = templates.approved_sms.replace('{name}', name);
      emailSubject = templates.approved_email_sub;
      emailBody = templates.approved_email_body.replace('{name}', name);
      defaultActionUrl = '/worker/profile';
      defaultActionLabel = 'View Candidate Passport';
    } else if (type === 'interview_scheduled') {
      notifTitle = notifTitle || 'Gate Pass Interview Scheduled 📅';
      notifMessage = notifMessage || `An employer scheduled an interview for you. Log into Sevikaa to view contact and gate pass details.`;
      smsContent = templates.interview_sms.replace('{name}', name);
      emailSubject = templates.interview_email_sub;
      emailBody = templates.interview_email_body.replace('{name}', name);
      defaultActionUrl = role === 'employer' ? '/employer/interviews' : '/worker/interviews';
      defaultActionLabel = 'View Interview Gate Pass';
    } else if (type === 'applicant_received') {
      notifTitle = notifTitle || 'New Candidate Applied for Requisition 👤';
      notifMessage = notifMessage || `A background-verified helper applied for your job requisition. Tap to review profile.`;
      defaultActionUrl = '/employer/jobs';
      defaultActionLabel = 'Review Candidate Profile';
    } else if (type === 'job_changes_requested') {
      notifTitle = notifTitle || 'Action Required on Job Requisition ⚠️';
      notifMessage = notifMessage || `Admin note: ${note || 'Please revise requisition details.'}`;
      smsContent = templates.job_changes_requested_sms.replace('{note}', note || 'Please revise requisition details.');
      emailSubject = templates.job_changes_requested_email_sub;
      emailBody = templates.job_changes_requested_email_body.replace('{note}', note || 'Please revise requisition details.');
      defaultActionUrl = '/employer/jobs';
      defaultActionLabel = 'Revise Job Requisition';
    } else {
      notifMessage = notifMessage || 'You have a new update from Sevikaa Platform.';
    }

    console.log(`[Notification Engine] Triggering event: ${type} for user: ${name} (${userId})`);

    // 1. SAVE PERMANENTLY TO POSTGRESQL SUPABASE DB
    let dbResult = null;
    if (userId && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('notifications')
          .insert([{
            user_id: userId,
            role,
            type,
            title: notifTitle,
            message: notifMessage,
            read: false,
            action_url: defaultActionUrl,
            action_label: defaultActionLabel,
            created_at: new Date().toISOString()
          }])
          .select();

        if (error) {
          console.warn("[DB Notification Save Notice]:", error.message);
        } else {
          dbResult = data;
        }
      } catch (dbErr) {
        console.warn("[DB Notification Save Exception]:", dbErr);
      }
    }

    // 2. DISPATCH EXPO PUSH NOTIFICATION TO MOBILE DEVICE
    let pushResult = null;
    if (pushToken && pushToken.startsWith('ExponentPushToken')) {
      try {
        const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            to: pushToken,
            sound: 'default',
            title: notifTitle,
            body: notifMessage,
            data: {
              type,
              actionUrl: defaultActionUrl,
              userId
            },
            priority: 'high',
          })
        });
        pushResult = await pushRes.json();
      } catch (pErr) {
        console.warn("[Push Notification Dispatch Notice]:", pErr);
      }
    }

    // 3. DISPATCH SMS IF PHONE EXISTS
    let smsResult = null;
    if (phone) {
      let templateKey = 'SECURITY_ALERT';
      let vars: Record<string, string> = {};

      if (type === 'profile_approved') {
        templateKey = 'WORKER_VERIFIED';
      } else if (type === 'interview_scheduled') {
        templateKey = 'INTERVIEW_SCHEDULED';
        vars = { date: 'Today', time: '10:30 AM' };
      }

      smsResult = await sendSMS(phone, templateKey, vars).catch(() => null);
    }

    // 4. DISPATCH EMAIL IF EMAIL EXISTS
    let emailResult = null;
    if (email && emailSubject && emailBody) {
      emailResult = await sendEmail(email, emailSubject, emailBody).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      dbSaved: !!dbResult,
      pushSent: !!pushResult,
      sms: smsResult,
      email: emailResult
    });
  } catch (err: any) {
    console.error("[Notification Trigger Error]:", err);
    return NextResponse.json({ error: err.message || 'Notification trigger failed' }, { status: 500 });
  }
}
