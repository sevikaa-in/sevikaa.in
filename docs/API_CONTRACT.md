# Sevikaa Canonical API Contract & Architecture Specification

This document defines the canonical API contracts, authorization layers, DTO models, and role boundaries shared between the **Web Portals** and the **Mobile Applications (React Native / Expo)**.

---

## 1. Global Authentication & Session Headers

All authenticated API requests from Web or Mobile clients MUST include the standard HTTP `Authorization` Bearer token header:

```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```

---

## 2. Worker Domain Endpoints (`/api/worker/*`)

### `GET /api/worker/jobs`
Retrieve available job requisitions matching candidate criteria.

- **Query Parameters**:
  - `limit` (number, default: 30, max: 100)
  - `category` (string, optional: `maid`, `cook`, `nanny`, `driver`, `gardener`, `eldercare`)
  - `society_id` (UUID string, optional)
- **Response DTO**:
```json
{
  "success": true,
  "jobs": [
    {
      "id": "uuid",
      "employer_id": "uuid",
      "category": "maid",
      "description": "Full-day maid for 3BHK",
      "salary_range_min": 14000,
      "salary_range_max": 18000,
      "society_name": "Adarsh Palm Retreat",
      "society_id": "uuid",
      "status": "active",
      "created_at": "2026-08-10T12:00:00Z",
      "employer_name": "Sharma Household"
    }
  ],
  "count": 1
}
```

### `POST /api/worker/profile/update`
Update candidate worker profile details.

---

## 3. Employer Domain Endpoints (`/api/employer/*`)

### `GET /api/employer/jobs`
Retrieve job requisitions posted by the authenticated employer.

- **Query Parameters**:
  - `limit` (number, default: 50)
  - `userId` (string, optional override for authorized sessions)
- **Response DTO**:
```json
{
  "success": true,
  "jobs": [
    {
      "id": "uuid",
      "employer_id": "uuid",
      "category": "cook",
      "description": "Morning cook needed",
      "salary_range_min": 12000,
      "salary_range_max": 15000,
      "society_name": "Adarsh Palm Retreat",
      "status": "active",
      "created_at": "2026-08-10T10:00:00Z",
      "applicant_count": 4
    }
  ],
  "count": 1
}
```

### `GET /api/employer/invoices`
Retrieve official GST tax invoices and receipts for subscription plans.

- **Response DTO**:
```json
{
  "success": true,
  "invoices": [
    {
      "id": "pay_12345",
      "order_id": "order_12345",
      "user_id": "uuid",
      "employer_name": "Sharma Household",
      "employer_email": "employer@sevikaa.in",
      "plan_name": "Premium Subscription Pass",
      "amount": 699,
      "payment_method": "UPI",
      "status": "captured",
      "created_at": "2026-08-10T14:00:00Z"
    }
  ],
  "count": 1
}
```

---

## 4. Admin & Super-Admin Boundaries (`/api/admin/*` & `/api/super-admin/*`)

> [!CAUTION]
> Mobile Worker and Employer applications MUST NEVER invoke `/api/admin/*` or `/api/super-admin/*` routes. Admin endpoints strictly enforce zero-trust session context via `verifyAdminSecurityContext()`.

---

## 5. Security & Fail-Closed Guarantee
- **Auth Failure**: If OTP verification or token validation fails, the mobile client must fail closed and display an error message rather than proceeding into the application flow.
- **Central Upload Endpoint**: All mobile document uploads must use `getApiUrl('api/upload')` instead of hardcoded `localhost` URLs.
