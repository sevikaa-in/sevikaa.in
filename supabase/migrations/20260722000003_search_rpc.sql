CREATE OR REPLACE FUNCTION public.search_workers(
    p_job_society_id uuid,
    p_category text,
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
        p.status = 'live' -- Only live profiles are searchable
        AND p_category = ANY(wp.skills) -- Check Category skills (maid, cook, nanny)
        AND (p_max_salary IS NULL OR wp.expected_salary <= p_max_salary)
    ORDER BY
        (wp.preferred_society_id = p_job_society_id) DESC, -- 1. Society First (Same Society Matches)
        calculate_distance(job_lat, job_lon, s.latitude, s.longitude) ASC NULLS LAST, -- 2. Distance Proximity
        wp.expected_salary ASC, -- 3. Salary Expectation
        wp.is_aadhaar_verified DESC, -- 4. Verification Badges
        wp.is_police_verified DESC,
        wp.is_interview_verified DESC,
        average_rating DESC NULLS LAST; -- 5. Ratings Score
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
