-- 1. Create table to persist unlocked candidate contact details
CREATE TABLE IF NOT EXISTS public.employer_unlocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id uuid NOT NULL REFERENCES public.employer_profiles(id) ON DELETE CASCADE,
    worker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    unlocked_at timestamptz DEFAULT now(),
    UNIQUE (employer_id, worker_id)
);

-- 2. Create table for employer candidate shortlisting/bookmarks
CREATE TABLE IF NOT EXISTS public.employer_bookmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id uuid NOT NULL REFERENCES public.employer_profiles(id) ON DELETE CASCADE,
    worker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE (employer_id, worker_id)
);

-- 3. Add columns to jobs for detailed onboarding task requirements
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS required_slots jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS specific_tasks text[] DEFAULT '{}'::text[];

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.employer_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_bookmarks ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for employer_unlocks
CREATE POLICY "Employers can read their own unlocks" ON public.employer_unlocks
    FOR SELECT TO authenticated USING (
        employer_id = (SELECT id FROM public.employer_profiles WHERE user_id = auth.uid() LIMIT 1) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

CREATE POLICY "Service role only insert unlocks" ON public.employer_unlocks
    FOR INSERT TO authenticated WITH CHECK (false); -- Can only be inserted securely via backend API

-- 6. Create RLS Policies for employer_bookmarks
CREATE POLICY "Employers can manage their own bookmarks" ON public.employer_bookmarks
    FOR ALL TO authenticated USING (
        employer_id = (SELECT id FROM public.employer_profiles WHERE user_id = auth.uid() LIMIT 1)
    );
