# Complete Supabase Configuration Guide

This guide will walk you through configuring your Supabase project for the United Health Portal.

## 📋 Prerequisites

Your Supabase project is already set up with:
- **Project ID**: `dnxozuhdiwbzdyolnciv`
- **Project URL**: `https://dnxozuhdiwbzdyolnciv.supabase.co`
- Credentials already configured in `.env` file ✅

---

## 🗄️ Step 1: Apply Database Migrations

You need to run SQL migrations to create tables, policies, and storage buckets.

### Instructions:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/dnxozuhdiwbzdyolnciv

2. **Navigate to SQL Editor**
   - Click on the **SQL Editor** icon in the left sidebar (looks like `</>`)
   - Click **"New Query"** button

3. **Run Migration 001 - Initial Schema**
   - Open file: `supabase/migrations/001_initial_schema.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor
   - Click **"Run"** (or press Ctrl+Enter)
   - Wait for "Success. No rows returned" message

4. **Run Migration 002 - RLS Policies**
   - Open file: `supabase/migrations/002_rls_policies.sql`
   - Copy ALL the contents
   - Click **"New Query"** again
   - Paste into the SQL Editor
   - Click **"Run"**
   - Wait for success message

5. **Run Migration 003 - Storage Buckets**
   - Open file: `supabase/migrations/003_storage_buckets.sql`
   - Copy ALL the contents
   - Click **"New Query"** again
   - Paste into the SQL Editor
   - Click **"Run"**
   - Wait for success message

### ✅ Verify Database Setup

After running migrations, verify:

1. **Check Tables**
   - Click **"Table Editor"** in sidebar
   - You should see: `profiles`, `hospital_bills`, `insurance_documents`, `chat_messages`

2. **Check Storage**
   - Click **"Storage"** in sidebar
   - You should see: `hospital-bills`, `insurance-documents` buckets

---

## 🔐 Step 2: Configure Authentication

### Enable Email Confirmations (Optional)

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to OFF for easier testing (or keep ON for production)
3. Click **"Save"**

### Add Redirect URLs for Password Reset

1. Go to **Authentication** → **URL Configuration**
2. Scroll to **"Redirect URLs"**
3. Add these URLs:
   ```
   http://localhost:8080/reset-password
   https://your-production-domain.com/reset-password
   ```
4. Click **"Save"**

### Disable Email Confirmation for Testing (Recommended)

1. Go to **Authentication** → **Settings**
2. Find **"Enable email confirmations"**
3. **Uncheck** this box (makes testing easier)
4. Click **"Save"**

---

## 📧 Step 3: Configure Email Templates

### Setup Password Reset Email

1. Go to **Authentication** → **Email Templates**
2. Click on **"Reset Password"** template
3. The default template should work, but you can customize:

**Subject**: Reset Your Password
**Body**: You can use the default or customize it

```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

4. Click **"Save"**

### Setup Confirmation Email (if enabled)

1. Click on **"Confirm Signup"** template
2. Customize if needed
3. Click **"Save"**

---

## 📦 Step 4: Verify Storage Configuration

### Check Storage Buckets

1. Go to **Storage** in sidebar
2. You should see two buckets:
   - **hospital-bills** (private)
   - **insurance-documents** (private)

### Verify Bucket Policies

1. Click on **hospital-bills** bucket
2. Click **"Policies"** tab
3. You should see RLS policies for:
   - Upload (INSERT)
   - View (SELECT)
   - Update (UPDATE)
   - Delete (DELETE)

4. Repeat for **insurance-documents** bucket

---

## 🧪 Step 5: Test the Setup

### Test 1: Create an Account

1. Clear old data: Visit `http://localhost:8080/clear-data.html`
2. Go to: `http://localhost:8080/signup`
3. Fill in the form and submit
4. Check Supabase Dashboard:
   - Go to **Authentication** → **Users**
   - You should see your new user
   - Go to **Table Editor** → **profiles**
   - You should see your profile auto-created

