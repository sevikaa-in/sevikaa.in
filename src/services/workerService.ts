import { UserRepository, WorkerProfileData } from '@/repositories/userRepository';
import { queryDb } from '@/lib/db';

export interface CompletenessResult {
  isComplete: boolean;
  scorePercent: number;
  completedSteps: number;
  error?: string;
}

export class WorkerService {
  static async validateWorkerCompleteness(userId: string, body?: any): Promise<CompletenessResult> {
    const row = await UserRepository.findWorkerByUserId(userId);
    if (!row) {
      return { isComplete: false, scorePercent: 0, completedSteps: 0, error: 'Worker profile not found.' };
    }

    const hasName = !!(body?.full_name || row.full_name)?.trim();
    const hasPhone = ((body?.phone || row.phone || '') as string).replace(/\D/g, '').length >= 10;
    const hasGenderAge = !!(body?.gender || row.gender) && !!(body?.age || row.age);
    const hasSkills = Array.isArray(body?.skills || row.skills) ? (body?.skills || row.skills).length > 0 : !!(body?.skills || row.skills);
    const hasSalary = !!(body?.expected_salary || row.expected_salary);
    const hasExperience = (body?.experience_years !== undefined || row.experience_years !== undefined);
    const hasLanguages = Array.isArray(body?.languages_spoken || row.languages_spoken) && (body?.languages_spoken || row.languages_spoken).length > 0;
    const hasPhoto = !!(body?.profile_picture_url || row.profile_picture_url);
    const hasAadhaarFront = !!(body?.aadhaar_front_url || row.aadhaar_front_url);
    const hasAadhaarBack = !!(body?.aadhaar_back_url || row.aadhaar_back_url);

    const isTelePassed = body?.is_tele_onboarded === true || body?.tele_onboarded === true || body?.is_interview_verified === true || row.is_tele_onboarded === true || row.is_interview_verified === true;

    if (!isTelePassed) {
      return {
        isComplete: false,
        scorePercent: 0,
        completedSteps: 0,
        error: 'Cannot mark worker Live: Telephonic Onboarding Verification required. Candidate must pass Tele-Onboarding before Live approval.'
      };
    }

    const steps = [hasName, hasPhone, hasGenderAge, hasSkills, hasSalary, hasExperience, hasLanguages, hasPhoto, hasAadhaarFront, hasAadhaarBack];
    const completedSteps = steps.filter(Boolean).length;
    const scorePercent = completedSteps * 10;

    if (completedSteps < 10) {
      return {
        isComplete: false,
        scorePercent,
        completedSteps,
        error: `Cannot approve worker profile: Only ${scorePercent}% complete (${completedSteps} of 10 steps). All 10 profile steps must be 100% complete before Admin approval.`
      };
    }

    return { isComplete: true, scorePercent: 100, completedSteps: 10 };
  }
}
