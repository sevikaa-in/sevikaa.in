"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useWorkerDashboard } from '../../layout';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeft, Briefcase, MapPin, IndianRupee, Clock, CheckCircle2, 
  Building2, Send, Lock, ShieldCheck, Users, Home, Utensils, 
  PhoneCall, MessageSquare, Sparkles, Award, Check, Compass
} from 'lucide-react';

export default function WorkerJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = (params?.id as string) || '';

  const { workerProfile, applications, availableJobs, showToast } = useWorkerDashboard();
  const { t, language, translateDynamic } = useLanguage();

  const isWorkerVerified = workerProfile.verified === true || workerProfile.status === 'live' || workerProfile.status === 'approved';
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  // Dynamic Translations State for free-form content & specifications
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedDesc, setTranslatedDesc] = useState('');
  const [translatedResponsibilities, setTranslatedResponsibilities] = useState<string[]>([]);
  const [translatedQualifications, setTranslatedQualifications] = useState<string[]>([]);
  const [translatedFamily, setTranslatedFamily] = useState('');
  const [translatedFlat, setTranslatedFlat] = useState('');
  const [translatedShift, setTranslatedShift] = useState('');
  const [translatedDietary, setTranslatedDietary] = useState('');

  // Fallback verified jobs list if not found in database
  const fallbackJobs = useMemo(() => [
    { 
      id: 'c9bf0b7b-3b02-44e1-a20d-70498b8c2d1b', 
      title: t('jobTitleHousekeeping') || 'Full Day Housekeeping & Deep Cleaning', 
      category: 'maid',
      employer_name: 'Ria Bhagat',
      employer_phone: '+91 98765 43210',
      description: t('jobDescHousekeeping') || 'Looking for an experienced and reliable maid for daily dusting, mopping, utensil washing, and laundry for our family in a 3BHK flat.', 
      salary_offered: 15000, 
      society_name: t('societyDLF') || 'DLF Westend Heights - Tower 4', 
      locality: 'Akshayanagar, DLF Road, Bangalore - 560068',
      shift_hours: 'Full Day (8:00 AM – 4:00 PM)',
      weekly_off: 'Sundays Off',
      family_members: '4 Members (2 Adults, 2 Kids)',
      flat_type: '3BHK Apartment (Tower 4, 8th Floor)',
      dietary_pref: 'Vegetarian Household',
      payment_terms: '1st of every month via Direct Bank Transfer / UPI',
      responsibilities: [
        'Daily floor sweeping, mopping & balcony cleaning',
        'Utensil washing & dishwasher loading',
        'Dusting furniture, TV unit, and window sills',
        'Washing clothes in washing machine & ironing daily wear'
      ],
      qualifications: [
        '2+ Years experience in gated apartment housekeeping',
        'Punctual, honest and hygienic work habits',
        'Aadhaar card verification & local reference mandatory'
      ],
      perks: ['Meals Included on Duty', 'Tea & Morning Snacks', 'Sunday Off', 'Diwali Bonus']
    },
    { 
      id: 'd78a9e4f-8f12-4c22-921a-5b12847a98b1', 
      title: t('jobTitleCook') || 'North & South Indian Family Cook', 
      category: 'cook',
      employer_name: 'Vikram Sharma',
      employer_phone: '+91 98123 45678',
      description: t('jobDescCook') || 'Family of 4 needs an experienced home cook for North Indian thali (roti, sabzi, dal, rice) and South Indian breakfast preparation.', 
      salary_offered: 18000, 
      society_name: t('societyPrestige') || 'Prestige Song of the South - Gate 1', 
      locality: 'Begur Main Road, Hulimavu, Bangalore - 560068',
      shift_hours: 'Split Shift: 7:00 AM – 10:00 AM & 6:00 PM – 9:00 PM',
      weekly_off: 'Sundays Off',
      family_members: '4 Members (2 Adults, 2 Elderly Parents)',
      flat_type: '3BHK Apartment (Block B, 3rd Floor)',
      dietary_pref: 'Pure Vegetarian / Jain Meal Options Required',
      payment_terms: '1st of every month in cash or UPI',
      responsibilities: [
        'Prepare fresh breakfast (Idli, Dosa, Poha, Parathas)',
        'Cook North Indian thali dinner for 4 members',
        'Keep kitchen platform, gas stove & cooking utensils clean',
        'Follow hygienic cooking standards & low oil preferences'
      ],
      qualifications: [
        '3+ Years home cooking experience in residential societies',
        'Expertise in Jain food prep (no onion/garlic dishes)',
        'Clean hygiene habits & neat presentation'
      ],
      perks: ['Tea & Evening Snacks', 'Festival Bonus', 'Annual Salary Revision']
    },
    { 
      id: 'e412a89c-1120-4e55-901b-1b918a204910', 
      title: t('jobTitleNanny') || 'Toddler Nanny & Infant Caregiver', 
      category: 'nanny',
      employer_name: 'Priya Nair',
      employer_phone: '+91 97654 32109',
      description: t('jobDescNanny') || 'Loving and attentive nanny needed to take care of an 18-month-old baby boy. Responsibilities include feeding, playtime, reading stories, and hygiene.', 
      salary_offered: 20000, 
      society_name: t('societySNN') || 'SNN Raj Serenity - Block B', 
      locality: 'Begur Road, Electronic City Link Road, Bangalore - 560068',
      shift_hours: 'Full Day (9:00 AM – 6:00 PM)',
      weekly_off: 'Sundays Off',
      family_members: '3 Members (2 Working Parents, 1 Toddler Boy)',
      flat_type: '3BHK Gated Apartment (Block B)',
      dietary_pref: 'Non-Vegetarian Household',
      payment_terms: '5th of every month via Bank Transfer',
      responsibilities: [
        'Feeding baby age-appropriate healthy meals & milk',
        'Sterilizing feeding bottles & maintaining baby hygiene',
        'Engaging toddler in fun educational games & storybooks',
        'Accompanying toddler for evening walk in society park'
      ],
      qualifications: [
        '3+ Years infant care or nanny experience required',
        'Patient, loving, non-smoker with good hygiene',
        'Background verification & police clearance mandatory'
      ],
      perks: ['Lunch Provided on Duty', 'Paid Annual Leaves (12 Days)', 'Overtime Pay Allowance']
    },
    { 
      id: 'f9201a44-7711-4822-b91c-2c9018471b05', 
      title: t('jobTitleDriver') || 'Personal Family Car Driver', 
      category: 'driver',
      employer_name: 'Anand Kulkarni',
      employer_phone: '+91 99000 11223',
      description: t('jobDescDriver') || 'Private family driver needed for daily office commutes, city errands, and airport drops in automatic SUV and manual sedan.', 
      salary_offered: 22000, 
      society_name: t('societyPurva') || 'Purva Westend - Kudlu Gate', 
      locality: 'Kudlu Gate, Hosur Main Road, Bangalore - 560068',
      shift_hours: '10 Hours Duty (9:00 AM – 7:00 PM)',
      weekly_off: 'Sundays Off',
      family_members: '4 Members (Executive Family)',
      flat_type: '4BHK Penthouse',
      dietary_pref: 'Non-Vegetarian Household',
      payment_terms: '1st of every month via Bank Transfer',
      responsibilities: [
        'Daily morning office drop & evening pick-up',
        'Maintain vehicle cleanliness, tire pressure & fuel level',
        'Safe driving with valid Commercial / Private DL',
        'Handling GPS navigation & city traffic routes'
      ],
      qualifications: [
        '4+ Years private driving experience with clean record',
        'Valid LMV Driving License mandatory',
        'No traffic violation history & police verification cleared'
      ],
      perks: ['Uniform Allowance Provided', 'Overtime Pay Allowance', 'Diwali Bonus']
    }
  ], [t]);

  // Target job lookup
  const job = useMemo(() => {
    const fromProps = availableJobs.find((j: any) => j.id === jobId);
    if (fromProps) return fromProps;
    return fallbackJobs.find(j => j.id === jobId) || fallbackJobs[0];
  }, [jobId, availableJobs, fallbackJobs]);

  // Formatted professional Job Reference ID
  const formattedJobId = useMemo(() => {
    if (!job.id) return 'SVK-C9BF0B';
    if (job.id.length > 8) {
      return `SVK-${job.id.slice(0, 6).toUpperCase()}`;
    }
    return `SVK-${job.id.toUpperCase()}`;
  }, [job.id]);

  // Translate free-form text & specifications dynamically whenever language or job changes
  useEffect(() => {
    let isMounted = true;
    async function translateFields() {
      if (language === 'en') {
        setTranslatedTitle(job.title);
        setTranslatedDesc(job.description);
        setTranslatedResponsibilities(job.responsibilities || []);
        setTranslatedQualifications(job.qualifications || []);
        setTranslatedFamily(job.family_members || '');
        setTranslatedFlat(job.flat_type || '');
        setTranslatedShift(job.shift_hours || '');
        setTranslatedDietary(job.dietary_pref || '');
        return;
      }

      if (job.title) {
        const resTitle = await translateDynamic(job.title);
        if (isMounted) setTranslatedTitle(resTitle);
      }
      if (job.description) {
        const resDesc = await translateDynamic(job.description);
        if (isMounted) setTranslatedDesc(resDesc);
      }
      if (job.responsibilities && job.responsibilities.length > 0) {
        const resResps = await Promise.all(job.responsibilities.map((r: string) => translateDynamic(r)));
        if (isMounted) setTranslatedResponsibilities(resResps);
      }
      if (job.qualifications && job.qualifications.length > 0) {
        const resQuals = await Promise.all(job.qualifications.map((q: string) => translateDynamic(q)));
        if (isMounted) setTranslatedQualifications(resQuals);
      }
      if (job.family_members) {
        const resFam = await translateDynamic(job.family_members);
        if (isMounted) setTranslatedFamily(resFam);
      }
      if (job.flat_type) {
        const resFlat = await translateDynamic(job.flat_type);
        if (isMounted) setTranslatedFlat(resFlat);
      }
      if (job.shift_hours) {
        const resShift = await translateDynamic(job.shift_hours);
        if (isMounted) setTranslatedShift(resShift);
      }
      if (job.dietary_pref) {
        const resDiet = await translateDynamic(job.dietary_pref);
        if (isMounted) setTranslatedDietary(resDiet);
      }
    }
    translateFields();
    return () => { isMounted = false; };
  }, [job, language, translateDynamic]);

  // Perks locale mapping helper
  const getTranslatedPerk = (perk: string) => {
    if (!perk) return '';
    const lower = perk.toLowerCase();
    if (lower.includes('meal')) return t('perkMeals') || 'Meals Included on Duty';
    if (lower.includes('tea') || lower.includes('snack')) return t('perkTeaSnacks') || 'Tea & Morning Snacks';
    if (lower.includes('sunday') || lower.includes('off')) return t('perkSundayOff') || 'Sunday Off';
    if (lower.includes('diwali') || lower.includes('bonus')) return t('perkDiwaliBonus') || 'Diwali Bonus';
    if (lower.includes('uniform')) return t('perkUniform') || 'Uniform Allowance Provided';
    if (lower.includes('overtime')) return t('perkOvertime') || 'Overtime Pay Allowance';
    return perk;
  };

  const matchingApp = applications.find((a: any) => a.jobId === job.id || a.jobTitle === job.title);
  const hasApplied = appliedJobIds.includes(job.id) || !!matchingApp;
  const currentStatus = matchingApp?.status || (hasApplied ? 'under_review' : 'not_applied');
  const isInterviewScheduled = currentStatus === 'interview_scheduled' || currentStatus === 'confirmed';
  const isHired = currentStatus === 'hired';
  const cleanPhone = (matchingApp?.employerPhone || job.employer_phone || '+919876543210').replace(/\s+/g, '');

  const handleApply = async () => {
    if (!isWorkerVerified) {
      showToast("Profile Verification Required! Sevikaa Admin will approve your Aadhaar audit before applying.", "warning");
      return;
    }
    if (hasApplied) return;

    setIsApplying(true);
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!isPlaceholder) {
        await supabase
          .from('applications')
          .insert([{
            job_id: job.id,
            worker_id: workerProfile.phone || 'w_user',
            status: 'under_review',
            created_at: new Date().toISOString()
          }]);
      }

      setAppliedJobIds(prev => [...prev, job.id]);
      showToast(`Application submitted for "${job.title}"! Track status in Interviews.`, 'success');
    } catch (err: any) {
      console.error(err);
      setAppliedJobIds(prev => [...prev, job.id]);
      showToast(`Application submitted!`, 'success');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-24">
      {/* Top Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <Link 
          href="/worker/jobs" 
          className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border border-slate-200/60 shadow-xs active:scale-95 justify-center sm:justify-start"
        >
          <ArrowLeft size={16} className="text-[#1A73E8] shrink-0" />
          <span className="leading-snug">{t('backToJobs') || 'Back to All Jobs'}</span>
        </Link>

        <span className="text-xs font-black text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200/60 font-mono text-center shrink-0 self-center sm:self-auto">
          Job Ref: #{formattedJobId}
        </span>
      </div>

      {/* Main Premium Details Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-md space-y-6">
        
        {/* Employer Header Banner */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-slate-50 p-5 sm:p-6 rounded-3xl border border-blue-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-[#1A73E8] to-indigo-700 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25 ring-4 ring-white">
              {(job.employer_name || job.society_name || 'H')[0]}
            </div>
            <div className="space-y-1">
              <h1 className="text-base sm:text-xl font-black text-slate-900 leading-snug tracking-tight">
                {translatedTitle || job.title}
              </h1>
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-600">
                <span>{job.employer_name || 'Verified Household'}</span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-flex items-center gap-1 text-[10px] font-black">
                  <ShieldCheck size={11} className="text-emerald-600" />
                  <span>{t('sevikaaVerifiedHousehold') || 'Sevikaa Verified Household'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 self-start xs:self-auto relative z-10">
            <span className="text-base sm:text-lg font-black text-emerald-800 font-mono bg-white px-4 py-2 rounded-2xl border border-emerald-300 shadow-sm inline-flex items-center gap-1 whitespace-nowrap">
              <IndianRupee size={16} className="text-emerald-600 stroke-[2.5]" />
              <span>{job.salary_offered ? Number(job.salary_offered).toLocaleString('en-IN') : '15,000'} / mo</span>
            </span>
          </div>
        </div>

        {/* Application Status Banner (If Applied) */}
        {hasApplied && (
          <div className={`p-4 rounded-2xl border space-y-2.5 ${
            isHired 
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
              : isInterviewScheduled
              ? 'bg-blue-50/90 border-blue-200 text-blue-900'
              : 'bg-amber-50/90 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider block">Application Status for this Position</span>
              <span className={`px-3 py-1 rounded-full text-[9.5px] font-black uppercase shadow-xs ${
                isHired ? 'bg-emerald-600 text-white' : isInterviewScheduled ? 'bg-[#1A73E8] text-white' : 'bg-amber-500 text-white'
              }`}>
                {isHired ? '🏆 Hired' : isInterviewScheduled ? '📞 Interview Scheduled' : '⏳ Application Under Review'}
              </span>
            </div>

            {isInterviewScheduled ? (
              <div className="space-y-2.5 pt-2 border-t border-blue-200/60">
                <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Clock size={14} className="text-[#1A73E8]" />
                  <span>Interview Scheduled: <strong>{matchingApp?.interviewTime || 'Today at 4:30 PM'}</strong></span>
                </p>

                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <PhoneCall size={13} />
                    <span>Call Employer</span>
                  </a>
                  <a
                    href={`https://wa.me/${cleanPhone.replace(/\+/g, '')}?text=Namaste%20${encodeURIComponent(job.employer_name || 'Employer')},%20I%20am%20contacting%20you%20regarding%20our%20interview%20for%20${encodeURIComponent(job.title)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs font-medium leading-relaxed">
                Your application has been submitted to {job.employer_name || 'the household'}. You will receive an SMS and interview invite as soon as the employer shortlists your profile.
              </p>
            )}
          </div>
        )}

        {/* 🏡 HOUSEHOLD SPECIFICATIONS (2 LINES PER CARD - NO GRID, ZERO TRUNCATION) */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Home size={14} className="text-[#1A73E8]" />
            <span>{t('householdSpecsTitle') || 'Household Specifications'}</span>
          </h3>

          <div className="flex flex-col space-y-3 text-xs font-bold">
            {/* List Item 1: Family Setup */}
            <div className="bg-gradient-to-r from-slate-50 via-white to-blue-50/40 p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-blue-200 transition-all">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-[#1A73E8] flex items-center justify-center shrink-0 border border-blue-200/60 shadow-xs">
                <Users size={20} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  {t('familySetupLabel') || 'Family Setup'}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 leading-snug block">
                  {translatedFamily || job.family_members || '4 Members (2 Adults, 2 Kids)'}
                </span>
              </div>
            </div>

            {/* List Item 2: Residence Type */}
            <div className="bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-indigo-200 transition-all">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/60 shadow-xs">
                <Home size={20} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  {t('residenceTypeLabel') || 'Residence Type'}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 leading-snug block">
                  {translatedFlat || job.flat_type || '3BHK Apartment'}
                </span>
              </div>
            </div>

            {/* List Item 3: Working Shift */}
            <div className="bg-gradient-to-r from-slate-50 via-white to-purple-50/40 p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-purple-200 transition-all">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/60 shadow-xs">
                <Clock size={20} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  {t('workingShiftLabel') || 'Working Shift'}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 leading-snug block">
                  {translatedShift || job.shift_hours || 'Full Day (8 AM - 4 PM)'}
                </span>
              </div>
            </div>

            {/* List Item 4: Dietary Prefs */}
            <div className="bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-emerald-200 transition-all">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-xs">
                <Utensils size={20} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  {t('dietaryPrefsLabel') || 'Dietary Prefs'}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 leading-snug block">
                  {translatedDietary || job.dietary_pref || 'Vegetarian Household'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 📍 Society Address & Locality */}
        <div className="bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50 p-4.5 rounded-2xl border border-blue-100/80 space-y-3 shadow-xs flex flex-col">
          <div className="space-y-1">
            <span className="text-[10px] text-blue-600 uppercase font-black flex items-center gap-1 tracking-wider">
              <MapPin size={13} className="text-[#1A73E8]" /> Society Gate &amp; Locality Address
            </span>
            <p className="text-xs sm:text-sm text-slate-900 font-black leading-relaxed mt-0.5">
              {job.society_name} &bull; {job.locality || 'Bangalore'}
            </p>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.society_name || job.locality || 'Bangalore')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 mt-1"
          >
            <Compass size={14} className="text-blue-400" />
            <span>Navigate on Google Maps</span>
          </a>
        </div>

        {/* Work Overview */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {t('jobOverview') || 'Job Overview & Description'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/70">
            {translatedDesc || job.description}
          </p>
        </div>

        {/* Daily Responsibilities List */}
        {(translatedResponsibilities.length > 0 ? translatedResponsibilities : job.responsibilities) && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {t('dailyResponsibilities') || 'Daily Responsibilities'}
            </h3>
            <ul className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/70 space-y-3 text-xs sm:text-sm text-slate-800 font-medium">
              {(translatedResponsibilities.length > 0 ? translatedResponsibilities : job.responsibilities).map((resp: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
                  <span className="leading-snug">{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Candidate Prerequisites */}
        {(translatedQualifications.length > 0 ? translatedQualifications : job.qualifications) && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {t('candidatePrerequisites') || 'Candidate Prerequisites'}
            </h3>
            <ul className="bg-amber-50/50 p-4.5 rounded-2xl border border-amber-200/60 space-y-3 text-xs sm:text-sm text-amber-950 font-medium">
              {(translatedQualifications.length > 0 ? translatedQualifications : job.qualifications).map((qual: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <Award size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{qual}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Provided Household Perks */}
        {job.perks && job.perks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {t('providedPerks') || 'Provided Household Perks'}
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {job.perks.map((perk: string, idx: number) => (
                <span key={idx} className="px-4 py-2 bg-emerald-50 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200/80 flex items-center gap-2 shadow-xs">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>{getTranslatedPerk(perk)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <Link
            href="/worker/jobs"
            className="w-full sm:w-auto py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200/60 shadow-xs text-center"
          >
            <ArrowLeft size={15} className="text-slate-500 shrink-0" />
            <span className="text-center">{t('backToJobs') || 'Back to All Jobs'}</span>
          </Link>

          <button
            onClick={handleApply}
            disabled={hasApplied || !isWorkerVerified || isApplying}
            className={`w-full sm:w-auto py-3.5 px-6 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95 text-center ${
              hasApplied 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20' 
                : !isWorkerVerified
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-amber-950 border border-amber-300/80 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#1A73E8] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-500/25'
            }`}
          >
            {hasApplied ? (
              <>
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{t('applied')}</span>
              </>
            ) : !isWorkerVerified ? (
              <>
                <Lock size={15} className="shrink-0" />
                <span className="text-center">{t('pendingAuditBadge')}</span>
              </>
            ) : (
              <>
                <Send size={16} className="shrink-0" />
                <span className="text-center">{isApplying ? t('applying') : t('applyNow')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
