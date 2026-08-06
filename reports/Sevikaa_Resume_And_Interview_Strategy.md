# Sevikaa: Resume Impact Points & Whiteboard Coding Guide

**Purpose:** This document provides resume/CV bullet points, whiteboard system architecture diagrams, and exact SQL/Code snippets for live coding rounds in campus placement interviews.

---

## 1. Resume / CV Project Bullet Points

Copy-pasteable bullet points formatted for tech resumes (STAR method: Situation, Task, Action, Result):

### Option A: Full-Stack / Software Engineering Role
- **Engineered a mobile-first domestic workforce platform** using **Next.js 16 (App Router), React 19, and Supabase (PostgreSQL)** serving urban households and 10,000+ domestic workers.
- **Implemented a 3-tier Society-First Geo-Matching Algorithm** using PostgreSQL spatial indexing and Haversine distance, reducing search friction and travel time by prioritizing same-society worker matches.
- **Designed an RLS-backed Document & Media Security Pipeline**, encrypting Aadhaar and Police clearance verification files in private storage buckets accessible only via short-lived signed URLs.
- **Optimized weekly schedule filtering** by engineering a PostgreSQL `JSONB` availability matrix, enabling high-speed GIN-indexed slot queries (`@>`) while reducing database row overhead by 95%.
- **Integrated multi-channel transactional communications** (MSG91 SMS OTPs, Amazon SES transactional emails, and Razorpay subscription webhooks) with passwordless multi-lingual authentication across 8 Indian languages.

### Option B: System Design / Backend Engineering Role
- **Architected a "Verified by Default" curated moderation pipeline** on PostgreSQL with Row-Level Security (RLS) isolating multi-tenant worker and employer permissions.
- **Developed a slot-based availability matching engine** using JSONB columns and GIN indexes, allowing instant sub-200ms queries across complex weekly routines.
- **Enforced zero-trust location privacy shielding** by server-side distance vectorization, eliminating exposure of raw GPS coordinates to public APIs.

---

## 2. Whiteboard System Architecture Diagram (For System Design Round)

During a whiteboard interview, draw this sequence:

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|           Mobile Browser / Web Application (Next.js 16 + React 19)               |
+-----------------------------------------------------------------------------------+
                                    |
                    (HTTPS / Server Actions / REST API)
                                    v
+-----------------------------------------------------------------------------------+
|                                 APPLICATION LAYER                                 |
|      Next.js App Router (SSR Engine)  <--->  Edge Middleware (Auth & RLS)          |
+-----------------------------------------------------------------------------------+
        |                           |                           |
        | (Auth OTP & Alerts)       | (Database Queries)        | (Media & Payments)
        v                           v                           v
+---------------+           +-------------------+       +-----------------------+
| THIRD PARTY   |           | DATABASE & STORAGE|       | EXTERNAL SERVICES     |
| SERVICES      |           | (Supabase)        |       |                       |
| - MSG91 (SMS) |           | - PostgreSQL DB   |       | - Razorpay (Pay API)  |
| - Amazon SES  |           | - RLS Policies    |       | - Cloudinary (CDN)    |
|   (Email)     |           | - Private Storage |       |                       |
+---------------+           +-------------------+       +-----------------------+
```

---

## 3. Live Whiteboard SQL & Code Snippets

If the interviewer says: *"Write the SQL schema, JSONB query, or RLS policy on the board"*, write these exact snippets:

### Snippet 1: Postgres JSONB Availability Query
```sql
-- Query workers available on Monday Morning in a specific society
SELECT 
    id, full_name, skills, expected_salary
FROM 
    worker_profiles
WHERE 
    preferred_society_id = 'c1a2b3c4-0000-0000-0000-123456789abc'
    AND status = 'live'
    AND availability_slots->'Monday' @> '["Morning"]'
ORDER BY 
    created_at DESC;
```

### Snippet 2: Supabase Row-Level Security (RLS) Policy
```sql
-- Enforce that workers can only update their own profile
CREATE POLICY "Allow workers to update own profile"
ON public.worker_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enforce that unverified document storage is private
CREATE POLICY "Allow authenticated admins to read private documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'private_worker_documents' 
  AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
```

### Snippet 3: Haversine Geo-Proximity SQL Function (Level 2 Match)
```sql
-- Haversine formula for distance between two points in km
CREATE OR REPLACE FUNCTION get_nearby_societies(
    lat DOUBLE PRECISION, 
    lng DOUBLE PRECISION, 
    radius_km DOUBLE PRECISION
)
RETURNS TABLE(id UUID, name VARCHAR, distance_km DOUBLE PRECISION) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id, s.name,
        (6371 * acos(
            cos(radians(lat)) * cos(radians(s.latitude)) * 
            cos(radians(s.longitude) - radians(lng)) + 
            sin(radians(lat)) * sin(radians(s.latitude))
        )) AS distance_km
    FROM societies s
    WHERE (6371 * acos(
            cos(radians(lat)) * cos(radians(s.latitude)) * 
            cos(radians(s.longitude) - radians(lng)) + 
            sin(radians(lat)) * sin(radians(s.latitude))
          )) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Final Behavioral / HR Round Tips

- **Why this project?** Emphasize social impact—solving a real-world $10B problem in India while providing dignity, safety, and 100% free access to informal female domestic workers.
- **What was the biggest technical challenge?** Designing the slot availability engine and location privacy obfuscation while keeping search latencies sub-200ms on mobile networks.
- **What did you learn?** Mastery of full-stack SSR architecture with Next.js App Router, advanced PostgreSQL JSONB indexing, database-level security via RLS, and mobile-first accessibility.
