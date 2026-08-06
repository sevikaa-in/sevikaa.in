# Sevikaa: Technical Architecture & System Implementation Report

**Document Version:** 1.0.0  
**Project Name:** Sevikaa  
**Target Platform:** Web (Next.js 16 + React 19 + Supabase PostgreSQL)  
**Parent Entity:** Powered by YugaYatra Retail (OPC) Private Limited  

---

## 1. Executive Summary & Core Platform Vision

**Sevikaa** is a technology platform designed to bridge the trust gap between verified domestic workers (maids, cooks, nannies) and employers residing in urban households and gated societies across India. 

Unlike conventional unmoderated job directories, Sevikaa employs a **"Verified and Moderated by Default"** operational model. Every worker profile, government document, video introduction, job posting, and public review undergoes strict verification and content moderation prior to public visibility.

### Key Highlights:
- **Core Categories:** Maid (Cleaning/Housekeeping), Cook (Meal Preparation/Kitchen), Nanny (Childcare/Infant Supervision).
- **Target Audience:** Urban households (Employers) and informal sector workers (Domestic Workers).
- **Worker Fee Policy:** 100% Free for workers (Zero registration fees, zero commissions).
- **Employer Model:** Subscription-based contact unlock and job posting system.

---

## 2. Technical Stack & System Architecture

Sevikaa is engineered with a modern, high-performance tech stack focused on fast mobile load speeds, strict data privacy, and seamless scalability.

| Component | Technology Used | Purpose / Functionality |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router) | Server-Side Rendering (SSR), SEO optimization, responsive layout. |
| **UI Library** | React 19 | Dynamic interactive UI components, client-side state management. |
| **Styling Engine** | Tailwind CSS v4 | Utility-first CSS, mobile-first design, custom design tokens. |
| **Icons** | Lucide React | Flat, high-contrast UI iconography. |
| **Database & Auth** | Supabase (PostgreSQL) | Managed PostgreSQL, Row Level Security (RLS), Supabase Auth. |
| **Storage Engine** | Supabase Private Buckets | Encrypted document storage (Aadhaar, Police Check) & Video Intros. |
| **SMS Gateway** | MSG91 | Mobile OTP authentication and multi-lingual transactional SMS alerts. |
| **Email Gateway** | Amazon SES | Transactional notifications, email OTPs, subscription invoices. |
| **Payment Gateway** | Razorpay | Subscription processing, payment webhooks, invoice generation. |
| **Media Hosting** | Cloudinary / Supabase Storage | Video intro compression, CDN distribution, image processing. |

---

## 3. System User Roles & Access Hierarchy

The application defines distinct roles with strictly isolated permissions via Supabase Row-Level Security (RLS):

```
+-----------------------------------------------------------------------+
|                              USER ROLES                               |
+-----------------------------------------------------------------------+
| 1. VISITOR        | Marketing Pages, FAQ, Public Directory Preview    |
| 2. WORKER         | Profile Setup, Availability Grid, Job Apply (Free)|
| 3. EMPLOYER       | Job Posting, Hyper-Local Search, Contact Unlocks  |
| 4. GOVERNANCE/ADMIN| Document Inspection, Tele-Verification, Moderation|
+-----------------------------------------------------------------------+
```

1. **Visitor:** Public landing pages, company background, public FAQs, pricing plans.
2. **Worker (Free Tier):** Access to multi-lingual profile creation, weekly availability selector, document upload, video introduction upload, job applications, direct contact with interested employers.
3. **Employer (Subscription Tier):** Ability to post job openings, execute society-first searches, view detailed worker verification badges, unlock direct phone/WhatsApp contact information.
4. **Platform Governance & Support (Admin):** High-level quality assurance layer tasked with verifying worker documents, approving intro videos, providing telephonic onboarding assistance, verifying gated society listings, and moderating reviews.

---

## 4. Worker Lifecycle & Functional Modules

