# Email Verification and Password Reset Setup Guide

## Overview
This guide will help you configure Supabase for email verification and password reset functionality in the United Health Portal.

---

## Supabase Configuration

### 1. Enable Email Confirmations

1. Go to your Supabase Dashboard
2. Navigate to: **Authentication** → **Providers** → **Email**
3. Enable the following settings:
   - ✅ **Confirm email**: Toggle ON
   - ✅ **Secure email change**: Toggle ON (recommended)
   - ✅ **Secure password change**: Toggle ON (recommended)

### 2. Configure Site URL

1. Go to: **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:5173` (for development)
   - For production: `https://yourdomain.com`

### 3. Configure Redirect URLs

Add the following redirect URLs:

1. Go to: **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:5173/verify-email
   http://localhost:5173/reset-password
   http://localhost:5173/dashboard
   ```
   
   For production, also add:
   ```
   https://yourdomain.com/verify-email
   https://yourdomain.com/reset-password
   https://yourdomain.com/dashboard
   ```

---

## Email Templates

### 1. Confirm Signup Template

Navigate to: **Authentication** → **Email Templates** → **Confirm signup**

**Subject**: Verify your email for United Health Portal

**Template**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333;
      font-size: 24px;
      margin: 0 0 20px;
    }
    .content p {
      color: #666;
      font-size: 16px;
      margin: 0 0 20px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #9ca3af;
      font-size: 14px;
      margin: 5px 0;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid #667eea;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 United Health Portal</h1>
      <p>Financial Portal</p>
    </div>
    
    <div class="content">
      <h2>Verify Your Email Address</h2>
      <p>Thank you for signing up for United Health Financial Portal! We're excited to have you on board.</p>
      <p>To complete your registration and access your account, please verify your email address by clicking the button below:</p>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Verify Email Address</a>
      </div>
      
      <div class="info-box">
        <p><strong>Security Note:</strong> This link will expire in 24 hours for your security. If you didn't create an account with United Health Portal, you can safely ignore this email.</p>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #9ca3af;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 14px; word-break: break-all; color: #667eea;">{{ .ConfirmationURL }}</p>
    </div>
    
    <div class="footer">
      <p><strong>United Health Financial Portal</strong></p>
      <p>Managing your healthcare finances with confidence</p>
      <p style="margin-top: 20px;">© 2026 United Health Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

### 2. Reset Password Template

Navigate to: **Authentication** → **Email Templates** → **Reset Password**

**Subject**: Reset your password for United Health Portal

**Template**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333;
      font-size: 24px;
      margin: 0 0 20px;
    }
    .content p {
      color: #666;
      font-size: 16px;
      margin: 0 0 20px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #9ca3af;
      font-size: 14px;
      margin: 5px 0;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    .warning-box {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-box p {
      margin: 0;
      color: #991b1b;
      font-size: 14px;
    }
    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid #667eea;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 United Health Portal</h1>
      <p>Financial Portal</p>
    </div>
    
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset the password for your United Health Portal account.</p>
      <p>Click the button below to create a new password:</p>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
      </div>
      
      <div class="warning-box">
        <p><strong>⚠️ Security Alert:</strong> If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
      </div>
      
      <div class="info-box">
        <p><strong>Note:</strong> This link will expire in 1 hour for your security. After that, you'll need to request a new password reset.</p>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #9ca3af;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 14px; word-break: break-all; color: #667eea;">{{ .ConfirmationURL }}</p>
    </div>
    
    <div class="footer">
      <p><strong>United Health Financial Portal</strong></p>
      <p>Managing your healthcare finances with confidence</p>
      <p style="margin-top: 20px;">© 2026 United Health Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

---

## Testing

### Test Email Verification

1. **Sign up** with a new email address
2. **Check your email** (or Inbucket for development)
3. **Click the verification link**
4. **Verify** you're redirected to `/verify-email`
5. **Confirm** the page shows success and redirects to dashboard

### Test Password Reset

1. **Go to** `/forgot-password`
2. **Enter** your email address
3. **Check your email** for the reset link
4. **Click the reset link**
5. **Verify** you're redirected to `/reset-password`
6. **Enter** a new password
7. **Confirm** you're redirected to login

---

## Development Testing with Inbucket

For local development, Supabase provides Inbucket to capture emails:

1. **Access Inbucket**:
   - Go to Supabase Dashboard → Authentication → Email Templates
   - Click "View in Inbucket" or similar link
   - Or check your Supabase project logs

2. **View Emails**:
   - All verification and reset emails appear in Inbucket
   - No need to use real email addresses during development

---

## Production Checklist

Before deploying to production:

- [ ] Update Site URL to production domain
- [ ] Add production redirect URLs
- [ ] Configure custom SMTP (recommended)
- [ ] Test email delivery
- [ ] Verify email templates look correct
- [ ] Test on multiple email clients
- [ ] Set up email monitoring/logging

---

## Troubleshooting

### Emails Not Sending

1. **Check Supabase Logs**:
   - Go to Logs → Auth Logs
   - Look for email-related errors

2. **Verify Settings**:
   - Email confirmations enabled
   - Redirect URLs configured
   - Site URL is correct

3. **Check Spam Folder**:
   - Emails might be marked as spam
   - Add sender to safe list

### Verification Link Not Working

1. **Check URL Hash**:
   - Verification link should contain `#access_token=...`
   - Ensure hash is being parsed correctly

2. **Check Expiration**:
   - Links expire after 24 hours (signup)
   - Links expire after 1 hour (password reset)

3. **Check Redirect URL**:
   - Must match configured redirect URLs exactly
   - Include protocol (http:// or https://)

### Password Reset Issues

1. **Token Validation**:
   - Ensure `type=recovery` in URL hash
   - Check for `access_token` parameter

2. **Session Issues**:
   - Clear browser cache/cookies
   - Try incognito mode

---

## Security Best Practices

1. **Email Verification**:
   - Always verify emails before granting full access
   - Use secure, time-limited tokens
   - Log verification attempts

2. **Password Reset**:
   - Limit reset attempts
   - Use short expiration times (1 hour)
   - Notify users of password changes
   - Don't reveal if email exists

3. **Rate Limiting**:
   - Implement rate limiting on email endpoints
   - Prevent spam/abuse
   - Monitor for suspicious activity

---

## Custom SMTP Configuration (Optional)

For better deliverability in production:

1. **Choose Provider**: SendGrid, AWS SES, Mailgun, etc.
2. **Get Credentials**: API key or SMTP credentials
3. **Configure in Supabase**:
   - Go to Project Settings → Auth → SMTP Settings
   - Enter SMTP details
4. **Test**: Send test emails to verify configuration

---

## Support

If you encounter issues:
- Check [Supabase Documentation](https://supabase.com/docs/guides/auth)
- Visit [Supabase Discord](https://discord.supabase.com/)
- Review application logs for errors
