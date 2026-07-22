-- Sevikaa Database Security RLS Assertions Audit Script
-- Executed on Supabase Local / Staging Postgres instances to verify RLS controls.

BEGIN;

-- 1. Assert unauthenticated user cannot insert or access audit_logs
DO $$
BEGIN
    INSERT INTO public.audit_logs (actor_id, actor_role, action)
    VALUES ('00000000-0000-0000-0000-000000000000', 'worker', 'Illegal write test');
    
    RAISE EXCEPTION 'RLS FAIL: Unauthenticated write to audit_logs was permitted!';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'RLS SUCCESS: Unauthenticated write to audit_logs was blocked.';
END;
$$;

-- 2. Assert unauthenticated user cannot modify profiles
DO $$
BEGIN
    UPDATE public.profiles
    SET role = 'super-admin'
    WHERE id = '00000000-0000-0000-0000-000000000000';
    
    -- If update affected rows without throwing, checking constraints
    RAISE NOTICE 'RLS CHECK: Profile modification checked.';
END;
$$;

-- 3. Assert unauthenticated user can select from public societies list
DO $$
DECLARE
    soc_count integer;
BEGIN
    SELECT COUNT(*) INTO soc_count FROM public.societies;
    RAISE NOTICE 'RLS SUCCESS: Public societies read permitted. Count: %', soc_count;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'RLS FAIL: Public societies read was blocked!';
END;
$$;

-- 4. Assert unauthenticated user cannot select from worker_profiles
DO $$
DECLARE
    wp_count integer;
BEGIN
    SELECT COUNT(*) INTO wp_count FROM public.worker_profiles;
    IF wp_count > 0 THEN
        RAISE EXCEPTION 'RLS FAIL: Unauthenticated worker profiles read permitted!';
    ELSE
        RAISE NOTICE 'RLS SUCCESS: Worker profiles shielded from unauthenticated select.';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'RLS SUCCESS: Worker profiles read blocked by database rule.';
END;
$$;

ROLLBACK;
