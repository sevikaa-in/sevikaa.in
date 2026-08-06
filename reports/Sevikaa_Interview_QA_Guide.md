# Sevikaa: On-Campus Placement Interview Q&A Defense Guide

**Purpose:** This guide equips team members with precise, expert-level technical, architectural, product design, and operational answers to any question asked by interviewers during campus placement interviews.

---

## 1. System Architecture & Tech Stack Questions

### Q1: Why did you choose Next.js 16 (App Router) instead of a standalone React SPA (Vite/CRA)?
**Answer:**  
- **SEO & Server-Side Rendering (SSR):** Sevikaa is a public-facing directory platform (`sevikaa.in`). Pages like `/find-workers`, `/pricing`, `/about`, and apartment landing pages must be indexed by search engine crawlers (Google SEO). Next.js App Router provides built-in SSR and Static Site Generation (SSG).
- **Mobile Performance:** Pre-rendering HTML on the server reduces the client-side JavaScript bundle size, ensuring fast initial page loads (LCP < 1.5s) even on low-end 3G/4G smartphones.
- **Unified Full-Stack Architecture:** Next.js Server Components and Server Actions allow secure server-side interactions without maintaining a separate Node.js Express server.

---

### Q2: Why Supabase (PostgreSQL) instead of MongoDB (NoSQL)?
**Answer:**  
- **Relational Data Integrity:** Sevikaa relies on strict relational mappings between `USERS`, `WORKER_PROFILES`, `EMPLOYER_PROFILES`, `SOCIETIES`, `JOBS`, `APPLICATIONS`, and `REVIEWS`. PostgreSQL foreign keys ensure cascading integrity (e.g., if a job is removed, application states remain consistent).
- **Row-Level Security (RLS):** Supabase provides native DB-level security policies (`auth.uid() = user_id`), ensuring data isolation directly at the database layer rather than relying solely on application middleware.
- **Native JSONB Support:** For semi-structured data like weekly availability grids (`availability_slots`) and job time-slot requirements, PostgreSQL's `JSONB` data type provides the flexibility of NoSQL with GIN indexing while preserving relational SQL power.

---

### Q3: Why did you use JSONB for the Availability Grid instead of a separate relational table?
**Answer:**  
- **Query Efficiency & Overhead:** A relational table storing 7 days $\times$ 5 time slots per worker would generate 35 rows *per worker*. For 10,000 workers, that would mean 350,000 rows just for schedules.
- **JSONB Alternative:** Storing availability as a JSONB object (e.g., `{"Monday": ["Morning", "Evening"], "Tuesday": ["Afternoon"]}`) allows single-row reads and updates.
- **Postgres JSONB Operators:** PostgreSQL supports containment operators (`@>`) and GIN indexes, allowing high-speed filtering (e.g., `SELECT * FROM worker_profiles WHERE availability_slots->'Monday' @> '["Morning"]'`).

---

### Q4: How does the Society-First Geo-Matching Algorithm work?
**Answer:**  
The algorithm executes a 3-tier prioritized search sequence:
1. **Level 1 (Direct Society Match):** Exact foreign key match (`worker_profiles.preferred_society_id = jobs.society_id`). High priority (Rank 1).
2. **Level 2 (Nearby Societies within 1-2 km):** Haversine distance calculation using geospatial coordinates (`location_coordinates`) stored in the `societies` table to find adjacent complexes.
3. **Level 3 (Locality / Postal Code Match):** Sub-locality or postal code match based on worker service radius.

---

## 2. Security, Privacy & Data Protection Questions

### Q5: How do you secure government ID documents (Aadhaar, Police Verification)?
**Answer:**  
- **Private Storage Buckets:** Uploaded Aadhaar cards and background check documents are saved in private Supabase Storage buckets, isolated from public internet access.
- **Short-Lived Signed URLs:** Documents are never accessible via static public URLs. Authorized platform moderators view documents using short-lived (e.g., 60-second expiration) signed URLs generated server-side.
- **Database RLS Policies:** RLS rules explicitly restrict read access to private document metadata to the document owner and authorized governance roles.

---

### Q6: How do you handle user location privacy and prevent worker harassment?
**Answer:**  
- **Location Obfuscation:** The platform **never** stores or exposes exact street addresses or live GPS coordinates of workers or employers in public API payloads.
- **Proximity Bucketing:** The UI calculates and displays relative distance buckets (e.g., *"Within 500 meters"*, *"1.2 km away"*).
- **Contact Obfuscation:** Phone numbers and WhatsApp links are hidden behind subscription authorization. Unsubscribed employers only see verified badges and truncated profile information.

---

## 3. Product Design & Operational Questions

### Q7: How do you handle domestic workers with low digital literacy?
**Answer:**  
- **Multilingual UI:** Pre-login language selector supporting 8 Indian regional languages (English, Hindi, Hinglish, Kannada, Tamil, Telugu, Assamese, Nepali).
- **Passwordless OTP Login:** OTP authentication via SMS (MSG91) eliminates password creation/memorization friction.
- **Guided Tele-Onboarding:** For workers unable to complete self-registration, platform support agents execute phone-guided onboarding, filling details and availability grids on their behalf.
- **Mobile-First UX:** High-contrast tap targets (minimum 48px touch targets), simple icon-driven buttons, and minimal text inputs.

---

### Q8: Why are ratings and reviews moderated by an Admin before going live?
**Answer:**  
- **Preventing Spam & Abuse:** Public reviews enter a `Pending` state to prevent posting of vulgar language, personal contact numbers, or fraudulent claims.
- **Two-Way Fairness:** Both employers and workers can rate each other. Pre-display moderation ensures disputes are handled fairly without damaging reputations unfairly.

---

### Q9: What is the business and monetization model?
**Answer:**  
- **Workers:** 100% Free Forever (Zero application fees, zero placement commissions).
- **Employers:** Monetized through Razorpay subscription plans and single contact unlock passes. Subscriptions unlock full phone numbers, direct WhatsApp connectivity, and complete video introductions.

---

## 4. Scalability & System Trade-Offs Questions

### Q10: How would you scale Sevikaa to handle 1 Million active users?
**Answer:**  
1. **Caching Layer (Redis):** Cache high-frequency query results (e.g., society listings, popular worker profiles, active subscription statuses) in Redis to reduce PostgreSQL read load.
2. **Search Engine (Elasticsearch / Meilisearch):** Shift complex multi-filter searches (combining skills, availability, societies, and salary ranges) from Postgres SQL queries to a dedicated search cluster.
3. **Database Read Replicas:** Implement primary-replica replication for PostgreSQL, directing heavy search traffic to read replicas while reserving the primary database for writes (job applications, profile edits).
4. **Asynchronous Processing:** Move video transcoding, SMS dispatch, and email delivery to asynchronous background worker queues (e.g., BullMQ / RabbitMQ).

---

## 5. Quick Elevator Pitch (For the Interviewer)

> *"Sevikaa is a mobile-first, verified domestic workforce platform for India. Built on Next.js 16, React 19, and Supabase PostgreSQL, it bridges the urban trust gap between households and domestic help (maids, cooks, nannies). Unlike unmoderated job portals, Sevikaa operates under a 'Verified by Default' model—combining Aadhaar checks, Police verification, Telephonic onboarding, and Video intros. It uses a 3-tier society-first matching algorithm to connect employers with nearby workers while keeping the platform 100% free for workers."*
