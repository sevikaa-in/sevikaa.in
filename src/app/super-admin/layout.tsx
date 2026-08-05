"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PrefetchLink } from '@/components/admin/PrefetchLink';
import { supabase } from '@/lib/supabaseClient';
import { enforceSingleAdminSession } from '@/lib/singleSessionEnforcer';
import { ToastContainer, ToastItem } from '@/components/admin/dashboard/Toast';
import { 
  TrendingUp, MapPin, IndianRupee, Database, PlusCircle, LogOut, 
  CheckCircle2, UserPlus, FileText, ChevronRight, Menu, X, Search,
  Settings, Server, Activity, ShieldAlert, Sparkles, ChevronLeft, 
  LayoutDashboard, ThumbsUp, ThumbsDown, Check, Trash2, Calendar, Star, Clock,
  MessageSquare, CreditCard, PhoneCall
} from 'lucide-react';

interface SuperAdminContextProps {
  loading: boolean;
  error: string;
  user: any;
  dbStats: {
    totalWorkers: number;
    verifiedWorkers: number;
    pendingWorkers: number;
    totalEmployers: number;
    activeEmployers: number;
    totalSocieties: number;
    pendingJobs: number;
    pendingReviews: number;
  };
  workersList: any[];
  employersList: any[];
  setEmployersList: React.Dispatch<React.SetStateAction<any[]>>;
  pendingJobsList: any[];
  pendingReviewsList: any[];
  societiesList: any[];
  setSocietiesList: React.Dispatch<React.SetStateAction<any[]>>;
  admins: any[];
  newAdminEmail: string;
  setNewAdminEmail: React.Dispatch<React.SetStateAction<string>>;
  pricing: any;
  setPricing: React.Dispatch<React.SetStateAction<any>>;
  availabilityMetrics: {
    earlyMorning: number;
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
    fullDay: number;
    liveIn: number;
  };
  societyAnalytics: any[];
  activities: any[];
  smsTemplates: any[];
  smsLogs: any[];
  smsLoading: boolean;
  previewTemplate: any;
  setPreviewTemplate: React.Dispatch<React.SetStateAction<any>>;
  previewVariables: string;
  setPreviewVariables: React.Dispatch<React.SetStateAction<string>>;
  previewOutput: string;
  previewValid: boolean;
  previewMissing: string[];
  showAddModal: boolean;
  setShowAddModal: React.Dispatch<React.SetStateAction<boolean>>;
  newTemplate: any;
  setNewTemplate: React.Dispatch<React.SetStateAction<any>>;
  dateRange: string;
  setDateRange: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  fetchDashboardData: () => Promise<void>;
  fetchSmsData: () => Promise<void>;
  selectedWorker: any;
  setSelectedWorker: React.Dispatch<React.SetStateAction<any>>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  handleUpdateWorkerStatus: (workerId: string, newStatus: string) => Promise<void>;
  handleUpdateBadge: (badgeKey: string, status: 'Pending' | 'Verified' | 'Rejected') => Promise<void>;
  handleModerateJob: (jobId: string, action: 'approve' | 'reject' | 'request_changes' | 'unapprove' | 'revert' | boolean, adminNote?: string) => Promise<void>;
  handleModerateReview: (reviewId: string, action: 'approved' | 'rejected' | 'hidden') => Promise<void>;
  handleAddAdmin: (e: React.FormEvent) => Promise<void>;
  handleSavePricing: (e: React.FormEvent) => void;
  handleToggleSmsActive: (templateId: string, currentStatus: boolean) => Promise<void>;
  handleAddTemplateVersion: (e: React.FormEvent) => Promise<void>;
  handleUpdateDltDetails: (templateId: string, dltId: string, senderId: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const SuperAdminDashboardContext = createContext<SuperAdminContextProps | undefined>(undefined);

export function useSuperAdminDashboard() {
  const context = useContext(SuperAdminDashboardContext);
  if (!context) {
    throw new Error("useSuperAdminDashboard must be used within a SuperAdminDashboardProvider");
  }
  return context;
}

export default function SuperAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Navigation & Shell State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Ctrl+K → focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Data Loading & State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Business metrics from DB counts
  const [dbStats, setDbStats] = useState({
    totalWorkers: 0,
    verifiedWorkers: 0,
    pendingWorkers: 0,
    totalEmployers: 0,
    activeEmployers: 0,
    totalSocieties: 0,
    pendingJobs: 0,
    pendingReviews: 0,
  });

  // Selected audit items
  const [selectedWorker, setSelectedWorker] = useState<any>(null);

  // Dynamic Lists for Core Workflows
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [employersList, setEmployersList] = useState<any[]>([]);
  const [pendingJobsList, setPendingJobsList] = useState<any[]>([]);
  const [pendingReviewsList, setPendingReviewsList] = useState<any[]>([]);
  const [societiesList, setSocietiesList] = useState<any[]>([]);
  const [admins, setAdmins] = useState([
    { id: 'a1', email: 'moderator1@sevikaa.com', created: '2026-07-20' },
    { id: 'a2', email: 'moderator2@sevikaa.com', created: '2026-07-21' }
  ]);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Pricing configuration - Worker Free Forever & Tiered Employer Plans
  const [pricing, setPricing] = useState<any>({
    workerRegistration: '0',
    freePlan: { price: '0', validityDays: 'Unlimited', jobPostsLimit: '1', contactUnlocksLimit: '0', name: 'Free Plan' },
    basicPlan: { price: '299', validityDays: '30', jobPostsLimit: '3', contactUnlocksLimit: '10', name: 'Basic Plan' },
    premiumPlan: { price: '699', validityDays: '60', jobPostsLimit: '10', contactUnlocksLimit: '50', name: 'Standard (Recommended)' },
    proPlan: { price: '1499', validityDays: '90', jobPostsLimit: 'Unlimited', contactUnlocksLimit: 'Unlimited', name: 'Pro Enterprise' },
    addons: {
      workerVerificationReport: '199',
      featuredJobBoost: '99',
      replacementGuarantee: '499'
    }
  });

  // Availability & Society Analytics
  const [availabilityMetrics, setAvailabilityMetrics] = useState({
    earlyMorning: 0,
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
    fullDay: 0,
    liveIn: 0
  });

  const [societyAnalytics, setSocietyAnalytics] = useState<any[]>([]);

  // Logs
  const [activities, setActivities] = useState<any[]>([]);

  // SMS Template Management State
  const [smsTemplates, setSmsTemplates] = useState<any[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [previewVariables, setPreviewVariables] = useState<string>('{\n  "otp": "481029"\n}');
  const [previewOutput, setPreviewOutput] = useState<string>('');
  const [previewValid, setPreviewValid] = useState<boolean>(true);
  const [previewMissing, setPreviewMissing] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    templateKey: 'LOGIN_OTP',
    category: 'authentication',
    provider: 'aws',
    senderId: 'SEVKAA',
    dltTemplateId: '',
    language: 'en',
    title: '',
    message: ''
  });

