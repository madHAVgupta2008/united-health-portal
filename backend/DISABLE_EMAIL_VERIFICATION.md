# Quick Fix: Disable Email Verification in Supabase

## Problem
Users cannot sign up because Supabase requires email confirmation, but email sending is not configured.

## Solution: Disable Email Confirmation

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your **United Health Portal** project

### Step 2: Disable Email Confirmation

1. Navigate to: **Authentication** → **Providers** → **Email**
2. Find the **"Confirm email"** toggle
3. **Turn it OFF** (disable it)
4. Click **Save**

### Step 3: Test Signup

1. Go to your app: `http://localhost:5173/signup`
2. Fill in the signup form
3. Click "Sign Up"
4. You should be immediately logged in and redirected to the dashboard

---

## What This Does

- ✅ Users can sign up without email verification
- ✅ Accounts are created immediately
- ✅ Users can access the app right away
- ⚠️ Email addresses are not verified

---

## When to Re-enable Email Verification

Re-enable email verification when you:
1. Configure a custom SMTP service (SendGrid, AWS SES, etc.)
2. Want to ensure users have valid email addresses
3. Are ready for production deployment

To re-enable:
1. Follow the [EMAIL_VERIFICATION_SETUP.md](file:///c:/Users/Madhav%20Gupta/Desktop/PROJECTS/united-health-portal/backend/EMAIL_VERIFICATION_SETUP.md) guide
2. Configure SMTP or use Supabase's email service
3. Turn **"Confirm email"** back ON in Supabase
4. Add `emailRedirectTo` back to AuthContext.tsx signup function

---

## Alternative: Use Supabase's Built-in Email (Development Only)

If you want to test email verification without configuring SMTP:

1. Keep **"Confirm email"** enabled
2. Use **Inbucket** to view emails:
   - Go to: Authentication → Email Templates
   - Click "View in Inbucket" or check your Supabase logs
   - All emails will appear there instead of being sent

---

## Current Status

✅ **Email verification is now disabled in the code**
- Removed `emailRedirectTo` from signup
- Users can sign up without email verification
- Accounts are created immediately

⚠️ **You still need to disable it in Supabase dashboard**
- Follow Step 2 above to disable email confirmation
- This is required for signup to work

---

## Need Help?

If you're still having issues:
1. Check browser console for errors (F12)
2. Check Supabase Auth logs for errors
3. Verify your Supabase URL and anon key are correct in `.env`