### Test 2: Login

1. Go to: `http://localhost:8080/login`
2. Login with your credentials
3. You should be redirected to `/dashboard`

### Test 3: Upload a Bill

1. Navigate to `/bill-upload`
2. Fill in bill details
3. Upload a file (PDF or image)
4. Submit the form
5. Check Supabase:
   - **Table Editor** → **hospital_bills** (should have new row)
   - **Storage** → **hospital-bills** (should have uploaded file)

### Test 4: Forgot Password

1. Go to login page
2. Click "Forgot password?"
3. Enter your email
4. Check your email for reset link
   - If you don't receive it, check Supabase logs:
   - **Logs** → **Auth Logs** (see if email was sent)

---

## ⚙️ Advanced Configuration (Optional)

### Email Provider Setup

By default, Supabase uses their email service (limited to 3 emails per hour in free tier).

**For Production**, set up a custom SMTP provider:

1. Go to **Project Settings** → **Auth**
2. Scroll to **"SMTP Settings"**
3. Enable custom SMTP
4. Configure your email provider (SendGrid, Mailgun, etc.)

### Rate Limiting

1. Go to **Authentication** → **Rate Limits**
2. Adjust limits if needed
3. Default settings are usually fine for development

---

## 🚨 Troubleshooting

### "Profile not found" Error

**Solution**: The trigger might not have run. Manually create profile:
```sql
INSERT INTO profiles (id, email, member_id)
SELECT id, email, 'UH-2024-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

### Storage Upload Fails

**Check**:
1. File size is under 10MB
2. Storage buckets exist
3. RLS policies are applied
4. User is authenticated

### Email Not Sending

**Check**:
1. Email confirmations setting in **Auth Settings**
2. Email template is saved
3. SMTP is configured (if using custom SMTP)
4. Check Auth Logs for errors

### TypeScript Errors in IDE

**Normal!** These will resolve after:
1. Running migrations
2. Optionally running: `npx supabase gen types typescript --project-id dnxozuhdiwbzdyolnciv > src/integrations/supabase/types.ts`

---

## 📝 Summary Checklist

Use this checklist to track your progress:

- [ ] Opened Supabase Dashboard
- [ ] Ran migration 001_initial_schema.sql
- [ ] Ran migration 002_rls_policies.sql
- [ ] Ran migration 003_storage_buckets.sql
- [ ] Verified tables created (profiles, hospital_bills, insurance_documents, chat_messages)
- [ ] Verified storage buckets created (hospital-bills, insurance-documents)
- [ ] Configured authentication settings
- [ ] Added redirect URLs for password reset
- [ ] Configured email templates
- [ ] Tested signup (created account)
- [ ] Tested login
- [ ] Tested file upload
- [ ] Tested forgot password

---

## 🎯 What I Can't Do (You Must Do)

I cannot access the Supabase Dashboard directly, so **you must**:

1. ✋ Run the SQL migrations in the Supabase SQL Editor
2. ✋ Configure authentication settings
3. ✋ Add redirect URLs
4. ✋ Verify the setup by testing signup/login

Everything else (code, migrations, configuration files) is already done!

---

## 📞 Need Help?

If you encounter issues:
1. Check the **Logs** section in Supabase Dashboard
2. Look at browser console for errors (F12)
3. Check the files:
   - `BACKEND_SETUP.md` - Backend setup guide
   - `AUTH_FIXES.md` - Authentication fixes
   - This file - Supabase configuration

---

## Quick Start (TL;DR)

1. **Apply migrations**: Copy/paste each SQL file into Supabase SQL Editor
2. **Disable email confirmation**: Auth → Settings → Uncheck "Enable email confirmations"
3. **Add redirect URL**: Auth → URL Configuration → Add `http://localhost:8080/reset-password`
4. **Test**: Visit `http://localhost:8080/clear-data.html`, then signup!