### 4.1 Multilingual Onboarding Funnel
To accommodate varying digital literacy levels, workers can select their preferred language prior to login:
- **Supported Languages:** English, Hindi, Hinglish, Kannada, Tamil, Telugu, Assamese, Nepali.
- **Passwordless Auth:** Mobile OTP or Email OTP authentication powered by Supabase Auth and MSG91.

### 4.2 Availability Grid Engine
Workers define precise weekly availability to prevent scheduling conflicts with potential employers.

- **Days:** Monday through Sunday.
- **Time Slots:**
  - Early Morning (6:00 AM – 9:00 AM)
  - Morning (9:00 AM – 12:00 PM)
  - Afternoon (12:00 PM – 3:00 PM)
  - Evening (3:00 PM – 6:00 PM)
  - Night (6:00 PM – 9:00 PM)
- **Work Types:** Full-Time (8-12 hrs), Part-Time (Specific Slots), Live-in (24 hrs).

### 4.3 User-Specific Document & Video Upload
- **Identity Verification Documents:** Front and back images of Aadhaar Card, live selfie, optional Police Clearance Certificate (PCC).
- **Video / Audio Introduction Upload:** Short 30-60 second self-introduction recorded via smartphone browser.
- **Status Lifecycle:** `Pending Review` $\rightarrow$ `Tele Verification` $\rightarrow$ `Approved` $\rightarrow$ `Live`.

---

## 5. Employer Module & Hyper-Local Matching Engine

### 5.1 Job Posting & Slot Requirements
Employers create job posts specifying:
- Service Category (Maid, Cook, Nanny)
- Specific skills required (e.g., North/South Indian cooking, infant care, deep cleaning)
- Precise time slots required
- Offered monthly salary or hourly wage range
- Target Apartment Society / Locality

### 5.2 Society-First Geo-Matching Algorithm
To minimize travel time for workers and maximize hiring speed for employers, search results prioritize proximity via a 3-tier algorithm:

1. **Level 1 (Same Society):** Worker's preferred apartment complex directly matches Employer's society.
2. **Level 2 (Nearby Society):** Worker's preferred society is within 1–2 km radius.
3. **Level 3 (Service Radius / Sub-locality):** Match based on postal code, sub-locality, and worker's stated maximum travel distance.

*Note: For user safety, exact home addresses and GPS coordinates are never exposed publicly. Proximity is rendered as distance buckets (e.g., "Within 500m", "1.5 km away").*

### 5.3 Subscription & Contact Unlock Engine
Employers must possess an active Razorpay subscription or single contact pass to view full worker phone numbers and initiate direct WhatsApp conversations.

---

## 6. Curated Governance, Tele-Onboarding & Verification

### 6.1 Tele-Onboarding Assistance
For domestic workers who require assistance with digital registration:
- **Guided Phone Onboarding:** Dedicated support team members contact workers to verify details, record work history, and update availability on their behalf.
- **Background Checks & Questionnaire:** Standardized verification questions covering previous employment history, address confirmation, and identity validation.

### 6.2 Gated Societies Approval & Management
- Apartment complexes are added to the platform database as structured entities.
- Neighborhood boundaries and society names are validated by platform moderators to maintain accurate search indexes.

### 6.3 Document & Video Moderation
- **Private Storage Inspection:** Uploaded Aadhaar cards and background check documents are stored in private Supabase buckets. Access is strictly controlled via temporary, signed URLs.
- **Video Curation:** Introduction videos are reviewed to verify audio clarity, appropriate presentation, and safety compliance before approval.

### 6.4 Community Review Moderation
- Ratings (1–5 Stars) and text reviews submitted by employers or workers enter a `Pending` queue.
- Moderation checks prevent public display of personal contact details, inappropriate language, or spam.

---

## 7. Database Schema & Data Architecture (Supabase PostgreSQL)

The core database design comprises the following primary entities:

