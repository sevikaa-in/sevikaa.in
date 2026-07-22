# Vercel & Supabase Production Launch Guide

This guide details the operational steps to deploy the **Sevikaa** platform on Vercel and link it to the custom domain `sevikaa.in`.

---

## 1. Supabase Project Setup
1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Access the **SQL Editor** and run the database migrations in order:
   * [20260722000000_init_schema.sql](file:///c:/Sevikaa/supabase/migrations/20260722000000_init_schema.sql)
   * [20260722000001_storage_setup.sql](file:///c:/Sevikaa/supabase/migrations/20260722000001_storage_setup.sql)
   * [20260722000002_seed_societies.sql](file:///c:/Sevikaa/supabase/migrations/20260722000002_seed_societies.sql)
   * [20260722000003_search_rpc.sql](file:///c:/Sevikaa/supabase/migrations/20260722000003_search_rpc.sql)
3. Access **Storage** in the dashboard and verify that the following buckets have been provisioned:
   * `worker-documents` (Private)
   * `worker-selfies` (Public)
   * `worker-videos` (Public)

---

## 2. Vercel Deployment Configuration
1. Import your Sevikaa GitHub repository into [Vercel](https://vercel.com).
2. Configure **Environment Variables** in the Vercel project settings:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_live_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_live_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_live_supabase_service_role_key
   
   MSG91_AUTH_KEY=your_live_msg91_auth_key
   MSG91_TEMPLATE_ID=your_live_msg91_template_id
   
   AWS_SES_ACCESS_KEY_ID=your_live_aws_ses_key_id
   AWS_SES_SECRET_ACCESS_KEY=your_live_aws_ses_secret_key
   AWS_SES_REGION=ap-south-1
   
   RAZORPAY_KEY_ID=your_live_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_live_razorpay_key_secret
   
   NEXT_PUBLIC_APP_URL=https://sevikaa.in
   ```
3. Set **Build Command**: `next build`.
4. Trigger the deployment. Vercel will build the optimized production bundles and generate dynamic endpoints.

---

## 3. Custom Domain & DNS Settings
To route traffic from `sevikaa.in` to Vercel:
1. Access the **Domains** section in Vercel project settings.
2. Add `sevikaa.in` and `www.sevikaa.in`.
3. Configure your domain DNS records at your registrar:
   * **A Record**: Point `@` to `76.76.21.21` (Vercel IP).
   * **CNAME Record**: Point `www` to `cname.vercel-dns.com`.
4. Vercel will automatically provision SSL certificates and launch the platform.
