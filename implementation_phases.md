# Sevikaa: Implementation Phases Overview

This document provides a phase-by-phase blueprint for implementing the **Sevikaa** domestic workforce platform.

---

## Phase 1: Foundation & Supabase Setup
The goal of this phase is to establish the Next.js frontend structure and the Supabase database schema, ensuring strong security via Row-Level Security (RLS).

1. **Next.js Initialization:**
   * Scaffold the project with Tailwind CSS, TypeScript, and strict ESLint configurations.
   * Setup the basic layout components (navbars, footers, page skeletons).

2. **Database Migration Scripts:**
   * Create initial migration files in PostgreSQL to provision:
     * `users` & custom Auth triggers.
     * `societies` (Apartment names, cities, geographic bounds).
     * `worker_profiles` (Language arrays, availability JSONB grids, verification status).
     * `employer_profiles` (Subscription tags, home coordinates).
     * `jobs` & `applications` (Tracking statuses like *Pending*, *Interviewing*, *Completed*).
     * `reviews` & `audit_logs` (For tracking administrator updates).

3. **Supabase Storage Buckets:**
   * Setup private storage with RLS policies for:
     * `worker-documents` (Protected Aadhaar & Police Check uploads; admins only).
     * `worker-selfies` & `worker-videos` (Public-facing, but pending approval before link resolution).

---

## Phase 2: Authentication & Multilingual Onboarding
This phase focuses on the pre-login experience, the passwordless OTP sign-in loops, and the multi-step onboarding funnels.

1. **Language Pre-selector:**
   * A clean, screen-sized landing route allowing workers to toggle languages (English, Hindi, Hinglish, Kannada, Tamil, Telugu, Assamese, Nepali) which adjusts the database translation dictionary context.

2. **Dual-OTP Authentication:**
   * Integrate Supabase Auth to enable passwordless logins via either:
     * **Mobile OTP** (using MSG91 as the SMS provider).
     * **Email OTP** (using Supabase's default mailer / AWS SES).

3. **Multilingual Worker Funnel:**
   * **Step 1:** Selfie capture and Basic Details (Name, gender, age, address).
   * **Step 2:** Languages selection and Experience details.
   * **Step 3:** Skills matching (Maid, Cook, Nanny) and weekly Availability grid scheduling.
   * **Step 4:** Salary expectation, Preferred Society, and Preferred Areas.
   * **Step 5:** Aadhaar Documents upload and Video Introduction recording.

4. **Employer Setup Funnel:**
   * Simple registration capture for Company/Home Profile details, Billing Address, and default Society choices.

---

## Phase 3: Society-First Geo-Matching Engine
This phase implements the proximity-based search logic which is the core matching USP of Sevikaa.

1. **Geo-Coordinate Matching functions:**
   * Write PostgreSQL triggers/RPCs using PostGIS or radial calculations to compute distance approximations between Employer Job coordinates and Worker preferred societies.

2. **Ranking Priorities System:**
   * Create matching query hooks filtering results by:
     * **Level 1:** Same Apartment/Society.
     * **Level 2:** Adjacent societies (within 1–2 km).
     * **Level 3:** Service Area radius.

3. **Location Privacy Masking:**
   * Ensure absolute GPS coordinates are never sent to the frontend. The UI only displays the approximate distance (e.g., "Within 300 meters" or "In JP Nagar, Area").

---

## Phase 4: Mobile-First Dashboards
Implementation of responsive layouts optimized for mobile devices, using large touch elements and single-tap actions.

1. **Worker Dashboard (`/worker/dashboard`):**
   * **My Profile:** View/edit personal details.
   * **Availability:** Grid selector for weekly schedule slots.
   * **Job Applications & Saved Jobs:** Browse and apply to listings.
   * **Interview Requests:** Scheduled Admin/Employer meetups.
   * **Documents & Verification:** Status checking of Aadhaar/selfie badges.
   * **Notifications:** SMS and system logs feed.
   * **Subscription & Wallet:** Check free state and future earnings.
   * **Settings:** Language selector and log out.

2. **Employer Dashboard (`/employer/dashboard`):**
   * **Dashboard:** Unified metrics overview.
   * **Post Job:** Multi-step job configuration form.
   * **Search Workers:** Search with filters (Society, Skills, Availability).
   * **Applications & Saved Workers:** Bookmark and manage candidates.
   * **Subscription & Payments:** Tiers details and invoice history.
   * **Contact History:** Call/WhatsApp unlock registers.
   * **Notifications & Settings:** Match notifications and account setup.

3. **Admin Dashboard (`/admin/dashboard`):**
   * **Queues:** Pending Workers, Pending Employers, Pending Jobs, Reviews, Documents.
   * **Interviews:** Log calls and meetings schedules.
   * **Verification & Reports:** Set badges and inspect user claims.
   * **Notifications:** System-wide announcements.

4. **Super Admin Dashboard (`/super-admin/dashboard`):**
   * **Everything:** Access to all Admin dashboard views.
   * **Admin Management:** Create, block, or delete Admin accounts.
   * **Revenue & Analytics:** Interactive charts for subscriptions.
   * **Cities & Society Management:** Operational areas definitions.
   * **Pricing & Settings:** Subscription cost configurators and API Keys registry.
   * **Audit Logs:** Detailed record of all admin updates.

---

## Phase 5: Integrations & Transactional Workflows
Connecting payment gates, SMS notification, and transaction email configurations.

1. **Razorpay Subscriptions:**
   * Integrate Razorpay checkout inside the Employer dashboard.
   * Setup API handlers and webhook endpoints in Next.js (`/api/webhooks/razorpay`) to instantly update an employer's tier and billing history in Supabase upon successful charge.

2. **MSG91 Notification Triggers:**
   * Hook SMS events to notify workers in their selected language when:
     * An Admin approves their profile.
     * An employer requests an interview.

3. **Amazon SES Mailer:**
   * Configure SES to dispatch HTML receipts, automated verification reminders, and administrative logs.

---

## Phase 6: Public Website & Regulatory Policies
Creating the visitor pages, sitemaps, and Razorpay-ready legal policies.

1. **Public Marketing Pages:**
   * Construct Home, About, How It Works, Pricing table, Safety, Contact, FAQ, Blog, and Careers pages.

2. **Legal Footer Policies:**
   * Add exact routing and styling for compliance requirements:
     * Terms & Conditions, Privacy Policy.
     * Refund & Cancellation Policy (Razorpay mandatory policy).
     * Shipping & Delivery Policy (specifying digital-only services).
     * Disclaimer, Cookie Policy.

3. **SEO optimization:**
   * Create static sitemaps (`sitemap.xml`) and semantic metadata tags.

---

## Phase 7: Security Audit, Testing & Launch
The final phase validates performance, mobile UI bugs, and backend access controls.

1. **RLS Policy Auditing:**
   * Run penetration scripts to ensure standard users cannot access raw document files or update databases.

2. **Lighthouse Audits:**
   * Optimize CSS/JS bundles for fast loading over standard Indian mobile cellular networks.

3. **Staging & Custom Domain Setup:**
   * Deploy codebase onto Vercel, link the `sevikaa.in` domain, configure DNS, and launch.
