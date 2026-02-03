# Enable Email Verification in Supabase

## ⚠️ CRITICAL: You Must Enable Email Confirmation

For the email verification requirement to work, you **MUST** enable email confirmation in your Supabase dashboard.

---

## Step-by-Step Instructions

### 1. Open Supabase Dashboard

Go to: https://supabase.com/dashboard/project/dnxozuhdiwbzdyolnciv

### 2. Navigate to Email Provider Settings

1. Click on **Authentication** in the left sidebar
2. Click on **Providers**
3. Click on **Email** provider

### 3. Enable Email Confirmation

1. Find the **"Confirm email"** toggle
2. **Turn it ON** (toggle to the right, should be blue/green)
3. Click **"Save"** at the bottom of the page

### 4. Verify Redirect URLs (Already Configured)

Make sure these redirect URLs are configured:

1. Go to **Authentication** → **URL Configuration**
2. Check that **Site URL** is set to: `http://localhost:5173`
3. Check that **Redirect URLs** include:
   ```
   http://localhost:5173/verify-email
   http://localhost:5173/dashboard
   ```

---

## What This Does

When email confirmation is enabled:

✅ **Users cannot login until they verify their email**
- After signup, users receive a verification email
- Clicking the link verifies their email
- Only then can they login

✅ **Existing unverified accounts are blocked**
- Any accounts created before enabling this will need to verify their email
- They'll see: "Please verify your email address before logging in"

✅ **Database profiles are still created**
- The profile is created immediately upon signup (via database trigger)
- But the user cannot access the application until email is verified

---

## Testing the Setup

### Test 1: Sign Up New User

1. Go to `http://localhost:5173/signup`
2. Fill out the form and submit
3. You should be redirected to the verify-email page
4. Check your email for the verification link

### Test 2: Try to Login Before Verification

1. Go to `http://localhost:5173/login`
2. Enter the credentials you just signed up with
3. You should see an error: **"Please verify your email address before logging in"**

### Test 3: Verify Email and Login

1. Click the verification link in your email
2. You should be redirected to the verify-email page
3. The page should show "Email Verified!" and redirect to dashboard
4. Now try logging in - it should work!

### Test 4: Check Database

1. Go to Supabase Dashboard → **Table Editor** → **profiles**
2. You should see the profile was created
3. Go to **Authentication** → **Users**
4. Check the user - `email_confirmed_at` should have a timestamp after verification

---

## Troubleshooting

### "Email confirmation is disabled" Error

**Solution**: You haven't enabled email confirmation in Supabase yet. Follow steps 1-3 above.

### Not Receiving Verification Emails

**Check**:
1. Spam/junk folder
2. Supabase Dashboard → **Logs** → **Auth Logs** (to see if email was sent)
3. For development, you can use Inbucket (check Supabase docs)

### Verification Link Expired

**Solution**: 
- Links expire after 24 hours
- Click "Resend Verification Email" on the verify-email page
- Or sign up again with the same email

### Already Have Unverified Accounts

**Solution**:
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Delete the unverified users
3. Sign up again

---

## Summary

✅ **What you need to do**:
1. Enable "Confirm email" in Supabase Dashboard
2. Test the signup flow
3. Verify that login is blocked until email is verified

✅ **What the code does**:
- Checks `email_confirmed_at` field on login
- Blocks unverified users with a clear error message
- Allows access only after email verification

---

## Production Checklist

Before deploying to production:

- [ ] Email confirmation is enabled
- [ ] Site URL is set to production domain
- [ ] Redirect URLs include production URLs
- [ ] Email templates are customized (optional)
- [ ] Custom SMTP is configured (recommended for better deliverability)
- [ ] Tested signup and verification flow
