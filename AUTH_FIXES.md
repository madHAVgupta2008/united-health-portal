# Authentication Fixes & Password Reset Guide

## Issues Fixed

### 1. Login/Signup Issues ✅
**Problem**: The signup page was passing a `phone` parameter that wasn't accepted by the AuthContext.

**Solution**: 
- Updated `AuthContext.tsx` to accept `phone` as an optional parameter in the signup function
- The phone number is now properly stored in the user's metadata during signup

### 2. Forgot Password Functionality ✅
**Problem**: The "Forgot Password" link was a placeholder (`#`) with no functionality.

**Solution**:
- Created a new `ForgotPassword.tsx` page with email submission form
- Added `resetPassword()` function to `AuthContext.tsx` using Supabase's password reset
- Updated `Login.tsx` to link to `/forgot-password`
- Added route in `App.tsx` for the forgot password page

### 3. Old localStorage Data 🧹
**Problem**: Old localStorage data from the previous implementation may conflict with the new Supabase authentication.

**Solution**: Created two methods to clear old data:

#### Method 1: Use the Clear Data Page (Recommended)
1. Navigate to: `http://localhost:8080/clear-data.html`
2. Click the "Clear Old Data" button
3. Follow the link to the login page

#### Method 2: Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Paste and run this code:
```javascript
localStorage.removeItem('app_user');
localStorage.removeItem('app_users_db');
localStorage.removeItem('app_bills');
localStorage.removeItem('app_documents');
localStorage.removeItem('app_chat');
console.log('✅ Old data cleared!');
```

---

## How to Use Forgot Password

1. Go to the login page: `http://localhost:8080/login`
2. Click "Forgot password?" link
3. Enter your email address
4. Click "Send Reset Instructions"
5. Check your email for the password reset link
6. Click the link in the email to reset your password

**Note**: Make sure your Supabase email settings are configured correctly for password reset emails to be sent.

---

## Testing the Fixes

### Test Signup with Phone Number
1. Go to `/signup`
2. Fill in all fields including phone number
3. Submit the form
4. Verify account is created successfully

### Test Login
1. Go to `/login`
2. Enter valid credentials
3. Verify successful login

### Test Forgot Password
1. Go to `/login`
2. Click "Forgot password?"
3. Enter your email
4. Verify you see the "Check your email" message
5. Check Supabase dashboard for password reset email logs

---

## Important Notes

### Email Configuration in Supabase
For password reset to work, ensure in your Supabase Dashboard:
1. Go to **Authentication** → **Email Templates**
2. Customize the "Reset Password" email template if needed
3. Go to **Authentication** → **URL Configuration**
4. Add `http://localhost:8080/reset-password` to allowed redirect URLs

### Creating a Reset Password Page
Currently, the forgot password flow sends users to `/reset-password`, but this page doesn't exist yet. You can create it later to handle the actual password update form.

For now, Supabase will handle the password reset through their default UI if you haven't created a custom reset password page.

---

## Files Modified

1. **src/contexts/AuthContext.tsx**
   - Added `phone` parameter support in signup
   - Added `resetPassword()` function

2. **src/pages/Login.tsx**
   - Updated forgot password link from `#` to `/forgot-password`

3. **src/App.tsx**
   - Added route for `/forgot-password`

## Files Created

1. **src/pages/ForgotPassword.tsx**
   - New page for password reset email submission

2. **public/clear-data.html**
   - Interactive page to clear old localStorage data

3. **scripts/clear_local_storage.js**
   - Console script for clearing old data

---

## Quick Start

1. **Clear old data**: Visit `http://localhost:8080/clear-data.html`
2. **Create new account**: Go to `/signup`
3. **Login**: Go to `/login`
4. **Test forgot password**: Click "Forgot password?" on login page
