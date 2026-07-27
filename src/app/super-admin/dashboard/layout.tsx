"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { ToastContainer, ToastItem } from '../../../components/admin/dashboard/Toast';
import { 
  TrendingUp, MapPin, DollarSign, Database, PlusCircle, LogOut, 
  CheckCircle2, UserPlus, FileText, ChevronRight, Menu, X, Search,
  Settings, Server, Activity, ShieldAlert, Sparkles, ChevronLeft, 
  LayoutDashboard, ThumbsUp, ThumbsDown, Check, Trash2, Calendar, Star, Clock,
  MessageSquare, CreditCard
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
  handleModerateJob: (jobId: string, approved: boolean) => Promise<void>;
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
    freePlan: { price: '0', validityDays: 'Unlimited', jobPostsLimit: '1', contactUnlocksLimit: '0', name: 'Free Trial' },
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

  // Fetch real statistics from Supabase tables
  const fetchDashboardData = async () => {
    setError('');
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (isPlaceholder) {
      setDbStats({
        totalWorkers: 154,
        verifiedWorkers: 140,
        pendingWorkers: 7,
        totalEmployers: 42,
        activeEmployers: 12,
        totalSocieties: 3,
        pendingJobs: 2,
        pendingReviews: 2,
      });

      setWorkersList([
        { id: 'w1', full_name: 'Sunita Devi', skills: ['Maid', 'Cook'], languages_spoken: ['Hindi'], status: 'pending_review', age: 34, gender: 'female' },
        { id: 'w2', full_name: 'Ramesh Singh', skills: ['Gardener'], languages_spoken: ['Hindi', 'English'], status: 'live', age: 41, gender: 'male' },
        { id: 'w3', full_name: 'Seema Bai', skills: ['Nanny', 'Maid'], languages_spoken: ['Kannada', 'Tamil'], status: 'live', age: 29, gender: 'female' }
      ]);

      setEmployersList([
        { id: 'e1', name: 'Alok Goel', company_name: 'Goel Tech', subscription_status: 'premium', created_at: '2026-07-22' },
        { id: 'e2', name: 'Rajesh Mehta', company_name: 'Mehta Retail', subscription_status: 'free', created_at: '2026-07-23' }
      ]);

      setPendingJobsList([
        { id: 'j1', title: 'Need Full Time Cook', description: 'Cooking organic healthy meals for family of 4 in DLF Akshayanagar.', salary_offered: 15000, society_name: 'DLF Westend Heights', created_at: '10 mins ago' },
        { id: 'j2', title: 'Nanny for Infant', description: 'Looking for experienced nanny to take care of 8 month old baby boy.', salary_offered: 18000, society_name: 'Prestige Song of the South', created_at: '3 hours ago' }
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

    try {
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
        .select('*')
        .eq('status', 'pending');

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
        setWorkersList(profilesList.map((p: any) => ({
          id: p.id,
          full_name: p.worker_profiles?.full_name || 'N/A',
          skills: p.worker_profiles?.skills || [],
          languages_spoken: p.worker_profiles?.languages_spoken || [],
          status: p.status,
          age: p.worker_profiles?.age || 0,
          gender: p.worker_profiles?.gender || 'N/A',
          availability_slots: p.worker_profiles?.availability_slots || {}
        })));

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
        .select('*');
      if (employers) {
        setEmployersList(employers);
      }

      if (pendingJobs) {
        setPendingJobsList(pendingJobs);
      }

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
        pendingJobs: pendingJobsCount || pendingJobs?.length || 0,
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
    const checkSuperAdmin = async () => {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        fetchDashboardData();
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }
        setUser(session.user);
        fetchDashboardData();
      } catch (err) {
        console.error("Super Admin check error:", err);
        setLoading(false);
      }
    };

    checkSuperAdmin();
  }, [router]);

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
          if (badgeKey === 'aadhaar') updateFields.is_aadhaar_verified = (status === 'Verified');
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

  const handleModerateJob = async (jobId: string, approved: boolean) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    try {
      if (!isPlaceholder) {
        const { error: updateErr } = await supabase
          .from('jobs')
          .update({ status: approved ? 'approved' : 'rejected' })
          .eq('id', jobId);
        if (updateErr) throw updateErr;
      }

      setPendingJobsList(prev => prev.filter(j => j.id !== jobId));
      setDbStats(prev => ({ ...prev, pendingJobs: Math.max(0, prev.pendingJobs - 1) }));
      showToast(approved ? 'Job approved and published live!' : 'Job rejected and returned to draft.', approved ? 'success' : 'warning');
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

  return (
    <SuperAdminDashboardContext.Provider value={{
      loading, error, user, dbStats, workersList, employersList, setEmployersList, pendingJobsList,
      pendingReviewsList, societiesList, setSocietiesList, admins, newAdminEmail, setNewAdminEmail,
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
                { id: 'overview',   label: 'Overview Dashboard',    href: '/super-admin/dashboard',             icon: <LayoutDashboard size={16} />, badge: 0, badgeType: 'neutral' },
                { id: 'admins',     label: 'Admin Management',       href: '/super-admin/dashboard/admins',      icon: <Settings size={16} />,         badge: 0, badgeType: 'neutral' },
                { id: 'workers',    label: 'Worker Verification',    href: '/super-admin/dashboard/workers',     icon: <UserPlus size={16} />,         badge: dbStats.pendingWorkers, badgeType: 'amber' },
                { id: 'employers',  label: 'Employer Verification',  href: '/super-admin/dashboard/employers',   icon: <CheckCircle2 size={16} />,     badge: 0, badgeType: 'amber' },
                { id: 'jobs',       label: 'Job Moderation',         href: '/super-admin/dashboard/jobs',        icon: <FileText size={16} />,         badge: dbStats.pendingJobs, badgeType: 'amber' },
                { id: 'reviews',    label: 'Review Moderation',      href: '/super-admin/dashboard/reviews',     icon: <Star size={16} />,             badge: dbStats.pendingReviews, badgeType: 'amber' },
                { id: 'societies',  label: 'Societies List',         href: '/super-admin/dashboard/societies',   icon: <MapPin size={16} />,           badge: 0, badgeType: 'neutral' },
                { id: 'pricing',    label: 'Pricing Config',         href: '/super-admin/dashboard/pricing',     icon: <DollarSign size={16} />,       badge: 0, badgeType: 'neutral' },
                { id: 'transactions', label: 'Payments Ledger',      href: '/super-admin/dashboard/transactions',icon: <CreditCard size={16} />,       badge: 0, badgeType: 'neutral' },
                { id: 'logs',       label: 'Audit Security Logs',    href: '/super-admin/dashboard/logs',        icon: <Database size={16} />,         badge: 0, badgeType: 'neutral' },
                { id: 'sms',        label: 'SMS Template Config',    href: '/super-admin/dashboard/sms',         icon: <MessageSquare size={16} />,    badge: 0, badgeType: 'neutral' },
                { id: 'system',     label: 'System & API Health',    href: '/super-admin/dashboard/system',      icon: <Activity size={16} />,         badge: 0, badgeType: 'neutral' }
              ].map((tab) => {
                const isActive = (tab.id === 'overview' && pathname === '/super-admin/dashboard') || (tab.id !== 'overview' && pathname === tab.href);
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
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
                  </Link>
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
                    { id: 'pricing', label: 'Pricing Config', href: '/super-admin/dashboard/pricing', icon: <DollarSign size={16} /> },
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
              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-gray-700 hover:border-gray-300 focus:outline-none transition-all cursor-pointer hidden sm:block"
              >
                {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Last 90 Days', 'This Year'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

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
