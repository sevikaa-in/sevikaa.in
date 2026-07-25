-- 1. Add missing columns to worker_profiles
ALTER TABLE public.worker_profiles 
ADD COLUMN IF NOT EXISTS experience_years integer DEFAULT 0 CHECK (experience_years >= 0),
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS aadhaar_front_url text,
ADD COLUMN IF NOT EXISTS aadhaar_back_url text;

-- 2. Create availability matching helper function
CREATE OR REPLACE FUNCTION public.check_availability(
    worker_avail jsonb,
    job_req jsonb
)
RETURNS boolean AS $$
DECLARE
    day_key text;
    req_slots jsonb;
    avail_slots jsonb;
    slot text;
BEGIN
    -- If job requires live-in, check if worker supports it
    IF (job_req->>'live_in')::boolean = true AND NOT (worker_avail->>'live_in')::boolean = true THEN
        RETURN false;
    END IF;
    -- If job requires full-day, check if worker supports it
    IF (job_req->>'full_day')::boolean = true AND NOT (worker_avail->>'full_day')::boolean = true THEN
        RETURN false;
    END IF;

    -- If no weekly grid requirement, return true
    IF job_req->'weekly_grid' IS NULL OR jsonb_typeof(job_req->'weekly_grid') != 'object' THEN
        RETURN true;
    END IF;

    -- Otherwise, check weekly grid slots day-by-day
    FOR day_key IN SELECT jsonb_object_keys(job_req->'weekly_grid') LOOP
        req_slots := job_req->'weekly_grid'->day_key;
        avail_slots := COALESCE(worker_avail->'weekly_grid'->day_key, worker_avail->day_key, '[]'::jsonb);
        
        -- Loop through required slots for this day
        IF req_slots IS NOT NULL AND jsonb_typeof(req_slots) = 'array' THEN
            FOR slot IN SELECT jsonb_array_elements_text(req_slots) LOOP
                -- Check if worker availability does NOT contain this slot
                IF NOT (avail_slots @> jsonb_build_array(slot)) THEN
                    RETURN false;
                END IF;
            END LOOP;
        END IF;
    END LOOP;

    RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Rewrite search_workers RPC to include availability matching
CREATE OR REPLACE FUNCTION public.search_workers(
    p_job_society_id uuid,
    p_category text,
    p_required_slots jsonb DEFAULT '{}'::jsonb,
    p_max_salary integer DEFAULT NULL
)
RETURNS TABLE (
    user_id uuid,
    full_name text,
    gender text,
    age integer,
    skills text[],
    languages_spoken text[],
    expected_salary integer,
    preferred_society_id uuid,
    preferred_society_name text,
    approximate_distance double precision,
    is_aadhaar_verified boolean,
    is_police_verified boolean,
    is_interview_verified boolean,
    average_rating double precision
) AS $$
DECLARE
    job_lat double precision;
    job_lon double precision;
BEGIN
    -- Get Job Society Coordinates
    SELECT latitude, longitude INTO job_lat, job_lon
    FROM public.societies
    WHERE id = p_job_society_id;

    RETURN QUERY
    SELECT 
        wp.user_id,
        wp.full_name,
        wp.gender,
        wp.age,
        wp.skills,
        wp.languages_spoken,
        wp.expected_salary,
        wp.preferred_society_id,
        s.name AS preferred_society_name,
        calculate_distance(job_lat, job_lon, s.latitude, s.longitude) AS approximate_distance,
        wp.is_aadhaar_verified,
        wp.is_police_verified,
        wp.is_interview_verified,
        COALESCE((
            SELECT AVG(rating)::double precision 
            FROM public.reviews 
            WHERE target_id = wp.user_id AND status = 'approved'
        ), 0.0) AS average_rating
    FROM 
        public.worker_profiles wp
    LEFT JOIN 
        public.societies s ON s.id = wp.preferred_society_id
    INNER JOIN 
        public.profiles p ON p.id = wp.user_id
    WHERE 
        p.status = 'live'
        AND p_category = ANY(wp.skills)
        AND (p_max_salary IS NULL OR wp.expected_salary <= p_max_salary)
        AND public.check_availability(wp.availability_slots, p_required_slots) = true
    ORDER BY
        (wp.preferred_society_id = p_job_society_id) DESC, -- 1. Society First
        calculate_distance(job_lat, job_lon, s.latitude, s.longitude) ASC NULLS LAST, -- 2. Distance Proximity
        wp.expected_salary ASC, -- 3. Salary Expectation
        wp.is_aadhaar_verified DESC, -- 4. Verification Badges
        wp.is_police_verified DESC,
        wp.is_interview_verified DESC,
        average_rating DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