```
+-------------------+       +-----------------------+       +-------------------+
|     SOCIETIES     |       |         USERS         |       | EMPLOYER_PROFILES |
+-------------------+       +-----------------------+       +-------------------+
| id (PK)           |       | id (PK)               |       | id (PK)           |
| name              |       | email, phone          |       | user_id (FK)      |
| city              |       | role, status          |       | company_name      |
| coordinates       |       +-----------+-----------+       | subscription_stat |
+---------+---------+                   |                   +---------+---------+
          |                             |                             |
          |                             v                             v
          |                 +-----------------------+       +-------------------+
          +---------------->|    WORKER_PROFILES    |       |       JOBS        |
          |                 +-----------------------+       +-------------------+
          |                 | id (PK), user_id (FK) |       | id (PK)           |
          |                 | full_name, skills     |       | employer_id (FK)  |
          |                 | preferred_society(FK) |<------+ society_id (FK)   |
          |                 | availability_slots    |       | required_slots    |
          |                 | verification_badges   |       +---------+---------+
          |                 +-----------------------+                 |
          |                                                           v
          +-------------------------------------------------+   APPLICATIONS    |
                                                            +-------------------+
```

### Key Data Structures:
- **`users`**: Base authentication table linked to Supabase Auth.
- **`worker_profiles`**: Personal details, category skills array, JSONB availability matrix, verification status flags (`is_aadhaar_verified`, `is_police_verified`, `is_interview_verified`).
- **`employer_profiles`**: Household billing details, active subscription status.
- **`societies`**: Gated society names, pin codes, and locality definitions.
- **`jobs`**: Job postings, category requirements, offered salary, required JSONB slots.
- **`applications`**: Work application state tracking (`submitted`, `shortlisted`, `hired`).
- **`reviews`**: Two-way feedback entries stored with `status` flag (`pending`, `approved`, `hidden`).

---

## 8. Data Security, Privacy & Compliance

1. **Row-Level Security (RLS):** Supabase PostgreSQL RLS policies enforce role-based access. Users can only edit their own profile data.
2. **Identity Document Encryption:** Government IDs (Aadhaar) are stored in private S3/Supabase storage buckets and accessible only via short-lived signed URLs.
3. **Location Privacy Shield:** Exact physical locations are never stored as public strings or exposed via public APIs; only approximate distance vectors are returned.
4. **Legal & Payment Compliance:** Complete compliance with Razorpay integration rules (incorporating standard Privacy Policy, Terms & Conditions, Refund Policy, and Digital Delivery Policy).

---

## 10. Interview Frequently Asked Questions & Defense Section

### Q1: Why Next.js 16 App Router over React SPA?
**A:** Server-side rendering (SSR) for public SEO indexability, pre-rendered HTML for fast mobile performance (LCP < 1.5s), and unified Server Actions without needing a separate Express backend.

### Q2: Why Supabase (PostgreSQL) over MongoDB (NoSQL)?
**A:** Relational integrity across Users, Workers, Employers, Societies, Jobs, and Reviews; Row-Level Security (RLS) built into DB; native JSONB for flexible availability grid queries (`@>`).

### Q3: How does the Society-First Geo-Matching Algorithm work?
**A:** 3-tier sequence: Level 1 (Direct `society_id` match), Level 2 (Nearby societies within 1-2 km via Haversine coords), Level 3 (Locality/Postal code service radius).

### Q4: How is location privacy and identity document security maintained?
**A:** Aadhaar IDs are stored in private storage buckets and accessed only via short-lived 60-second signed URLs. Exact addresses are never exposed; only distance buckets (e.g., "Within 500m") are shown.

---

## 11. Conclusion

Sevikaa combines Next.js App Router performance, Supabase PostgreSQL data security, and hyper-local society matching to modernize domestic labor recruitment in India. By enforcing curated verification (Aadhaar, Police Check, Telephonic Onboarding, Video Intros) and keeping the platform 100% free for workers, Sevikaa ensures high trust, rapid hiring, and social impact.

