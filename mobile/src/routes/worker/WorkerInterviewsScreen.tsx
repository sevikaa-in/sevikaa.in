import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, Linking, Modal, TextInput, Alert 
} from 'react-native';
import { 
  Calendar, MapPin, PhoneCall, Clock, CheckCircle2, 
  MessageSquare, Compass, Briefcase, Building2, Sparkles, 
  X, Send, ChevronRight, Star, Phone, AlertCircle
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useMobileLanguage } from '../../context/LanguageContext';

export const WorkerInterviewsScreen: React.FC<{ 
  user?: any; 
  onNavigateToJobs?: () => void; 
}> = ({ user, onNavigateToJobs }) => {
  const { t } = useMobileLanguage();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'applied' | 'history' | 'ratings'>('upcoming');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Reschedule Modal State
  const [selectedAppForReschedule, setSelectedAppForReschedule] = useState<any | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('Tomorrow Afternoon (2:00 PM)');
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  // Rate Employer Modal State
  const [selectedEmployerForReview, setSelectedEmployerForReview] = useState<any | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [completedReviews, setCompletedReviews] = useState<any[]>([]);

  // Time slot options for Reschedule
  const timeSlotOptions = [
    'Tomorrow Morning (10:00 AM)',
    'Tomorrow Afternoon (2:00 PM)',
    'Tomorrow Evening (5:00 PM)',
    'Day After Tomorrow Morning (11:00 AM)',
    'Weekend Saturday Morning (10:30 AM)',
  ];

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id || user?.id;

      if (activeUserId) {
        const { data: dbApps } = await supabase
          .from('applications')
          .select('*, jobs(*)')
          .eq('worker_id', activeUserId);

        if (dbApps && dbApps.length > 0) {
          const mappedApps = dbApps.map((a: any) => ({
            id: a.id,
            jobTitle: a.jobs?.title || a.job_title || 'Domestic Worker Job',
            employerName: a.jobs?.employer_name || a.employer_name || 'Household Employer',
            society: a.jobs?.society_name || a.society_name || 'Residential Society',
            salary: a.jobs?.salary_offered 
              ? `${Number(a.jobs.salary_offered).toLocaleString('en-IN')}` 
              : a.salary 
              ? `${Number(a.salary).toLocaleString('en-IN')}` 
              : '15,000',
            shift: a.jobs?.shift_hours || a.shift_hours || 'Full Day',
            status: a.status || 'interview_scheduled',
            interviewTime: a.interview_time || 'Tomorrow, 10:30 AM',
            interviewMode: a.interview_mode || 'phone',
            employerPhone: a.jobs?.employer_phone || a.employer_phone || '+91 98765 43210',
            date: a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : 'Recently'
          }));
          setApplications(mappedApps);
        } else {
          setApplications([]);
        }

        const { data: dbReviews } = await supabase
          .from('reviews')
          .select('*')
          .eq('worker_id', activeUserId);

        if (dbReviews && dbReviews.length > 0) {
          setCompletedReviews(dbReviews.map((r: any) => ({
            id: r.id,
            employerName: r.employer_name || 'Employer',
            rating: r.rating || 5,
            comment: r.comment || '',
            date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : 'Recently'
          })));
        }
      } else {
        // No authenticated worker ID – show no interviews
        setApplications([]);
      }
    } catch (err) {
      console.warn("Applications fetch notice:", err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingInterviews = useMemo(() => {
    return applications.filter(a => a.status === 'interview_scheduled' || a.status === 'confirmed');
  }, [applications]);

  const appliedJobs = useMemo(() => {
    return applications.filter(a => a.status === 'under_review' || a.status === 'pending');
  }, [applications]);

  const historyInterviews = useMemo(() => {
    return applications.filter(a => a.status === 'hired' || a.status === 'rejected' || a.status === 'completed');
  }, [applications]);

  const displayedList = useMemo(() => {
    if (activeTab === 'upcoming') return upcomingInterviews;
    if (activeTab === 'applied') return appliedJobs;
    return historyInterviews;
  }, [activeTab, upcomingInterviews, appliedJobs, historyInterviews]);

  const handleConfirmAttendance = async (app: any) => {
    try {
      if (app.id && !app.id.startsWith('app-')) {
        await supabase
          .from('applications')
          .update({ status: 'confirmed' })
          .eq('id', app.id);
      }
    } catch (err) {
      console.warn("Confirm attendance DB notice:", err);
    }
    setApplications(prev => prev.map(item => item.id === app.id ? { ...item, status: 'confirmed' } : item));
    showToast(`Attendance confirmed for interview with ${app.employerName || 'Employer'}! 🟢`);
  };

  const handleCallEmployer = (phone: string) => {
    const cleanPhone = (phone || '+91 98765 43210').replace(/\s+/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleWhatsAppChat = (phone: string, app: any) => {
    const cleanPhone = (phone || '+91 98765 43210').replace(/\+/g, '').replace(/\s+/g, '');
    const message = encodeURIComponent(
      `Namaste ${app.employerName || 'Employer'}, I am contacting you regarding our Sevikaa interview for ${app.jobTitle} at ${app.society}.`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`);
  };

  const handleNavigateGoogleMaps = (society: string) => {
    const destination = encodeURIComponent(society || 'Bangalore');
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedAppForReschedule) return;
    setIsSubmittingReschedule(true);
    try {
      if (selectedAppForReschedule.id && !selectedAppForReschedule.id.startsWith('app-')) {
        await supabase
          .from('applications')
          .update({ 
            status: 'rescheduled',
            reschedule_time: rescheduleTime,
            reschedule_note: rescheduleNote 
          })
          .eq('id', selectedAppForReschedule.id);
      }
    } catch (err) {
      console.warn("Reschedule DB notice:", err);
    } finally {
      setIsSubmittingReschedule(false);
      setSelectedAppForReschedule(null);
      setRescheduleNote('');
      showToast("Reschedule Request Sent! 🟢 Admin & Employer will review slot.");
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedEmployerForReview) return;
    setIsSubmittingReview(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id || user?.id;

      if (activeUserId) {
        await supabase
          .from('reviews')
          .insert([{
            worker_id: activeUserId,
            employer_name: selectedEmployerForReview.employerName,
            rating: ratingStars,
            comment: reviewComment,
            created_at: new Date().toISOString()
          }]);
      }
    } catch (err) {
      console.warn("Submit review DB notice:", err);
    } finally {
      setIsSubmittingReview(false);
      const newRev = {
        id: `rev-${Date.now()}`,
        employerName: selectedEmployerForReview.employerName,
        rating: ratingStars,
        comment: reviewComment || 'Great working experience with respectful household.',
        date: 'Just now'
      };
      setCompletedReviews(prev => [newRev, ...prev]);
      setSelectedEmployerForReview(null);
      setReviewComment('');
      setRatingStars(5);
      showToast(`Review Submitted! ⭐ Thank you for rating ${newRev.employerName}!`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMsg && (
        <View style={styles.floatingToast}>
          <CheckCircle2 size={16} color="#34D399" />
          <Text style={styles.floatingToastText}>{toastMsg}</Text>
        </View>
      )}
      
      {/* PAGE HEADER */}
      <View style={styles.pageHeader}>
        <View style={styles.eyebrowPill}>
          <Calendar size={11} color="#1A73E8" />
          <Text style={styles.eyebrowText}>
            {t('workerInterviewsEyebrow', 'INTERVIEW SCHEDULER & STATUS TRACKER')}
          </Text>
        </View>

        <View style={styles.pageTitleRow}>
          <Calendar size={18} color="#1A73E8" />
          <Text style={styles.pageTitle}>
            {t('scheduledInterviewsTitle', 'Scheduled Interviews')}
          </Text>
        </View>
        
        <Text style={styles.pageSub}>
          {t('scheduledInterviewsSub', 'Manage upcoming household employer calls, society gate meetings, and track your job application progress.')}
        </Text>
      </View>

      {/* 🌟 1. HERO PIPELINE BANNER (100% MATCH WITH WEB GRADIENT & STATS) */}
      <View style={styles.heroBanner}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>
            {t('livePipelineBadge', 'LIVE APPLICATION PIPELINE')}
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          {upcomingInterviews.length > 0 
            ? `${upcomingInterviews.length} ${upcomingInterviews.length > 1 ? t('upcomingCountTitlePlural', 'Upcoming Household Interviews') : t('upcomingCountTitle', 'Upcoming Household Interview')}`
            : t('noUpcomingInterviewsToday', 'No Upcoming Interviews Today')}
        </Text>

        {/* Compact Stat Pills Bar */}
        <View style={styles.statPillsBar}>
          <View style={styles.statPillItem}>
            <Text style={styles.statPillLabel}>{t('statInterviews', 'Interviews')}:</Text>
            <Text style={[styles.statPillVal, { color: '#FCD34D' }]}>{upcomingInterviews.length}</Text>
          </View>
          <View style={styles.statPillDivider} />

          <View style={styles.statPillItem}>
            <Text style={styles.statPillLabel}>{t('statReview', 'Review')}:</Text>
            <Text style={[styles.statPillVal, { color: '#FFFFFF' }]}>{appliedJobs.length}</Text>
          </View>
          <View style={styles.statPillDivider} />

          <View style={styles.statPillItem}>
            <Text style={styles.statPillLabel}>{t('statHired', 'Hired')}:</Text>
            <Text style={[styles.statPillVal, { color: '#4ADE80' }]}>
              {historyInterviews.filter(h => h.status === 'hired').length}
            </Text>
          </View>
        </View>
      </View>

      {/* 📊 2. SCROLLABLE TAB FILTERS (UPCOMING, APPLIED, HIRED & HISTORY, RATE EMPLOYERS) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScrollView}>
        <View style={styles.tabsRow}>
          
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Calendar size={13} color={activeTab === 'upcoming' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabBtnText, activeTab === 'upcoming' && styles.tabBtnTextActive]}>
              {t('tabUpcoming', 'Upcoming')} ({upcomingInterviews.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'applied' && styles.tabBtnActive]}
            onPress={() => setActiveTab('applied')}
          >
            <Clock size={13} color={activeTab === 'applied' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabBtnText, activeTab === 'applied' && styles.tabBtnTextActive]}>
              {t('tabApplied', 'Applied')} ({appliedJobs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
            onPress={() => setActiveTab('history')}
          >
            <CheckCircle2 size={13} color={activeTab === 'history' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
              {t('tabHiredHistory', 'Hired & History')} ({historyInterviews.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'ratings' && styles.tabBtnRatingsActive]}
            onPress={() => setActiveTab('ratings')}
          >
            <Star size={13} color={activeTab === 'ratings' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabBtnText, activeTab === 'ratings' && styles.tabBtnTextActive]}>
              Rate Employers
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* 🌟 3. RATE EMPLOYERS TAB HUB */}
      {activeTab === 'ratings' ? (
        <View style={styles.ratingsHubCard}>
          <View style={styles.ratingsHeaderRow}>
            <Sparkles size={20} color="#D97706" />
            <Text style={styles.ratingsTitle}>Employer Feedback &amp; Verification Ratings</Text>
          </View>
          <Text style={styles.ratingsSub}>
            Rate your past household employers on timely salary payments, respectful behavior, and fair workload.
          </Text>

          {/* Quick Rate Action Cards */}
          <Text style={styles.ratingsSectionHeader}>SELECT EMPLOYER TO RATE:</Text>
          {applications.map(app => (
            <View key={`rate-app-${app.id}`} style={styles.rateEmployerItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rateEmployerName}>{app.employerName}</Text>
                <Text style={styles.rateJobTitle}>{app.jobTitle} • {app.society}</Text>
              </View>
              <TouchableOpacity 
                style={styles.rateBtnSmall}
                onPress={() => setSelectedEmployerForReview(app)}
              >
                <Star size={12} color="#FFFFFF" />
                <Text style={styles.rateBtnSmallText}>Rate</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Completed Ratings List */}
          {completedReviews.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.ratingsSectionHeader}>YOUR SUBMITTED RATINGS:</Text>
              {completedReviews.map(rev => (
                <View key={rev.id} style={styles.submittedReviewCard}>
                  <View style={styles.submittedReviewHeader}>
                    <Text style={styles.submittedEmployerName}>{rev.employerName}</Text>
                    <View style={styles.starRow}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} color={s <= rev.rating ? "#F59E0B" : "#CBD5E1"} />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.submittedComment}>"{rev.comment}"</Text>
                  <Text style={styles.submittedDate}>{rev.date}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : loading ? (
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginVertical: 30 }} />
      ) : displayedList.length === 0 ? (
        /* 4. EMPTY STATE WITH EXPLORE JOBS BUTTON */
        <View style={styles.emptyCard}>
          <Calendar size={36} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>
            {activeTab === 'upcoming' 
              ? t('emptyUpcomingTitle', 'No Upcoming Interviews') 
              : activeTab === 'applied' 
              ? t('emptyAppliedTitle', 'No Active Job Applications') 
              : t('emptyHistoryTitle', 'No Completed Interview History')}
          </Text>
          <Text style={styles.emptySub}>
            {activeTab === 'upcoming'
              ? t('emptyUpcomingSub', 'When employers schedule a phone call or gate meeting with you, it will appear here.')
              : t('emptyAppliedSub', 'Browse verified society jobs to send applications directly to hiring households.')}
          </Text>

          <TouchableOpacity 
            style={styles.exploreJobsBtn}
            onPress={() => onNavigateToJobs ? onNavigateToJobs() : Alert.alert("Navigate", "Redirecting to Live Jobs...")}
          >
            <Briefcase size={14} color="#FFFFFF" />
            <Text style={styles.exploreJobsBtnText}>
              {t('exploreJobsBtn', 'Explore Live Jobs')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* 5. CARDS LIST */
        displayedList.map(app => {
          const isUpcoming = app.status === 'interview_scheduled' || app.status === 'confirmed';
          const isConfirmed = app.status === 'confirmed';
          const isHired = app.status === 'hired';
          const isPhoneCall = app.interviewMode !== 'in_person';

          return (
            <View 
              key={app.id} 
              style={[
                styles.appCard, 
                isHired && styles.appCardHired, 
                isUpcoming && styles.appCardUpcoming
              ]}
            >
              
              {/* Header Row */}
              <View style={styles.appHeaderRow}>
                <View style={styles.appEmployerLeft}>
                  <View style={[
                    styles.avatarBox, 
                    isHired && { backgroundColor: '#16A34A' },
                    !isUpcoming && !isHired && { backgroundColor: '#64748B' }
                  ]}>
                    <Text style={styles.avatarText}>{(app.employerName || 'E')[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{app.jobTitle}</Text>
                    <View style={styles.employerSubRow}>
                      <Building2 size={11} color="#64748B" />
                      <Text style={styles.employerSubText} numberOfLines={1}>
                        {app.employerName || 'Verified Employer'} • {app.society}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={[
                  styles.statusBadge, 
                  isHired ? styles.statusBadgeHired : isUpcoming ? styles.statusBadgeUpcoming : styles.statusBadgePending
                ]}>
                  {isHired ? (
                    <CheckCircle2 size={10} color="#15803D" />
                  ) : (
                    <Clock size={10} color={isUpcoming ? "#1A73E8" : "#B45309"} />
                  )}
                  <Text style={[
                    styles.statusBadgeText,
                    isHired ? styles.statusTextHired : isUpcoming ? styles.statusTextUpcoming : styles.statusTextPending
                  ]}>
                    {isHired 
                      ? t('badgeHired', 'HIRED') 
                      : isConfirmed 
                      ? 'CONFIRMED ✓' 
                      : isUpcoming 
                      ? t('badgeInterviewScheduled', 'INTERVIEW SCHEDULED') 
                      : t('badgeUnderReview', 'UNDER REVIEW')}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Job Specs Grid (3 boxes like web) */}
              <View style={styles.jobSpecsGrid}>
                <View style={styles.jobSpecBox}>
                  <Text style={styles.jobSpecLabel}>{t('offeredSalaryLabel', 'OFFERED SALARY')}</Text>
                  <Text style={styles.jobSpecValSalary}>₹{app.salary} / mo</Text>
                </View>

                <View style={styles.jobSpecBox}>
                  <Text style={styles.jobSpecLabel}>{t('workShiftLabel', 'WORK SHIFT')}</Text>
                  <Text style={styles.jobSpecVal} numberOfLines={1}>{app.shift || 'Full Day (8-12 Hrs)'}</Text>
                </View>

                <View style={styles.jobSpecBox}>
                  <Text style={styles.jobSpecLabel}>{t('interviewModeLabel', 'INTERVIEW MODE')}</Text>
                  <Text style={[styles.jobSpecVal, { color: '#1A73E8' }]} numberOfLines={1}>
                    {isPhoneCall ? t('modePhoneCall', '📞 Phone Call') : t('modeGateDesk', '🏠 Gate Desk In-Person')}
                  </Text>
                </View>
              </View>

              {/* Interview Timing & Attendance Confirm Box */}
              {app.interviewTime && (
                <View style={[styles.scheduleInfoBox, isUpcoming && styles.scheduleInfoBoxUpcoming]}>
                  <View style={styles.scheduleRow}>
                    <Clock size={14} color="#1A73E8" />
                    <Text style={styles.scheduleText}>{app.interviewTime}</Text>
                  </View>

                  {isUpcoming && (
                    <View style={styles.scheduleActionsRight}>
                      {!isConfirmed ? (
                        <TouchableOpacity 
                          style={styles.confirmInlineBtn}
                          onPress={() => handleConfirmAttendance(app)}
                        >
                          <CheckCircle2 size={11} color="#15803D" />
                          <Text style={styles.confirmInlineText}>{t('confirmAttendanceBtn', 'Confirm Attendance')}</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.confirmedInlineTag}>
                          <CheckCircle2 size={11} color="#15803D" />
                          <Text style={styles.confirmedInlineText}>Attendance Confirmed</Text>
                        </View>
                      )}

                      <TouchableOpacity 
                        onPress={() => setSelectedAppForReschedule(app)}
                      >
                        <Text style={styles.rescheduleLinkText}>{t('requestRescheduleBtn', 'Request Reschedule')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Action Buttons Row */}
              <View style={styles.actionButtonsContainer}>
                
                {/* 1. Call Direct */}
                <TouchableOpacity 
                  style={styles.actionCallBtn}
                  onPress={() => handleCallEmployer(app.employerPhone)}
                >
                  <PhoneCall size={13} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>{t('callEmployerBtn', 'Call')}</Text>
                </TouchableOpacity>

                {/* 2. WhatsApp Chat */}
                <TouchableOpacity 
                  style={styles.actionWaBtn}
                  onPress={() => handleWhatsAppChat(app.employerPhone, app)}
                >
                  <MessageSquare size={13} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>{t('whatsappChatBtn', 'WhatsApp')}</Text>
                </TouchableOpacity>

                {/* 3. Rate Household */}
                <TouchableOpacity 
                  style={styles.actionRateBtn}
                  onPress={() => setSelectedEmployerForReview(app)}
                >
                  <Sparkles size={13} color="#D97706" />
                  <Text style={styles.actionRateBtnText}>{t('writeVerifiedReviewTitle', 'Rate')}</Text>
                </TouchableOpacity>

                {/* 4. Google Maps Navigation */}
                <TouchableOpacity 
                  style={styles.actionMapBtn}
                  onPress={() => handleNavigateGoogleMaps(app.society)}
                >
                  <Compass size={13} color="#60A5FA" />
                  <Text style={styles.actionMapBtnText}>📍 Gate</Text>
                </TouchableOpacity>

              </View>

              <View style={styles.appliedDateRow}>
                <Text style={styles.appliedDateText}>
                  {t('appliedOnDate', 'Applied')} {app.date}
                </Text>
              </View>

            </View>
          );
        })
      )}

      {/* 📝 RESCHEDULE REQUEST MODAL */}
      {selectedAppForReschedule && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={styles.modalIconBox}>
                    <Calendar size={16} color="#1A73E8" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>{t('rescheduleModalTitle', 'Request Interview Reschedule')}</Text>
                    <Text style={styles.modalSub}>{selectedAppForReschedule.jobTitle}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedAppForReschedule(null)}>
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>{t('preferredNewSlotLabel', 'PREFERRED NEW DATE & TIME SLOT')}:</Text>
              <ScrollView style={{ maxHeight: 150, marginBottom: 12 }}>
                {timeSlotOptions.map(slot => (
                  <TouchableOpacity 
                    key={slot}
                    style={[styles.slotOptionItem, rescheduleTime === slot && styles.slotOptionSelected]}
                    onPress={() => setRescheduleTime(slot)}
                  >
                    <Clock size={12} color={rescheduleTime === slot ? '#1A73E8' : '#64748B'} />
                    <Text style={[styles.slotOptionText, rescheduleTime === slot && styles.slotOptionTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>{t('reasonForEmployerLabel', 'REASON / NOTE FOR EMPLOYER (OPTIONAL)')}:</Text>
              <TextInput 
                style={[styles.modalInput, { height: 60 }]}
                multiline
                placeholder={t('reasonPlaceholder', 'e.g. Current work shift conflicts with this time. Kindly request afternoon slot.')}
                value={rescheduleNote}
                onChangeText={setRescheduleNote}
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => setSelectedAppForReschedule(null)}
                >
                  <Text style={styles.modalCancelText}>{t('cancelBtn', 'Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalSubmitBtn}
                  onPress={handleRescheduleSubmit}
                  disabled={isSubmittingReschedule}
                >
                  <Send size={13} color="#FFFFFF" />
                  <Text style={styles.modalSubmitText}>
                    {isSubmittingReschedule ? (t('sendingState', 'Sending...')) : (t('sendRequestBtn', 'Send Request'))}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ⭐ RATE HOUSEHOLD EMPLOYER MODAL */}
      {selectedEmployerForReview && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={[styles.modalIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Sparkles size={16} color="#D97706" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Rate Household Employer</Text>
                    <Text style={styles.modalSub}>{selectedEmployerForReview.employerName}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedEmployerForReview(null)}>
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>YOUR STAR RATING:</Text>
              <View style={styles.starSelectRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <TouchableOpacity 
                    key={`star-${s}`} 
                    onPress={() => setRatingStars(s)}
                    style={{ padding: 4 }}
                  >
                    <Star 
                      size={28} 
                      color={s <= ratingStars ? "#F59E0B" : "#CBD5E1"} 
                      fill={s <= ratingStars ? "#F59E0B" : "transparent"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>WRITE VERIFIED REVIEW (OPTIONAL):</Text>
              <TextInput 
                style={[styles.modalInput, { height: 75 }]}
                multiline
                placeholder="Share your experience working with this household (on-time pay, respect, workload)..."
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => setSelectedEmployerForReview(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalSubmitBtn, { backgroundColor: '#D97706' }]}
                  onPress={handleReviewSubmit}
                  disabled={isSubmittingReview}
                >
                  <Star size={13} color="#FFFFFF" />
                  <Text style={styles.modalSubmitText}>
                    {isSubmittingReview ? 'Submitting...' : 'Submit Rating'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  
  floatingToast: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingToastText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF', flex: 1 },

  pageHeader: { marginBottom: 14 },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  eyebrowText: { fontSize: 9.5, fontWeight: '900', color: '#1A73E8' },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  pageSub: { fontSize: 11, color: '#64748B', marginTop: 3, lineHeight: 16 },

  // 1. Hero Pipeline Banner
  heroBanner: {
    backgroundColor: '#1A73E8',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4ADE80',
  },
  liveText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#DBEAFE',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  statPillsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statPillLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#DBEAFE',
  },
  statPillVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  statPillDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // 2. Tabs ScrollView
  tabsScrollView: {
    marginBottom: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#1A73E8',
  },
  tabBtnRatingsActive: {
    backgroundColor: '#34A853',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },

  // Ratings Hub Card
  ratingsHubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 16,
    marginBottom: 14,
  },
  ratingsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ratingsTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  ratingsSub: { fontSize: 11, color: '#64748B', lineHeight: 15, marginBottom: 12 },
  ratingsSectionHeader: { fontSize: 9.5, fontWeight: '900', color: '#64748B', letterSpacing: 0.5, marginBottom: 8 },
  rateEmployerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  rateEmployerName: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
  rateJobTitle: { fontSize: 10, color: '#64748B', marginTop: 1 },
  rateBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rateBtnSmallText: { fontSize: 10.5, fontWeight: '900', color: '#FFFFFF' },

  submittedReviewCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  submittedReviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  submittedEmployerName: { fontSize: 11.5, fontWeight: '900', color: '#92400E' },
  starRow: { flexDirection: 'row', gap: 2 },
  submittedComment: { fontSize: 10.5, color: '#78350F', marginTop: 3, fontStyle: 'italic' },
  submittedDate: { fontSize: 9, color: '#A16207', marginTop: 2, textAlign: 'right' },

  // Empty Card
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  exploreJobsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  exploreJobsBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // Application Cards List
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  appCardHired: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  appCardUpcoming: {
    borderColor: '#BFDBFE',
  },
  appHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  appEmployerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  jobTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  employerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  employerSubText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeHired: { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' },
  statusBadgeUpcoming: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  statusBadgePending: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
  statusBadgeText: { fontSize: 8.5, fontWeight: '900' },
  statusTextHired: { color: '#15803D' },
  statusTextUpcoming: { color: '#1A73E8' },
  statusTextPending: { color: '#B45309' },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },

  // Job Specs Grid
  jobSpecsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  jobSpecBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: 8,
  },
  jobSpecLabel: { fontSize: 8.5, fontWeight: '800', color: '#94A3B8' },
  jobSpecValSalary: { fontSize: 11, fontWeight: '900', color: '#15803D', marginTop: 2 },
  jobSpecVal: { fontSize: 10.5, fontWeight: '800', color: '#1E293B', marginTop: 2 },

  // Schedule Info Box
  scheduleInfoBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    marginBottom: 10,
  },
  scheduleInfoBoxUpcoming: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#1A73E8',
  },
  scheduleActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  confirmInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confirmInlineText: { fontSize: 9.5, fontWeight: '900', color: '#15803D' },
  confirmedInlineTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  confirmedInlineText: { fontSize: 9.5, fontWeight: '900', color: '#15803D' },
  rescheduleLinkText: { fontSize: 9.5, fontWeight: '900', color: '#1A73E8', textDecorationLine: 'underline' },

  // Action Buttons Row
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  actionCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#1A73E8',
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionWaBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionRateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionRateBtnText: { fontSize: 10, fontWeight: '900', color: '#92400E' },
  actionMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: '#0F172A',
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionMapBtnText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },
  actionBtnText: { fontSize: 10.5, fontWeight: '900', color: '#FFFFFF' },

  appliedDateRow: { marginTop: 6, alignItems: 'flex-end' },
  appliedDateText: { fontSize: 9.5, fontWeight: '600', color: '#94A3B8' },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  modalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  modalSub: { fontSize: 10.5, color: '#64748B', marginTop: 1 },
  inputLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  slotOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  slotOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  slotOptionText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  slotOptionTextSelected: { fontWeight: '900', color: '#1A73E8' },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 11.5,
    color: '#0F172A',
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  starSelectRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    backgroundColor: '#FFFBEB',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#1A73E8',
  },
  modalSubmitText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
});

