import { queryDb } from '@/lib/db';

export interface JobData {
  id?: string;
  employer_id: string;
  category: string;
  description?: string;
  salary_range_min: number;
  salary_range_max: number;
  society_id?: string | null;
  society_name?: string | null;
  status: string;
  created_at?: string;
}

export class JobRepository {
  static async findJobById(jobId: string): Promise<JobData | null> {
    const res = await queryDb(
      `SELECT j.*, ep.company_name AS employer_name, p.phone AS employer_phone
       FROM public.jobs j
       LEFT JOIN public.profiles p ON p.id::text = j.employer_id::text
       LEFT JOIN public.employer_profiles ep ON ep.user_id::text = j.employer_id::text OR ep.id::text = j.employer_id::text
       WHERE j.id::text = $1 LIMIT 1`,
      [jobId]
    );
    return res?.rows?.[0] || null;
  }

  static async updateJobStatus(jobId: string, status: string): Promise<JobData | null> {
    const res = await queryDb(
      `UPDATE public.jobs 
       SET status = $1, updated_at = NOW() 
       WHERE id::text = $2::text 
       RETURNING *`,
      [status, jobId]
    );
    return res?.rows?.[0] || null;
  }

  static async submitJobApplication(jobId: string, workerId: string): Promise<{ success: boolean; alreadyApplied?: boolean }> {
    const checkRes = await queryDb(
      `SELECT id FROM public.job_applications WHERE job_id::text = $1 AND worker_id::text = $2 LIMIT 1`,
      [jobId, workerId]
    );

    if (checkRes && checkRes.rows.length > 0) {
      return { success: true, alreadyApplied: true };
    }

    await queryDb(
      `INSERT INTO public.job_applications (job_id, worker_id, status, created_at, updated_at)
       VALUES ($1, $2, 'applied', NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [jobId, workerId]
    );

    return { success: true, alreadyApplied: false };
  }
}