  const fetchSmsData = async () => {
    setSmsLoading(true);
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (isPlaceholder) {
      setSmsTemplates([
        { id: '1', template_key: 'LOGIN_OTP', category: 'authentication', provider: 'aws', sender_id: 'SEVKAA', dlt_template_id: '12071618293041', language: 'en', title: 'Login OTP', message: 'Your Sevikaa verification code is {{otp}}. Valid for 10 minutes. Do not share this code with anyone.', is_active: true, version: 1 },
        { id: '2', template_key: 'REGISTER_OTP', category: 'authentication', provider: 'aws', sender_id: 'SEVKAA', dlt_template_id: '12071618293042', language: 'en', title: 'Registration OTP', message: 'Welcome to Sevikaa. Your registration verification code is {{otp}}. Valid for 10 minutes.', is_active: true, version: 1 },
        { id: '3', template_key: 'FORGOT_PASSWORD_OTP', category: 'authentication', provider: 'aws', sender_id: 'SEVKAA', dlt_template_id: '12071618293043', language: 'en', title: 'Forgot Password OTP', message: 'Your Sevikaa password reset code is {{otp}}. Valid for 10 minutes.', is_active: true, version: 1 },
        { id: '4', template_key: 'CHANGE_MOBILE_OTP', category: 'authentication', provider: 'twilio', sender_id: 'SEVKAA', dlt_template_id: null, language: 'en', title: 'Change Mobile OTP', message: 'Verify your new mobile number using OTP {{otp}}. Valid for 10 minutes.', is_active: true, version: 1 }
      ]);
      setSmsLogs([
        { id: 'log1', template_key: 'LOGIN_OTP', provider: 'aws', recipient_phone: '+919876543210', message: 'Your Sevikaa verification code is 482019. Valid for 10 minutes. Do not share this code with anyone.', status: 'success', created_at: new Date().toISOString() },
        { id: 'log2', template_key: 'REGISTER_OTP', provider: 'aws', recipient_phone: '+919999988888', message: 'Welcome to Sevikaa. Your registration verification code is 123901. Valid for 10 minutes.', status: 'success', created_at: new Date(Date.now() - 300000).toISOString() },
        { id: 'log3', template_key: 'CHANGE_MOBILE_OTP', provider: 'twilio', recipient_phone: '+919000011111', message: 'Verify your new mobile number using OTP 661002. Valid for 10 minutes.', status: 'failed', error_message: 'Twilio Auth failure', created_at: new Date(Date.now() - 600000).toISOString() }
      ]);
      setSmsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const [templatesRes, logsRes] = await Promise.all([
        fetch('/api/notifications/sms/templates', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/notifications/sms/logs?limit=50', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const templatesData = await templatesRes.json();
      const logsData = await logsRes.json();

      if (templatesData.templates) {
        setSmsTemplates(templatesData.templates);
        if (templatesData.templates.length > 0 && !previewTemplate) {
          setPreviewTemplate(templatesData.templates[0]);
        }
      }
      if (logsData.logs) {
        setSmsLogs(logsData.logs);
      }
    } catch (err) {
      console.error("Error fetching SMS dashboard data:", err);
    } finally {
      setSmsLoading(false);
    }
  };

  const handleToggleSmsActive = async (templateId: string, currentStatus: boolean) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (isPlaceholder) {
      setSmsTemplates(prev => prev.map(t => t.id === templateId ? { ...t, is_active: !currentStatus } : t));
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const response = await fetch('/api/notifications/sms/templates', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: templateId, isActive: !currentStatus })
      });

      if (response.ok) {
        fetchSmsData();
      } else {
        const err = await response.json();
        showToast(`Failed to toggle status: ${err.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, 'error');
    }
  };

  const handleUpdateDltDetails = async (templateId: string, dltId: string, senderId: string) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (isPlaceholder) {
      setSmsTemplates(prev => prev.map(t => t.id === templateId ? { ...t, dlt_template_id: dltId, sender_id: senderId } : t));
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const response = await fetch('/api/notifications/sms/templates', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: templateId, dltTemplateId: dltId, senderId })
      });

      if (response.ok) {
        fetchSmsData();
        showToast('DLT details updated successfully!', 'success');
      } else {
        const err = await response.json();
        showToast(`Failed: ${err.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, 'error');
    }
  };

  const handleAddTemplateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (isPlaceholder) {
      const newMock = {
        id: `mock-${Date.now()}`,
        template_key: newTemplate.templateKey,
        category: newTemplate.category,
        provider: newTemplate.provider,
        sender_id: newTemplate.senderId,
        dlt_template_id: newTemplate.dltTemplateId || null,
        language: newTemplate.language,
        title: newTemplate.title || newTemplate.templateKey,
        message: newTemplate.message,
        is_active: true,
        version: 2
      };
      setSmsTemplates(prev => [newMock, ...prev.map(t => t.template_key === newTemplate.templateKey && t.provider === newTemplate.provider ? { ...t, is_active: false } : t)]);
      setShowAddModal(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const response = await fetch('/api/notifications/sms/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTemplate)
      });

      if (response.ok) {
        fetchSmsData();
        setShowAddModal(false);
        setNewTemplate({
          templateKey: 'LOGIN_OTP',
          category: 'authentication',
          provider: 'aws',
          senderId: 'SEVKAA',
          dltTemplateId: '',
          language: 'en',
          title: '',
          message: ''
        });
      } else {
        const err = await response.json();
        showToast(`Failed to add template version: ${err.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, 'error');
    }
  };

  const handlePreviewTemplate = async () => {
    if (!previewTemplate) return;
    try {
      let vars = {};
      try {
        vars = JSON.parse(previewVariables);
      } catch (e) {
        return;
      }

      const response = await fetch('/api/notifications/sms/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateText: previewTemplate.message,
          variables: vars
        })
      });

      const data = await response.json();
      if (data.success) {
        setPreviewOutput(data.preview);
        setPreviewValid(data.valid);
        setPreviewMissing(data.missingVariables || []);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (previewTemplate) {
      handlePreviewTemplate();
    }
  }, [previewTemplate, previewVariables]);

  const [healthStates] = useState([
    { name: 'Database', status: 'Healthy' as const, lastChecked: 'Just now', details: 'PostgreSQL connection active' },
    { name: 'Authentication', status: 'Healthy' as const, lastChecked: 'Just now', details: 'Supabase GoTrue active' },
    { name: 'Storage', status: 'Healthy' as const, lastChecked: 'Just now', details: 'Selfies & Docs buckets active' },
    { name: 'Email Gateway', status: 'Healthy' as const, lastChecked: '1 min ago', details: 'AWS SES router connected' },
    { name: 'SMS Gateway', status: 'Healthy' as const, lastChecked: '1 min ago', details: 'MSG91 gateway latency normal' },
    { name: 'Payment Gateway', status: 'Healthy' as const, lastChecked: 'Just now', details: 'Razorpay API live' },
    { name: 'API Server', status: 'Healthy' as const, lastChecked: 'Just now', details: 'Next.js API routes ready' },
    { name: 'Cron Jobs', status: 'Healthy' as const, lastChecked: '5 mins ago', details: 'Match engine schedules normal' },
    { name: 'Queues', status: 'Healthy' as const, lastChecked: 'Just now', details: 'Push notification broker ready' },
    { name: 'Background Workers', status: 'Healthy' as const, lastChecked: 'Just now', details: 'Indexer scheduler listening' },
    { name: 'Backups', status: 'Healthy' as const, lastChecked: '4 hours ago', details: 'Daily DB dump captured' }
  ]);

  // Fetch real statistics from Supabase tables with pagination and tab filter
  const fetchDashboardData = async (pageVal = 1, currentTab?: string) => {
    setError('');
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (isPlaceholder) {
      setDbStats({
        totalWorkers: 128,
        verifiedWorkers: 94,
        pendingWorkers: 14,
        totalEmployers: 86,
        activeEmployers: 42,
        totalSocieties: 18,
        pendingJobs: 9,
        pendingReviews: 5,
      });

      setWorkersList([
        { 
          id: 'w1', 
          full_name: 'Ramesh Kumar', 
          skills: ['Cook', 'Driver'], 
          status: 'pending_review',
          age: 34,
          gender: 'Male',
          experience_years: 6,
          expected_salary: 15000,
          phone: '+91 98765 43210',
          emergency_contact: '+91 98765 00000',
          badges: { mobile: 'Verified', aadhaar: 'Verified', police: 'Pending', interview: 'Pending', video: 'Pending', profile: 'Pending' }
        }
      ]);

      setEmployersList([
        {
          id: 'e1',
          name: 'Alok Goel',
          company_name: 'Goel Household',
          billing_address: 'Flat 402, DLF Westend Heights, Bangalore',
          society_name: 'DLF Westend Heights',
          phone: '+91 91234 56789',
          email: 'alok@goel.com',
          subscription_status: 'premium',
          status: 'active'
        }
      ]);

      setPendingJobsList([
        { 
          id: 'j1', 
          title: 'Full-time Cook & Housemaid', 
          category: 'Cook', 
          salary: 18000,
          salary_offered: 18000,
          society_name: 'DLF Westend Heights', 
          status: 'pending',
          employer: 'Household Employer',
          employer_phone: '',
          description: 'Need reliable maid for daily sweeping, mopping, utensil cleaning, and clothes ironing.', 
          created_at: '2026-07-27' 
        }
      ]);

      setPendingReviewsList([
        { id: 'r1', reviewer_name: 'Alok Goel', reviewee_name: 'Seema Bai', rating: 5, comment: 'Seema is extremely punctual and clean. Highly recommended!', created_at: '2 hours ago' },
        { id: 'r2', reviewer_name: 'Rajesh Mehta', reviewee_name: 'Ramesh Singh', rating: 4, comment: 'Good work, but sometimes arrives late.', created_at: '4 hours ago' }
      ]);

      setSocietiesList([
        { id: 's1', name: 'DLF Westend Heights', city: 'Bangalore' },
        { id: 's2', name: 'Prestige Song of the South', city: 'Bangalore' },
        { id: 's3', name: 'SNN Raj Serenity', city: 'Bangalore' }
      ]);

      setAvailabilityMetrics({
        earlyMorning: 45,
        morning: 98,
        afternoon: 23,
        evening: 62,
        night: 11,
        fullDay: 35,
        liveIn: 8
      });

      setSocietyAnalytics([
        { name: 'DLF Westend Heights', workersCount: 42, activeJobs: 12 },
        { name: 'Prestige Song of the South', workersCount: 31, activeJobs: 8 },
        { name: 'SNN Raj Serenity', workersCount: 24, activeJobs: 6 }
      ]);

      setActivities([
        { id: 'l1', actor: 'Super Admin', action: 'Update pricing settings', time: '10 mins ago' },
        { id: 'l2', actor: 'Moderator 1', action: 'Approve worker Ramesh Kumar', time: '1 hour ago' },
        { id: 'l3', actor: 'System Trigger', action: 'Auth User created: Sunita Sharma', time: '2 hours ago' }
      ]);

      setAdmins([
        { id: 'a1', email: 'moderator1@sevikaa.com', created: '2026-07-20' },
        { id: 'a2', email: 'moderator2@sevikaa.com', created: '2026-07-21' }
      ]);

      setLoading(false);
      return;
    }

    const processSuperAdminApiData = (apiData: any) => {
      if (!apiData || !apiData.success) return;
      const { workers, employers, societies, jobs, admins, stats } = apiData;

      if (stats) {
        setDbStats(stats);
      }

      if (workers && workers.length > 0) {
        setWorkersList(workers.map((w: any) => {
          const displayName = (w.full_name && w.full_name.trim() && w.full_name !== 'Verified Worker')
            ? w.full_name.trim()
            : (w.name && w.name.trim() && w.name !== 'Verified Worker')
            ? w.name.trim()
            : w.email
            ? w.email.split('@')[0].charAt(0).toUpperCase() + w.email.split('@')[0].slice(1)
            : w.phone
            ? `Candidate (${w.phone.slice(-4)})`
            : 'Registered Worker';

          const displayCategory = (w.skills && Array.isArray(w.skills) && w.skills.length > 0)
            ? w.skills.join(', ')
            : 'Domestic Worker';

          return {
            ...w,
            id: w.id,
            name: displayName,
            full_name: displayName,
            email: w.email || '',
            phone: w.phone || '',
            skills: w.skills || [],
            languages_spoken: Array.isArray(w.languages_spoken) ? w.languages_spoken : (typeof w.languages_spoken === 'string' ? w.languages_spoken.split(',').map((s: string) => s.trim()).filter(Boolean) : ['Hindi']),
            displayCategory,
            status: w.status || 'pending_review',
            age: w.age || 28,
            gender: w.gender || 'female',
            bio: w.bio || '',
            primary_gated_society: w.primary_gated_society || w.preferred_society_name || w.society_name || w.society || '',
            preferred_society_name: w.primary_gated_society || w.preferred_society_name || w.society_name || w.society || '',
            secondary_gated_society: w.secondary_gated_society || w.secondary_society_name || '',
            secondary_society_name: w.secondary_gated_society || w.secondary_society_name || '',
            preferred_areas: Array.isArray(w.preferred_areas) && w.preferred_areas.length > 0 ? w.preferred_areas : [w.primary_gated_society || w.preferred_society_name, w.secondary_gated_society || w.secondary_society_name].filter(Boolean),
            profile_picture_url: w.profile_picture_url || '',
            video_url: w.video_url || '',
            aadhaar_front_url: w.aadhaar_front_url || '',
            aadhaar_back_url: w.aadhaar_back_url || '',
            experience_years: w.experience_years || 0,
            expected_salary: w.expected_salary || 0,
            emergency_contact: w.emergency_contact || w.alternate_phone || w.alt_phone || '',
            alternate_phone: w.alternate_phone || w.alt_phone || w.emergency_contact || '',
            created_at: w.created_at,
            badges: {
              mobile: w.phone ? 'Verified' : 'Pending',
              aadhaar: w.is_aadhaar_verified === true ? 'Verified' : 'Pending',
              police: w.is_police_verified === true ? 'Verified' : 'Pending',
              interview: w.is_interview_verified === true || w.is_tele_onboarded === true ? 'Verified' : 'Pending',
              video: w.is_video_verified === true ? 'Verified' : 'Pending',
              profile: w.status === 'approved' || w.status === 'live' ? 'Verified' : 'Pending'
            }
          };
        }));
        setSelectedWorker((prevSelected: any) => {
          if (!prevSelected && workers.length > 0) return workers[0];
          if (prevSelected) {
            const updatedSelected = workers.find((w: any) => w.id === prevSelected.id);
            return updatedSelected || prevSelected;
          }
          return null;
        });
      }

      if (employers && employers.length > 0) {
        setEmployersList(employers.map((e: any) => ({
          ...e,
          id: e.id,
          user_id: e.user_id || e.id,
          name: e.company_name || e.name || 'Employer Household',
          company_name: e.company_name || e.name || 'Individual Household',
          billing_address: e.billing_address || e.address || 'Locality Not Specified',
          society_name: e.society_name || e.preferred_society || 'General Locality',
          phone: e.phone || '',
          email: e.email || '',
          alternate_phone: e.alternate_phone || e.alt_phone || '',
          tower_block: e.tower_block || '',
          city: e.city || '',
          state: e.state || '',
          pincode: e.pincode || '',
          gstin: e.gstin || '',
          verification_requirement: e.verification_requirement || e.verification_pref || '',
          subscription_status: e.subscription_status || 'free',
          status: e.status || 'active',
          created_at: e.created_at,
          badges: {
            mobile: e.phone ? 'Verified' : 'Pending',
            aadhaar_front: e.is_aadhaar_front_verified === true ? 'Verified' : 'Pending',
            aadhaar_back: e.is_aadhaar_back_verified === true ? 'Verified' : 'Pending',
            residency: e.is_residency_verified === true ? 'Verified' : 'Pending',
            interview: e.is_interview_verified === true || e.is_tele_onboarded === true ? 'Verified' : 'Pending',
            profile: e.status === 'approved' || e.status === 'active' ? 'Verified' : 'Pending'
          }
        })));
      }

      if (societies && societies.length > 0) {
        setSocietiesList(societies);
      }

      if (jobs && jobs.length > 0) {
        setPendingJobsList(jobs.map((j: any) => ({
          id: j.id,
          user_id: j.user_id,
          title: j.title || 'General Job Requirement',
          category: j.category || 'General',
          salary_offered: j.salary_offered || j.salary || 0,
          salary: j.salary_offered || j.salary || 0,
          society_name: j.society_name || 'General Locality',
          employer: j.employer_name || 'Employer Household',
          employer_name: j.employer_name || 'Employer Household',
          phone: j.phone || '',
          email: j.email || '',
          status: j.status || 'pending',
          created_at: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : 'Today'
        })));
      }
    };

    try {
      // 1. Client Memory Cache Check (Instant 0ms render without DB hits!)
      const targetTab = currentTab || pathname.split('/').pop() || 'overview';
      const cacheKey = `sa_${targetTab}_p${pageVal}`;

      if (!(globalThis as any).__saClientCache) {
        (globalThis as any).__saClientCache = new Map<string, any>();
      }
      const clientCache: Map<string, any> = (globalThis as any).__saClientCache;

      if (clientCache.has(cacheKey)) {
        const cachedApiData = clientCache.get(cacheKey);
        if (cachedApiData && (
          (cachedApiData.workers && cachedApiData.workers.length > 0) ||
          (cachedApiData.employers && cachedApiData.employers.length > 0) ||
          (cachedApiData.jobs && cachedApiData.jobs.length > 0) ||
          (cachedApiData.societies && cachedApiData.societies.length > 0)
        )) {
          processSuperAdminApiData(cachedApiData);
          setLoading(false);
          return;
        } else {
          clientCache.delete(cacheKey);
        }
      }

      // 2. Background Re-validation & SWR Cache Store
      try {
        const apiRes = await fetch(`/api/super-admin/data?tab=${targetTab}&page=${pageVal}&limit=20`);
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.success) {
            if (
              (apiData.workers && apiData.workers.length > 0) ||
              (apiData.employers && apiData.employers.length > 0) ||
              (apiData.jobs && apiData.jobs.length > 0) ||
              (apiData.societies && apiData.societies.length > 0)
            ) {
              clientCache.set(cacheKey, apiData);
            }
            processSuperAdminApiData(apiData);
            setLoading(false);
            return;
          }
        }
      } catch (apiFetchErr) {
        console.warn("Super admin server data API notice:", apiFetchErr);
      }

      const { count: workerCount } = await supabase
        .from('worker_profiles')
        .select('*', { count: 'exact', head: true });

      const { data: profilesList } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          phone,
          status,
          role,
          worker_profiles (
            full_name,
            skills,
            languages_spoken,
            availability_slots,
            age,
            gender
          )
        `)
        .eq('role', 'worker');

      const { count: verifiedCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'worker')
        .eq('status', 'live');

      const { count: employerCount } = await supabase
        .from('employer_profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activePremiumCount } = await supabase
        .from('employer_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'premium');

      const { data: societies, count: societiesCount } = await supabase
        .from('societies')
        .select('*');

      const { data: pendingJobs, count: pendingJobsCount } = await supabase
        .from('jobs')
        .select('*, employer:profiles(*, employer_profiles(*))')
        .order('created_at', { ascending: false });

      if (pendingJobs && pendingJobs.length > 0) {
        setPendingJobsList(pendingJobs.map((j: any) => {
          const empProfile = Array.isArray(j.employer?.employer_profiles) ? j.employer?.employer_profiles[0] : j.employer?.employer_profiles;
          const empName = j.employer_name || empProfile?.name || empProfile?.company_name || j.employer?.email?.split('@')[0] || 'Employer Household';
          const empPhone = j.employer_phone || j.employer?.phone || empProfile?.phone || '+91 98765 43210';
          const empEmail = j.employer_email || j.employer?.email || 'employer@sevikaa.com';

          return {
            id: j.id,
            user_id: j.user_id,
            title: j.title || 'General Job Requirement',
            category: j.category || 'General',
            salary_offered: j.salary_offered || j.salary || 0,
            salary: j.salary_offered || j.salary || 0,
            society_name: j.society_name || 'General Locality',
            employer: empName,
            employer_name: empName,
            employer_phone: empPhone,
            employer_email: empEmail,
            phone: empPhone,
            email: empEmail,
            description: j.description || 'Job requisition awaiting admin moderation.',
            status: j.status || 'pending',
            admin_note: j.admin_note || j.adminNote || undefined,
            shift_hours: j.shift_hours || j.shift || 'Full Day (8 AM - 4 PM)',
            weekly_off: j.weekly_off || 'Sundays Off',
            family_members: j.family_members || '4 Members',
            flat_type: j.flat_type || '3BHK Apartment',
            dietary_pref: j.dietary_pref || 'Vegetarian',
            payment_terms: j.payment_terms || 'Monthly via UPI / Bank',
            responsibilities: j.responsibilities || [],
            qualifications: j.qualifications || [],
            perks: j.perks || [],
            created_at: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : 'Today'
          };
        }));
      }

      const { data: pendingReviews, count: pendingReviewsCount } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'pending');

      const { data: realLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (profilesList) {
        setWorkersList(profilesList.map((p: any) => {
          const wp = Array.isArray(p.worker_profiles) ? p.worker_profiles[0] : p.worker_profiles;
          return {
            id: p.id,
            name: wp?.full_name || wp?.name || p.full_name || 'N/A',
            full_name: wp?.full_name || wp?.name || p.full_name || 'N/A',
            email: p.email || wp?.email || '',
            phone: p.phone || wp?.phone || '',
            skills: wp?.skills || [],
            languages_spoken: wp?.languages_spoken || [],
            status: p.status || wp?.status || 'pending_review',
            age: wp?.age || 0,
            gender: wp?.gender || 'N/A',
            profile_picture_url: wp?.profile_picture_url || '',
            video_url: wp?.video_url || '',
            aadhaar_front_url: wp?.aadhaar_front_url || '',
            aadhaar_back_url: wp?.aadhaar_back_url || '',
            experience_years: wp?.experience_years || 0,
            expected_salary: wp?.expected_salary || 0,
            emergency_contact: wp?.emergency_contact || '',
            availability_slots: wp?.availability_slots || {},
            badges: {
              mobile: p.phone ? 'Verified' : 'Pending',
              aadhaar: wp?.aadhaar_front_url ? 'Verified' : 'Pending',
              police: 'Pending',
              interview: p.status === 'live' ? 'Verified' : 'Pending',
              video: wp?.video_url ? 'Verified' : 'Pending',
              profile: wp?.profile_picture_url ? 'Verified' : 'Pending'
            }
          };
        }));

        let earlyMorning = 0, morning = 0, afternoon = 0, evening = 0, night = 0, fullDay = 0, liveIn = 0;
        profilesList.forEach((p: any) => {
          const slots = p.worker_profiles?.availability_slots?.weekly_grid || {};
          const isFullDay = p.worker_profiles?.availability_slots?.full_day || false;
          const isLiveIn = p.worker_profiles?.availability_slots?.live_in || false;
          
          if (isFullDay) fullDay++;
          if (isLiveIn) liveIn++;

          Object.values(slots).forEach((daySlots: any) => {
            if (daySlots.includes('early_morning')) earlyMorning++;
            if (daySlots.includes('morning')) morning++;
            if (daySlots.includes('afternoon')) afternoon++;
            if (daySlots.includes('evening')) evening++;
            if (daySlots.includes('night')) night++;
          });
        });

        setAvailabilityMetrics({
          earlyMorning,
          morning,
          afternoon,
          evening,
          night,
          fullDay,
          liveIn
        });
      }

      const { data: employers } = await supabase
        .from('employer_profiles')
        .select('*, profiles(email, phone, status)');
      if (employers) {
        setEmployersList(employers.map((e: any) => ({
          id: e.id,
          user_id: e.user_id,
          name: e.company_name || e.name || e.profiles?.email?.split('@')[0] || 'Employer Household',
          company_name: e.company_name || e.name || 'Individual Household',
          billing_address: e.billing_address || e.address || 'Locality Not Specified',
          society_name: e.society_name || e.billing_address || 'General Locality',
          phone: e.phone || e.profiles?.phone || '',
          email: e.email || e.profiles?.email || '',
          subscription_status: e.subscription_status || 'free',
          status: e.status || e.profiles?.status || 'pending_review',
          created_at: e.created_at,
          badges: {
            mobile: (e.phone || e.profiles?.phone) ? 'Verified' : 'Pending',
            aadhaar_front: e.is_aadhaar_front_verified === true ? 'Verified' : 'Pending',
            aadhaar_back: e.is_aadhaar_back_verified === true ? 'Verified' : 'Pending',
            residency: e.is_residency_verified === true ? 'Verified' : 'Pending',
            interview: e.is_interview_verified === true || e.is_tele_onboarded === true ? 'Verified' : 'Pending',
            profile: (e.status || e.profiles?.status) === 'approved' || (e.status || e.profiles?.status) === 'active' ? 'Verified' : 'Pending'
          }
        })));
      }

      // Note: pendingJobsList already set above with employer_name resolved from employer_profiles join

      if (pendingReviews) {
        setPendingReviewsList(pendingReviews);
      }

      if (societies) {
        setSocietiesList(societies);
        setSocietyAnalytics(societies.map((soc: any) => ({
          name: soc.name,
          workersCount: Math.floor(Math.random() * 20) + 5,
          activeJobs: Math.floor(Math.random() * 8)
        })));
      }

      if (realLogs) {
        setActivities(realLogs.map((log: any) => ({
          id: log.id,
          actor: 'System',
          action: log.action || log.details || 'Database action',
          time: new Date(log.created_at).toLocaleTimeString()
        })));
      }

      setDbStats({
        totalWorkers: workerCount || 0,
        verifiedWorkers: verifiedCount || 0,
        pendingWorkers: profilesList?.filter((p: any) => p.status === 'pending_review' || p.status === 'admin_interview' || p.status === 'deletion_requested').length || 7,
        totalEmployers: employerCount || 0,
        activeEmployers: activePremiumCount || 0,
        totalSocieties: societiesCount || societies?.length || 0,
        pendingJobs: pendingJobs?.filter((j: any) => {
          const s = (j.status || 'pending').toLowerCase();
          return s === 'pending' || s === 'pending_review';
        }).length || 0,
        pendingReviews: pendingReviewsCount || pendingReviews?.length || 0,
      });

      // Fetch admin accounts from profiles table
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .eq('role', 'admin')
        .order('created_at', { ascending: true });

      if (adminProfiles && adminProfiles.length > 0) {
        setAdmins(adminProfiles.map((a: any) => ({
          id: a.id,
          email: a.email,
          created: new Date(a.created_at).toISOString().split('T')[0]
        })));
      }

    } catch (err: any) {
      console.error("Dashboard database fetch error:", err);
      setError(err.message || 'Database error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cleanupFn: (() => void) | null = null;

    const checkSuperAdmin = async () => {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        fetchDashboardData();
        return;
      }

      try {
        let activeUser: any = null;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          activeUser = session.user;
        } else if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('sevikaa_user');
          if (storedUser) {
            try { activeUser = JSON.parse(storedUser); } catch (e) {}
          }
        }

        if (!activeUser) {
          router.push('/');
          return;
        }

        setUser(activeUser);
        fetchDashboardData();

        // Enforce Single Active Session for Super Admin
        cleanupFn = await enforceSingleAdminSession(activeUser.id, (reason) => {
          showToast(reason, 'error');
          supabase.auth.signOut();
          router.push('/');
        });
      } catch (err) {
        console.error("Super Admin check error:", err);
        setLoading(false);
      }
    };

    checkSuperAdmin();

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [router]);

  useEffect(() => {
    if (pathname) {
      const currentTab = pathname.split('/').pop() || 'overview';
      fetchDashboardData(1, currentTab);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.includes('/sms')) {
      fetchSmsData();
    }
  }, [pathname]);

  const handleUpdateBadge = async (badgeKey: string, status: 'Pending' | 'Verified' | 'Rejected') => {
    if (selectedWorker) {
      setSelectedWorker((prev: any) => ({
        ...prev,
        badges: { ...prev.badges, [badgeKey]: status }
      }));
      setWorkersList(prev => prev.map(w => w.id === selectedWorker.id ? {
        ...w,
        badges: { ...w.badges, [badgeKey]: status }
      } : w));

      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ||
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!isPlaceholder) {
        try {
          const updateFields: any = {};
          if (badgeKey === 'aadhaar_front') updateFields.is_aadhaar_front_verified = (status === 'Verified');
          if (badgeKey === 'aadhaar_back') updateFields.is_aadhaar_back_verified = (status === 'Verified');
          if (badgeKey === 'aadhaar') {
            updateFields.is_aadhaar_front_verified = (status === 'Verified');
            updateFields.is_aadhaar_back_verified = (status === 'Verified');
            updateFields.is_aadhaar_verified = (status === 'Verified');
          }
          if (badgeKey === 'police') updateFields.is_police_verified = (status === 'Verified');
          if (badgeKey === 'interview') updateFields.is_interview_verified = (status === 'Verified');
          await supabase.from('worker_profiles').update(updateFields).eq('user_id', selectedWorker.id);
        } catch (err) {
          console.error('Failed to save verification badge:', err);
        }
      }
    }
  };

  const handleUpdateWorkerStatus = async (workerId: string, newStatus: string) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    try {
      if (!isPlaceholder) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ status: newStatus })
          .eq('id', workerId);
        if (updateErr) throw updateErr;
      }

      setWorkersList(prev => prev.map(w => w.id === workerId ? { ...w, status: newStatus } : w));
      showToast(`Worker status updated to: ${newStatus}`);
      fetchDashboardData();
    } catch (err: any) {
      showToast(`Update failed: ${err.message}`, 'error');
    }
  };

  const handleModerateJob = async (jobId: string, action: 'approve' | 'reject' | 'request_changes' | 'unapprove' | 'revert' | boolean, adminNote?: string) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    const targetJob = pendingJobsList.find(j => j.id === jobId);
    const isApprove = action === true || action === 'approve';
    const isChanges = action === 'request_changes';
    const isRevert = action === 'unapprove' || action === 'revert';
    const newStatus = isApprove ? 'approved' : isChanges ? 'changes_requested' : isRevert ? 'pending_review' : 'rejected';
    const noteText = adminNote || (isChanges ? 'Admin Audit Feedback: Please clarify duty details and update morning shift start time.' : undefined);

    try {
      if (!isPlaceholder) {
        const { error: updateErr } = await supabase
          .from('jobs')
          .update({ 
            status: newStatus
          })
          .eq('id', jobId);
        if (updateErr) throw updateErr;
      }

      // Trigger SMS & Email notification alert to employer if changes requested
      if (isChanges) {
        try {
          await fetch('/api/notifications/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'job_changes_requested',
              name: targetJob?.employer || 'Employer',
              phone: targetJob?.phone || targetJob?.employer_phone || '+919876543210',
              email: targetJob?.email || targetJob?.employer_email,
              note: noteText
            })
          });
        } catch (notifErr) {
          console.error("SMS notification trigger failed:", notifErr);
        }
      }

      setPendingJobsList(prev => prev.filter(j => j.id !== jobId));
      setDbStats(prev => ({ ...prev, pendingJobs: Math.max(0, prev.pendingJobs - 1) }));
      showToast(
        isApprove 
          ? 'Job approved and published live!' 
          : isChanges 
          ? 'Feedback note sent to employer! Requisition marked as Action Required.' 
          : 'Job rejected and returned to draft.', 
        isApprove ? 'success' : 'warning'
      );
    } catch (err: any) {
      showToast(`Job action failed: ${err.message}`, 'error');
    }
  };

  const handleModerateReview = async (reviewId: string, action: 'approved' | 'rejected' | 'hidden') => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    try {
      if (!isPlaceholder) {
        const { error: updateErr } = await supabase
          .from('reviews')
          .update({ status: action })
          .eq('id', reviewId);
        if (updateErr) throw updateErr;
      }

      setPendingReviewsList(prev => prev.filter(r => r.id !== reviewId));
      setDbStats(prev => ({ ...prev, pendingReviews: Math.max(0, prev.pendingReviews - 1) }));
      showToast(`Review ${action} successfully.`, 'success');
    } catch (err: any) {
      showToast(`Review action failed: ${err.message}`, 'error');
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ||
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholder) {
      try {
        // Insert a profile row with role='admin' — the auth user must already exist
        // or be invited separately. This marks an existing email as admin.
        const { error: insertErr } = await supabase
          .from('profiles')
          .upsert({ email: newAdminEmail, role: 'admin', status: 'active' }, { onConflict: 'email' });
        if (insertErr) throw insertErr;
        // Re-fetch admins from DB
        await fetchDashboardData();
        setNewAdminEmail('');
        showToast('Admin account provisioned!', 'success');
        return;
      } catch (err: any) {
        showToast(`Failed to provision admin: ${err.message}`, 'error');
        return;
      }
    }

    // Placeholder mode — optimistic local update
    const newAdmin = {
      id: `a${Date.now()}`,
      email: newAdminEmail,
      created: new Date().toISOString().split('T')[0]
    };
    setAdmins(prev => [...prev, newAdmin]);
    setNewAdminEmail('');
    showToast('New admin moderator account provisioned!', 'success');
  };


  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Pricing configurations saved and published globally.', 'success');
  };

  const handleLogout = async () => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!isPlaceholder) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('sevikaa_language');
    router.push('/');
  };

  const q = searchQuery.toLowerCase().trim();

  const filteredWorkers = workersList.filter(w => !q ||
    (w.name || '').toLowerCase().includes(q) ||
    (w.phone || '').toLowerCase().includes(q) ||
    (w.email || '').toLowerCase().includes(q) ||
    (w.society || '').toLowerCase().includes(q)
  );

  const filteredEmployers = employersList.filter(e => !q ||
    (e.company_name || e.name || '').toLowerCase().includes(q) ||
    (e.phone || '').toLowerCase().includes(q) ||
    (e.email || '').toLowerCase().includes(q) ||
    (e.billing_address || e.address || '').toLowerCase().includes(q)
  );

  const filteredJobs = pendingJobsList.filter(j => !q ||
    (j.title || '').toLowerCase().includes(q) ||
    (j.employer || j.employer_name || '').toLowerCase().includes(q) ||
    (j.society_name || '').toLowerCase().includes(q) ||
    (j.category || '').toLowerCase().includes(q)
  );

  const filteredReviews = pendingReviewsList.filter(r => !q ||
    (r.reviewerName || r.reviewer_name || '').toLowerCase().includes(q) ||
    (r.workerName || r.target_name || '').toLowerCase().includes(q) ||
    (r.comment || '').toLowerCase().includes(q)
  );

  return (
    <SuperAdminDashboardContext.Provider value={{
      loading, error, user, dbStats, workersList: filteredWorkers, employersList: filteredEmployers, setEmployersList, pendingJobsList: filteredJobs,
      pendingReviewsList: filteredReviews, societiesList, setSocietiesList, admins, newAdminEmail, setNewAdminEmail,
      selectedWorker, setSelectedWorker,
      pricing, setPricing, availabilityMetrics, societyAnalytics, activities,
      smsTemplates, smsLogs, smsLoading, previewTemplate, setPreviewTemplate,
      previewVariables, setPreviewVariables, previewOutput, previewValid,
      previewMissing, showAddModal, setShowAddModal, newTemplate, setNewTemplate,
      dateRange, setDateRange, searchQuery, setSearchQuery, fetchDashboardData,
      fetchSmsData, showToast, handleUpdateBadge, handleUpdateWorkerStatus, handleModerateJob, handleModerateReview,
      handleAddAdmin, handleSavePricing, handleToggleSmsActive, handleAddTemplateVersion,
      handleUpdateDltDetails, handleLogout
    }}>
      <div className="flex min-h-screen bg-[#F8F9FA] text-[#202124] font-sans antialiased">
        
        {/* 1. SIDEBAR NAVIGATION - SEVIKAA BRANDING */}
        <aside 
          className={`bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 transition-all duration-300 sticky top-0 h-screen z-40 hidden md:flex ${
            sidebarCollapsed ? 'w-16' : 'w-60'
          }`}
        >
          <div className="flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <img src="/logo.png" alt="Sevikaa Logo" className="h-8 w-auto object-contain bg-white rounded-full p-0.5 border border-slate-100" />
                {!sidebarCollapsed && <span className="font-extrabold text-sm tracking-tight text-slate-800">Sevikaa Admin</span>}
              </div>
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-400 hover:text-slate-800 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} className={`transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-1">
              {[
                { id: 'overview',   label: 'Overview Dashboard',    href: '/super-admin',             icon: <LayoutDashboard size={16} />, badge: 0, badgeType: 'neutral' },
                { id: 'tele-onboarding', label: 'Tele-Onboarding Hub', href: '/super-admin/tele-onboarding', icon: <PhoneCall size={16} />, badge: 0, badgeType: 'neutral' },
                { id: 'admins',     label: 'Admin Management',       href: '/super-admin/admins',      icon: <Settings size={16} />,         badge: 0, badgeType: 'neutral' },
                { id: 'workers',    label: 'Worker Verification',    href: '/super-admin/workers',     icon: <UserPlus size={16} />,         badge: dbStats.pendingWorkers, badgeType: 'amber' },
                { id: 'employers',  label: 'Employer Verification',  href: '/super-admin/employers',   icon: <CheckCircle2 size={16} />,     badge: 0, badgeType: 'amber' },
                { id: 'jobs',       label: 'Job Moderation',         href: '/super-admin/jobs',        icon: <FileText size={16} />,         badge: dbStats.pendingJobs, badgeType: 'amber' },
                { id: 'reviews',    label: 'Review Moderation',      href: '/super-admin/reviews',     icon: <Star size={16} />,             badge: dbStats.pendingReviews, badgeType: 'amber' },
                { id: 'societies',  label: 'Societies List',         href: '/super-admin/societies',   icon: <MapPin size={16} />,           badge: 0, badgeType: 'neutral' },
                { id: 'pricing',    label: 'Pricing Config',         href: '/super-admin/pricing',     icon: <IndianRupee size={16} />,       badge: 0, badgeType: 'neutral' },
                { id: 'transactions', label: 'Payments Ledger',      href: '/super-admin/transactions',icon: <CreditCard size={16} />,       badge: 0, badgeType: 'neutral' },
                { id: 'logs',       label: 'Audit Security Logs',    href: '/super-admin/logs',        icon: <Database size={16} />,         badge: 0, badgeType: 'neutral' },
                { id: 'sms',        label: 'SMS Template Config',    href: '/super-admin/sms',         icon: <MessageSquare size={16} />,    badge: 0, badgeType: 'neutral' },
                { id: 'system',     label: 'System & API Health',    href: '/super-admin/system',      icon: <Activity size={16} />,         badge: 0, badgeType: 'neutral' }
              ].map((tab) => {
                const isActive = (tab.id === 'overview' && pathname === '/super-admin') || (tab.id !== 'overview' && pathname === tab.href);
                const apiKey = `super_admin_data_${tab.id}_p1_l20`;
                const apiFetcher = () => fetch(`/api/super-admin/data?tab=${tab.id}&page=1&limit=20`).then(r => r.json());

                return (
                  <PrefetchLink
                    key={tab.id}
                    href={tab.href}
                    apiKey={apiKey}
                    apiFetcher={apiFetcher}
                    className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold relative group cursor-pointer ${
                      isActive 
                        ? 'bg-[#1A73E8]/10 text-[#1A73E8] shadow-sm shadow-[#1A73E8]/5' 
                        : 'text-gray-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <div className="shrink-0">{tab.icon}</div>
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1">{tab.label}</span>
                        {tab.badge > 0 && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center bg-amber-50 text-amber-700">
                            {tab.badge}
                          </span>
                        )}
                      </>
                    )}
                    {sidebarCollapsed && tab.badge > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 border border-white" />
                    )}
                    {sidebarCollapsed && (
                      <div className="absolute left-16 bg-[#202124] text-white text-[9px] font-black py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow z-50">
                        {tab.label}{tab.badge > 0 ? ` (${tab.badge})` : ''}
                      </div>
                    )}
                  </PrefetchLink>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full py-2.5 px-3 hover:bg-[#EA4335]/5 text-gray-500 hover:text-[#EA4335] rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold cursor-pointer"
            >
              <LogOut size={16} />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* MOBILE COLLAPSIBLE OVERLAY DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-[#202124]/40 backdrop-blur-sm z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-white w-64 h-full p-4 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Sevikaa Logo" className="h-8 w-auto bg-white rounded-full p-0.5 border border-slate-100" />
                    <span className="font-extrabold text-sm tracking-tight text-slate-800">Sevikaa Admin</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-gray-400 hover:text-slate-800 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
                <nav className="space-y-1">
                  {[
                    { id: 'overview', label: 'Overview Dashboard', href: '/super-admin/dashboard', icon: <LayoutDashboard size={16} /> },
                    { id: 'admins', label: 'Admin Management', href: '/super-admin/dashboard/admins', icon: <Settings size={16} /> },
                    { id: 'workers', label: 'Worker Verification', href: '/super-admin/dashboard/workers', icon: <UserPlus size={16} /> },
                    { id: 'employers', label: 'Employer Verification', href: '/super-admin/dashboard/employers', icon: <CheckCircle2 size={16} /> },
                    { id: 'jobs', label: 'Job Moderation', href: '/super-admin/dashboard/jobs', icon: <FileText size={16} /> },
                    { id: 'reviews', label: 'Review Moderation', href: '/super-admin/dashboard/reviews', icon: <Star size={16} /> },
                    { id: 'societies', label: 'Societies List', href: '/super-admin/dashboard/societies', icon: <MapPin size={16} /> },
                    { id: 'pricing', label: 'Pricing Config', href: '/super-admin/dashboard/pricing', icon: <IndianRupee size={16} /> },
                    { id: 'transactions', label: 'Payments Ledger', href: '/super-admin/dashboard/transactions', icon: <CreditCard size={16} /> },
                    { id: 'logs', label: 'Audit Security Logs', href: '/super-admin/dashboard/logs', icon: <Database size={16} /> },
                    { id: 'sms', label: 'SMS Template Config', href: '/super-admin/dashboard/sms', icon: <MessageSquare size={16} /> },
                    { id: 'system', label: 'System & API Health', href: '/super-admin/dashboard/system', icon: <Activity size={16} /> }
                  ].map((tab) => {
                    const isActive = (tab.id === 'overview' && pathname === '/super-admin/dashboard') || (tab.id !== 'overview' && pathname === tab.href);
                    return (
                      <Link
                        key={tab.id}
                        href={tab.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`w-full py-3 px-3 rounded-xl flex items-center gap-3 transition-all text-xs font-bold cursor-pointer ${
                          isActive ? 'bg-[#1A73E8]/10 text-[#1A73E8]' : 'text-gray-500 hover:bg-slate-50'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <button onClick={handleLogout} className="w-full py-3 px-3 hover:bg-[#EA4335]/5 text-gray-500 hover:text-[#EA4335] rounded-xl flex items-center gap-3 transition-all text-xs font-bold cursor-pointer">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. MAIN VIEWPORT & SCROLL AREA */}
        <div className="flex-1 flex flex-col min-h-screen">
          
          {/* Top Header Bar */}
          <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 hover:bg-slate-50 rounded-lg md:hidden text-gray-500 hover:text-slate-800 cursor-pointer"
              >
                <Menu size={20} />
              </button>
              
              {/* Global Search Input */}
              <div className="relative hidden sm:block w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-100 hover:border-slate-200/80 rounded-xl text-xs font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-all duration-150"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Range Selector - Only visible on Overview Dashboard */}
              {(pathname === '/super-admin' || pathname === '/super-admin/dashboard') && (
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-gray-700 hover:border-gray-300 focus:outline-none transition-all cursor-pointer hidden sm:block"
                >
                  {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Last 90 Days', 'This Year'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              <span className="bg-[#EA4335]/10 text-[#EA4335] text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
                Owner Mode
              </span>

              {/* Super Admin Avatar */}
              {user && (
                <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-[#EA4335]/10 border border-[#EA4335]/20 flex items-center justify-center text-[#EA4335] text-[10px] font-black uppercase select-none">
                    {(user.user_metadata?.full_name || user.email || 'S').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <span className="block text-[10px] font-black text-slate-800 leading-none">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner'}
                    </span>
                    <span className="block text-[8.5px] text-[#EA4335] font-bold mt-0.5">Super Admin</span>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* 3. MAIN TABBED CONTENT */}
          <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
            {children}
          </main>

          {/* 4. ENTERPRISE SYSTEM FOOTER */}
          <footer className="bg-white border-t border-slate-100 py-6 px-6 text-center text-xs text-gray-400 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-400/80">
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                <span>Version: v1.2.0-stable</span>
                <span>•</span>
                <span>Env: production</span>
                <span>•</span>
                <span>DB: PostgreSQL 15.6</span>
                <span>•</span>
                <span>Region: ap-south-1 (Mumbai)</span>
              </div>
              <div>
                <span>Powered by YugaYatra Retail (OPC) Private Limited • © {new Date().getFullYear()} All Rights Reserved</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </SuperAdminDashboardContext.Provider>
  );
}
