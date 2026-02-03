# Complete Email Verification Setup Guide

## 🎯 Overview
This guide will help you set up email verification for the United Health Portal using Supabase.

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Enable Email Confirmations in Supabase

1. **Go to Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project**: United Health Portal
3. **Navigate to**: `Authentication` → `Providers` → `Email`
4. **Enable these settings**:
   - ✅ **Confirm email**: Toggle **ON**
   - ✅ **Secure email change**: Toggle **ON** (recommended)
5. **Click Save**

### Step 2: Configure Redirect URLs

1. **Navigate to**: `Authentication` → `URL Configuration`
2. **Set Site URL**:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`
3. **Add Redirect URLs** (click "Add URL" for each):
   ```
   http://localhost:5173/verify-email
   http://localhost:5173/reset-password
   http://localhost:5173/dashboard
   ```

### Step 3: Test Email Verification

1. **Sign up** with a new email at `http://localhost:5173/signup`
2. **Check Inbucket** for the verification email:
   - In Supabase Dashboard, go to: `Authentication` → `Email Templates`
   - Click **"View in Inbucket"** or check the link in your project settings
3. **Click the verification link** in the email
4. **Verify** you're redirected to the verify-email page
5. **Confirm** you can access the dashboard

---

## 📧 How It Works

### Signup Flow

```
User Signs Up
    ↓
Account Created (unverified)
    ↓
Verification Email Sent
    ↓
User Redirected to /verify-email
    ↓
User Checks Email
    ↓
User Clicks Verification Link
    ↓
Email Verified
    ↓
Redirected to Dashboard
```

### What Happens Behind the Scenes

1. **User submits signup form**
   - Frontend calls `signup()` from AuthContext
   - Supabase creates user account (status: unverified)

2. **Supabase sends verification email**
   - Email contains a magic link with tokens
   - Link format: `http://localhost:5173/verify-email#access_token=xxx&type=signup`

3. **User clicks email link**
   - Browser opens `/verify-email` page
   - Page extracts tokens from URL hash
   - Calls `supabase.auth.setSession()` to verify

4. **Email verified**
   - User status updated to verified
   - User redirected to dashboard
   - User can now access the app

---

## 🧪 Testing with Inbucket (Development)

**What is Inbucket?**
Inbucket is a built-in email testing tool provided by Supabase for development. All emails sent by Supabase appear here instead of being sent to real email addresses.

**How to Access Inbucket:**

1. **Option 1 - Via Email Templates**:
   - Go to: `Authentication` → `Email Templates`
   - Look for "View in Inbucket" link at the top
   - Click to open Inbucket interface

2. **Option 2 - Direct URL**:
   - Check your Supabase project settings for the Inbucket URL
   - Usually: `https://[project-ref].supabase.co/project/[project-id]/auth/emails`

**Using Inbucket:**
1. Sign up with any email (e.g., `test@example.com`)
2. Open Inbucket
3. Find the email in the inbox
4. Click to open and view the verification link
5. Click the verification link to test the flow

---

## 🎨 Customize Email Templates (Optional)

### Access Email Templates

1. Go to: `Authentication` → `Email Templates`
2. Select **"Confirm signup"** template

### Available Variables

- `{{ .ConfirmationURL }}` - The verification link
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Verification token

### Example Custom Template

See the full HTML template in [EMAIL_VERIFICATION_SETUP.md](file:///c:/Users/Madhav%20Gupta/Desktop/PROJECTS/united-health-portal/backend/EMAIL_VERIFICATION_SETUP.md)

---

## 🚨 Common Issues & Solutions

### Issue 1: "Email not received"

**Solution**:
- ✅ Check Inbucket (for development)
- ✅ Check spam folder (for production)
- ✅ Verify email confirmations are enabled
- ✅ Check Supabase Auth logs for errors

### Issue 2: "Verification link doesn't work"

**Solution**:
- ✅ Ensure redirect URLs are configured correctly
- ✅ Check that URL includes `#access_token=...`
- ✅ Verify link hasn't expired (24 hours)
- ✅ Clear browser cache and try again

### Issue 3: "User can't sign up"

**Solution**:
- ✅ Check browser console for errors (F12)
- ✅ Verify Supabase URL and anon key in `.env`
- ✅ Check Supabase Auth logs
- ✅ Ensure email confirmations are enabled

### Issue 4: "Emails going to spam"

**Solution** (Production only):
- ✅ Configure custom SMTP (SendGrid, AWS SES)
- ✅ Set up SPF, DKIM, and DMARC records
- ✅ Use a verified sending domain
- ✅ Follow email best practices

---

## 🔒 Security Features

### Built-in Security

- ✅ **Tokens expire in 24 hours** - Links are time-limited
- ✅ **Single-use tokens** - Each link can only be used once
- ✅ **Secure token exchange** - Handled by Supabase
- ✅ **Rate limiting** - Resend cooldown (60 seconds)

### Best Practices

1. **Always verify emails** before granting full access
2. **Use HTTPS** in production
3. **Monitor** verification attempts
4. **Log** suspicious activity
5. **Implement** rate limiting on resend

---

## 🚀 Production Deployment

### Before Going Live

1. **Update Site URL**:
   - Change from `http://localhost:5173`
   - To your production domain: `https://yourdomain.com`

2. **Update Redirect URLs**:
   - Add production URLs:
   ```
   https://yourdomain.com/verify-email
   https://yourdomain.com/reset-password
   https://yourdomain.com/dashboard
   ```

3. **Configure Custom SMTP** (Recommended):
   - Choose provider: SendGrid, AWS SES, Mailgun, etc.
   - Get SMTP credentials
   - Configure in: `Project Settings` → `Auth` → `SMTP Settings`

4. **Test Thoroughly**:
   - Test signup flow
   - Test email delivery
   - Test verification link
   - Test error scenarios

5. **Monitor**:
   - Set up email delivery monitoring
   - Monitor Auth logs
   - Track verification rates

---

## 📊 Email Providers Comparison

| Provider | Free Tier | Paid Plan | Best For |
|----------|-----------|-----------|----------|
| **Resend** | 3,000/month | $20/month (50k) | Modern apps, easy setup |
| **SendGrid** | 100/day | $15/month (40k) | Established apps, analytics |
| **AWS SES** | 62k/month* | $0.10/1k emails | High volume, AWS users |
| **Mailgun** | 5k for 3 months | $35/month (50k) | Reliable, established |

*Free tier only if using EC2

---

## ✅ Checklist

### Initial Setup
- [ ] Enable email confirmations in Supabase
- [ ] Configure Site URL
- [ ] Add redirect URLs
- [ ] Test with Inbucket

### Testing
- [ ] Sign up with test email
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Verify redirect to dashboard
- [ ] Test resend functionality

### Production
- [ ] Update Site URL to production domain
- [ ] Add production redirect URLs
- [ ] Configure custom SMTP (recommended)
- [ ] Test email delivery
- [ ] Monitor verification rates

---

## 🆘 Need Help?

### Resources
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Discord](https://discord.supabase.com/)

### Support
If you're still having issues:
1. Check browser console (F12) for errors
2. Check Supabase Auth logs
3. Review this guide step-by-step
4. Ask in Supabase Discord community

---

## 🎉 You're All Set!

Once you've completed the setup:
1. ✅ Users will receive verification emails
2. ✅ Email verification is required before dashboard access
3. ✅ Secure, production-ready authentication flow
4. ✅ Professional user experience

**Happy coding! 🚀**
