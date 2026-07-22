-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create calculate_distance helper function (Spherical Law of Cosines for Lat/Lng)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
RETURNS double precision AS $$
DECLARE
    dist double precision;
BEGIN
    dist := 6371 * acos(
        LEAST(1.0, GREATEST(-1.0, 
            cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
            sin(radians(lat1)) * sin(radians(lat2))
        ))
    );
    RETURN dist;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Create Societies Table
CREATE TABLE public.societies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    city text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 3. Create Unified Profiles Table
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email text UNIQUE,
    phone text UNIQUE,
    role text NOT NULL CHECK (role IN ('worker', 'employer', 'admin', 'super-admin')),
    status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'admin_interview', 'approved', 'live', 'suspended', 'deactivated')),
    created_at timestamptz DEFAULT now()
);

-- 4. Create Worker Profiles Table
CREATE TABLE public.worker_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    age integer NOT NULL CHECK (age >= 18 AND age <= 80),
    languages_spoken text[] NOT NULL DEFAULT '{}',
    skills text[] NOT NULL DEFAULT '{}',
    expected_salary integer NOT NULL CHECK (expected_salary > 0),
    preferred_society_id uuid REFERENCES public.societies(id) ON DELETE SET NULL,
    preferred_areas text[] NOT NULL DEFAULT '{}',
    profile_picture_url text,
    video_url text,
    availability_slots jsonb NOT NULL DEFAULT '{}',
    is_aadhaar_verified boolean NOT NULL DEFAULT false,
    is_police_verified boolean NOT NULL DEFAULT false,
    is_interview_verified boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 5. Create Employer Profiles Table
CREATE TABLE public.employer_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    company_name text,
    billing_address text,
    subscription_status text NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
    created_at timestamptz DEFAULT now()
);

-- 6. Create Jobs Table
CREATE TABLE public.jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category text NOT NULL CHECK (category IN ('maid', 'cook', 'nanny')),
    description text NOT NULL,
    salary_range_min integer NOT NULL CHECK (salary_range_min >= 0),
    salary_range_max integer NOT NULL CHECK (salary_range_max >= salary_range_min),
    society_id uuid REFERENCES public.societies(id) ON DELETE SET NULL,
    required_slots jsonb NOT NULL DEFAULT '{}',
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'closed')),
    created_at timestamptz DEFAULT now()
);

-- 7. Create Applications Table
CREATE TABLE public.applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    worker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'interviewing', 'accepted', 'rejected')),
    created_at timestamptz DEFAULT now(),
    UNIQUE (job_id, worker_id)
);

-- 8. Create Reviews Table
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
    created_at timestamptz DEFAULT now()
);

-- 9. Create Audit Logs Table
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    target_id uuid,
    old_values jsonb,
    new_values jsonb,
    created_at timestamptz DEFAULT now()
);

-- 10. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS Policies

-- Public / Authenticated reads for Societies
CREATE POLICY "Societies are readable by everyone authenticated" ON public.societies
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Societies are manageable by admins only" ON public.societies
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- Profiles Policies
CREATE POLICY "Profiles readable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can edit their own profiles" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles" ON public.profiles
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- Worker Profiles Policies
CREATE POLICY "Worker profiles readable by owner, admins, or if live" ON public.worker_profiles
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = worker_profiles.user_id AND status = 'live') OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

CREATE POLICY "Workers can edit their own profiles" ON public.worker_profiles
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Workers can insert their own profiles" ON public.worker_profiles
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins have full access to worker profiles" ON public.worker_profiles
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- Employer Profiles Policies
CREATE POLICY "Employer profiles readable by authenticated users" ON public.employer_profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Employers can edit their own profiles" ON public.employer_profiles
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Employers can insert their own profiles" ON public.employer_profiles
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins have full access to employer profiles" ON public.employer_profiles
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- Jobs Policies
CREATE POLICY "Jobs readable if approved/live or owned by employer or admin" ON public.jobs
    FOR SELECT TO authenticated USING (
        status = 'approved' OR
        employer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

CREATE POLICY "Employers can insert their own jobs" ON public.jobs
    FOR INSERT TO authenticated WITH CHECK (
        employer_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'employer')
    );

CREATE POLICY "Employers can edit their own jobs" ON public.jobs
    FOR UPDATE TO authenticated USING (employer_id = auth.uid());

CREATE POLICY "Admins have full access to jobs" ON public.jobs
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- Applications Policies
CREATE POLICY "Applications readable by applicant, job owner, or admin" ON public.applications
    FOR SELECT TO authenticated USING (
        worker_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.jobs WHERE id = applications.job_id AND employer_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

CREATE POLICY "Workers can apply for jobs" ON public.applications
    FOR INSERT TO authenticated WITH CHECK (
        worker_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'worker')
    );

CREATE POLICY "Applicants can cancel or update applications" ON public.applications
    FOR UPDATE TO authenticated USING (worker_id = auth.uid());

CREATE POLICY "Job owners can update applications state" ON public.applications
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.jobs WHERE id = applications.job_id AND employer_id = auth.uid())
    );

CREATE POLICY "Admins have full access to applications" ON public.applications
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- Reviews Policies
CREATE POLICY "Reviews readable by authenticated users if approved, or if author/target" ON public.reviews
    FOR SELECT TO authenticated USING (
        status = 'approved' OR
        author_id = auth.uid() OR
        target_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

CREATE POLICY "Authenticated users can post reviews" ON public.reviews
    FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update reviews if pending" ON public.reviews
    FOR UPDATE TO authenticated USING (author_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins have full access to reviews" ON public.reviews
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- Audit Logs Policies
CREATE POLICY "Audit logs visible to admins only" ON public.audit_logs
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- 12. Create Automatic Profile Generation Trigger on User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, phone, role, status)
    VALUES (
        new.id,
        new.email,
        new.phone,
        COALESCE(new.raw_user_meta_data ->> 'role', 'worker'),
        'pending_review'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Create Automatic Audit Logging Trigger for Status Modifications
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS trigger AS $$
BEGIN
    IF old.status IS DISTINCT FROM new.status OR old.role IS DISTINCT FROM new.role THEN
        INSERT INTO public.audit_logs (admin_id, action, target_id, old_values, new_values)
        VALUES (
            auth.uid(),
            'profile_update',
            new.id,
            jsonb_build_object('status', old.status, 'role', old.role),
            jsonb_build_object('status', new.status, 'role', new.role)
        );
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_status_updated
    AFTER UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.log_status_change();
