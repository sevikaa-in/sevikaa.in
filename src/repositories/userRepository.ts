import { queryDb } from '@/lib/db';

export interface UserProfile {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: 'worker' | 'employer' | 'admin' | 'super-admin';
  status: string;
  created_at?: string;
}

export interface WorkerProfileData {
  id?: string;
  user_id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  gender: string;
  age: number;
  expected_salary: number;
  experience_years: number;
  skills: string[];
  languages_spoken?: string[];
  profile_picture_url?: string | null;
  aadhaar_front_url?: string | null;
  aadhaar_back_url?: string | null;
  video_url?: string | null;
  police_verification_url?: string | null;
  emergency_contact?: string | null;
  preferred_shift?: string | null;
  preferred_society_name?: string | null;
  secondary_society_name?: string | null;
  status?: string;
  is_tele_onboarded?: boolean;
  is_interview_verified?: boolean;
  is_aadhaar_verified?: boolean;
  is_police_verified?: boolean;
}

export class UserRepository {
  static async findProfileById(userId: string): Promise<UserProfile | null> {
    const res = await queryDb(
      `SELECT id, email, phone, role, status, created_at 
       FROM public.profiles 
       WHERE id::text = $1 OR phone = $1 OR email = $1 LIMIT 1`,
      [userId]
    );
    return res?.rows?.[0] || null;
  }

  static async findWorkerByUserId(userId: string): Promise<WorkerProfileData | null> {
    const res = await queryDb(
      `SELECT wp.*, p.phone, p.email, p.status 
       FROM public.worker_profiles wp 
       LEFT JOIN public.profiles p ON p.id::text = wp.user_id::text OR p.id::text = wp.id::text
       WHERE wp.user_id::text = $1 OR wp.id::text = $1 LIMIT 1`,
      [userId]
    );
    return res?.rows?.[0] || null;
  }

  static async findEmployerByUserId(userId: string): Promise<any | null> {
    const res = await queryDb(
      `SELECT ep.*, p.phone, p.email, p.status 
       FROM public.employer_profiles ep 
       LEFT JOIN public.profiles p ON p.id::text = ep.user_id::text OR p.id::text = ep.id::text
       WHERE ep.user_id::text = $1 OR ep.id::text = $1 LIMIT 1`,
      [userId]
    );
    return res?.rows?.[0] || null;
  }

  static async switchUserRole(userId: string, targetRole: 'worker' | 'employer'): Promise<boolean> {
    const user = await this.findProfileById(userId);
    if (!user) return false;

    if (user.role === targetRole) return true;

    await queryDb(`UPDATE public.profiles SET role = $1 WHERE id::text = $2`, [targetRole, userId]);

    if (targetRole === 'employer') {
      await queryDb(
        `INSERT INTO public.employer_profiles (id, user_id, name, company_name, created_at, updated_at) 
         VALUES ($1, $1, 'Household Owner', 'Household Owner', NOW(), NOW()) 
         ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
        [userId]
      );
      await queryDb(`DELETE FROM public.worker_profiles WHERE user_id::text = $1 OR id::text = $1`, [userId]);
    } else {
      await queryDb(
        `INSERT INTO public.worker_profiles (id, user_id, full_name, created_at) 
         VALUES ($1, $1, 'Registered Candidate', NOW()) 
         ON CONFLICT (id) DO NOTHING`,
        [userId]
      );
      await queryDb(`DELETE FROM public.employer_profiles WHERE user_id::text = $1 OR id::text = $1`, [userId]);
    }
    return true;
  }
}
