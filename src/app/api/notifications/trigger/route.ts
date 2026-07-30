import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, sendEmail } from '../../../../lib/notifications';
import { supabaseAdmin } from '../../../../lib/supabaseAdminClient';

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
    const { type, userId, name, email, phone, note, userLanguage = 'en' } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'type parameter is required' }, { status: 400 });
    }

    // Resolve language-specific templates
    const lang = TRANSLATIONS[userLanguage] ? userLanguage : 'en';
    const templates = TRANSLATIONS[lang];

    let smsContent = '';
    let emailSubject = '';
    let emailBody = '';

    if (type === 'profile_approved') {
      smsContent = templates.approved_sms.replace('{name}', name);
      emailSubject = templates.approved_email_sub;
      emailBody = templates.approved_email_body.replace('{name}', name);
    } else if (type === 'interview_scheduled') {
      smsContent = templates.interview_sms.replace('{name}', name);
      emailSubject = templates.interview_email_sub;
      emailBody = templates.interview_email_body.replace('{name}', name);
    } else if (type === 'job_changes_requested') {
      smsContent = templates.job_changes_requested_sms.replace('{note}', note || 'Please revise requisition details.');
      emailSubject = templates.job_changes_requested_email_sub;
      emailBody = templates.job_changes_requested_email_body.replace('{note}', note || 'Please revise requisition details.');
    } else {
      return NextResponse.json({ error: 'Unsupported notification event type' }, { status: 400 });
    }

    console.log(`[Notification Engine] Triggering event: ${type} for user: ${name} (${userId})`);

    // 1. Dispatch SMS if phone number exists using DLT Template mapping
    let smsResult = null;
    if (phone) {
      let templateKey = 'SECURITY_ALERT';
      let vars: Record<string, string> = {};

      if (type === 'profile_approved') {
        templateKey = 'WORKER_VERIFIED';
      } else if (type === 'interview_scheduled') {
        templateKey = 'INTERVIEW_SCHEDULED';
        vars = { date: 'Today', time: '10:30 AM' };
      } else if (type === 'job_changes_requested') {
        templateKey = 'SECURITY_ALERT';
      }

      smsResult = await sendSMS(phone, templateKey, vars);
    }

    // 2. Dispatch Email if email address exists
    let emailResult = null;
    if (email) {
      emailResult = await sendEmail(email, emailSubject, emailBody);
    }

    return NextResponse.json({
      success: true,
      sms: smsResult,
      email: emailResult
    });
  } catch (err: any) {
    console.error("[Notification Trigger Error]:", err);
    return NextResponse.json({ error: err.message || 'Notification trigger failed' }, { status: 500 });
  }
}
