# Resend Email Setup Guide

## 🎯 Overview
Set up Resend with Supabase to send unlimited verification emails (3,000/month free tier).

---

## 📋 Step-by-Step Setup

### Step 1: Create Resend Account

1. **Go to**: [https://resend.com](https://resend.com)
2. **Click**: "Sign Up" or "Get Started"
3. **Sign up** with your email or GitHub account
4. **Verify** your email address

---

### Step 2: Get Your API Key

1. **Log in** to Resend Dashboard
2. **Go to**: "API Keys" in the left sidebar
3. **Click**: "Create API Key"
4. **Name it**: `United Health Portal - Supabase`
5. **Copy** the API key (starts with `re_...`)
   - ⚠️ **Important**: Save this key! You won't see it again

---

### Step 3: Add Domain (Optional but Recommended)

#### **Option A: Use Resend's Domain (Quick)**
- Use: `onboarding@resend.dev`
- No setup needed
- Works immediately
- Good for testing

#### **Option B: Use Your Own Domain (Production)**
1. **Go to**: "Domains" in Resend Dashboard
2. **Click**: "Add Domain"
3. **Enter** your domain: `yourdomain.com`
4. **Add DNS records** (Resend will show you what to add):
   - SPF record
   - DKIM record
   - DMARC record (optional)
5. **Verify** domain (can take a few minutes)
6. **Use**: `noreply@yourdomain.com` as sender

---

### Step 4: Configure SMTP in Supabase

1. **Go to**: [Supabase Dashboard](https://supabase.com/dashboard)
2. **Select**: Your United Health Portal project
3. **Navigate to**: `Project Settings` (gear icon) → `Auth`
4. **Scroll down** to: "SMTP Settings"
5. **Click**: "Enable Custom SMTP"

6. **Enter these details**:

   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP Username: resend
   SMTP Password: [paste your API key here - starts with re_...]
   Sender Email: onboarding@resend.dev
   Sender Name: United Health Portal
   ```

   **If using your own domain**:
   ```
   Sender Email: noreply@yourdomain.com
   Sender Name: United Health Portal
   ```

7. **Click**: "Save"

---

### Step 5: Test Email Sending

1. **Go to**: Your app at `http://localhost:5173/signup`
2. **Sign up** with a **real email address** (use your own email)
3. **Check your inbox** for the verification email
4. **Click** the verification link
5. **Verify** you're redirected to the dashboard

---

## 🎨 Customize Email Templates (Optional)

### In Supabase Dashboard:

1. **Go to**: `Authentication` → `Email Templates`
2. **Select**: "Confirm signup"
3. **Edit** the template (use the HTML template from EMAIL_VERIFICATION_SETUP.md)
4. **Save**

### In Resend Dashboard:

1. **Go to**: "Emails" to see all sent emails
2. **View** email previews
3. **Check** delivery status

---

## 📊 Monitor Email Sending

### Resend Dashboard

1. **Go to**: "Emails" tab
2. **See**:
   - ✅ Delivered emails
   - ⏳ Pending emails
   - ❌ Failed emails
   - 📊 Delivery rates

### Check Limits

1. **Go to**: "Usage" or "Billing"
2. **See**: How many emails you've sent this month
3. **Free tier**: 3,000 emails/month
4. **Upgrade** if you need more

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Resend account created
- [ ] API key generated and saved
- [ ] SMTP configured in Supabase
- [ ] Test email sent successfully
- [ ] Verification link works
- [ ] User redirected to dashboard

---

## 🔧 Troubleshooting

### "Authentication failed" error

**Problem**: Wrong API key or username

**Solution**:
- Double-check API key (should start with `re_...`)
- Username must be exactly: `resend` (lowercase)
- Re-generate API key if needed

### Emails not sending

**Problem**: SMTP not configured correctly

**Solution**:
1. Verify SMTP settings in Supabase
2. Check Resend dashboard for errors
3. Ensure API key has proper permissions
4. Try using `onboarding@resend.dev` as sender

### Emails going to spam

**Problem**: Domain not verified or no SPF/DKIM

**Solution**:
1. Add and verify your domain in Resend
2. Add DNS records (SPF, DKIM, DMARC)
3. Use a verified domain as sender
4. Avoid spammy content in emails

### Rate limit exceeded

**Problem**: Sent more than 3,000 emails this month

**Solution**:
1. Upgrade Resend plan ($20/month for 50k emails)
2. Or wait until next month (free tier resets)
3. Check usage in Resend dashboard

---

## 💰 Pricing

### Resend Pricing

| Plan | Emails/Month | Price |
|------|--------------|-------|
| **Free** | 3,000 | $0 |
| **Pro** | 50,000 | $20/month |
| **Business** | 100,000 | $80/month |
| **Enterprise** | Custom | Contact sales |

### When to Upgrade

Upgrade when:
- You have more than 100 users signing up per day
- You need more than 3,000 emails/month
- You want priority support
- You need advanced analytics

---

## 🎯 Best Practices

### 1. Use Your Own Domain (Production)
- More professional
- Better deliverability
- Builds trust with users

### 2. Monitor Email Delivery
- Check Resend dashboard regularly
- Watch for bounces and spam reports
- Keep bounce rate under 5%

### 3. Customize Email Templates
- Add your branding
- Make emails look professional
- Include helpful information

### 4. Test Regularly
- Test email sending after any changes
- Check spam folder
- Verify links work correctly

### 5. Keep API Key Secure
- Never commit API key to Git
- Store in environment variables
- Rotate keys periodically

---

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend SMTP Guide](https://resend.com/docs/send-with-smtp)
- [Supabase SMTP Setup](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Best Practices](https://resend.com/docs/knowledge-base/best-practices)

---

## 🎉 You're All Set!

Once configured:
- ✅ **3,000 emails/month** free
- ✅ **Professional email delivery**
- ✅ **Better deliverability** than Supabase default
- ✅ **Email analytics** in Resend dashboard
- ✅ **Production-ready** email system

**Your email verification is now powered by Resend!** 🚀

---

## 📞 Support

**Resend Support**:
- Email: support@resend.com
- Docs: https://resend.com/docs
- Discord: https://resend.com/discord

**Need Help?**
- Check Resend dashboard for delivery status
- Review Supabase Auth logs
- Test with a real email address
