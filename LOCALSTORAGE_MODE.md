# localStorage Mode - Quick Start Guide

## ✅ localStorage Mode is Now Active!

Your app is now configured to use **localStorage** instead of Supabase. This means:
- ✅ **No Supabase setup required** - works immediately
- ✅ All data stored in your browser
- ✅ Login/Signup works instantly
- ⚠️ Files are not actually stored (file names are saved)
- ⚠️ Data is per-browser (not synced across devices)

---

## 🚀 How to Use

### 1. **Start Fresh**
Visit: `http://localhost:8080/clear-data.html`
- Click "Clear Old Data" to remove any conflicting data

### 2. **Create an Account**
Go to: `http://localhost:8080/signup`
- Fill in your details
- Password is stored locally (not encrypted - dev mode only!)
- Click "Create Account"

### 3. **Login**
Go to: `http://localhost:8080/login`
- Use the email/password you just created
- Should work immediately!

### 4. **Use the App**
- Upload bills (metadata saved, actual files not stored)
- Upload insurance docs (metadata saved)
- Chat with AI assistant (history saved)
- All data persists in localStorage

---

## 🔄 Switching Between Modes

To switch between **localStorage** and **Supabase** mode:

1. Open: `src/config/backend.ts`
2. Change the mode:

```typescript
export const BACKEND_CONFIG = {
  mode: 'localStorage'  // or 'supabase'
};
```

3. Save and refresh your browser

---

## ⚠️ Important Notes

### localStorage Mode Limitations:
- **Files**: File upload UI works, but files aren't actually stored
- **Sync**: Data only exists in your current browser
- **Security**: Passwords are NOT encrypted (development only!)
- **Capacity**: Limited to ~5-10MB total storage

### When to Use Each Mode:

**Use localStorage when:**
- Testing the app quickly
- Don't have Supabase access yet
- Developing locally

**Use Supabase when:**
- Ready for production
- Need file storage
- Want data to persist across devices
- Need proper security

---

## 📝 What's Stored in localStorage

The app stores 4 keys:
- `app_users_db` - All user accounts
- `app_current_user` - Currently logged-in user
- `app_bills` - Hospital bills data
- `app_documents` - Insurance documents
- `app_chat` - Chat history

---

## 🔧 Troubleshooting

### "Login failed" error
- Make sure you created an account first
- Check credentials match what you signed up with
- Try clearing data and creating new account

### Data disappeared
- localStorage is cleared when you:
  - Clear browser cache/cookies
  - Use incognito/private browsing
  - Use a different browser

### Want to see your data
Open Browser Console (F12) and run:
```javascript
console.log('Users:', JSON.parse(localStorage.getItem('app_users_db')));
console.log('Current User:', JSON.parse(localStorage.getItem('app_current_user')));
```

---

## 🎯 Quick Commands

### View All Users
```javascript
JSON.parse(localStorage.getItem('app_users_db'))
```

### View Current User
```javascript
JSON.parse(localStorage.getItem('app_current_user'))
```

### Clear Everything
```javascript
localStorage.clear()
```

---

## ✨ Ready to Switch to Supabase?

When you're ready to use Supabase:

1. Follow `SUPABASE_SETUP.md` to configure Supabase
2. Change `src/config/backend.ts` mode to `'supabase'`
3. Refresh the browser
4. Create a new account (Supabase accounts are separate)

**Note**: localStorage data won't transfer to Supabase automatically.

---

## 🎉 You're Ready!

Your app is now running in **localStorage mode**. Just:
1. Go to `/signup` to create an account
2. Login and use the app!

No Supabase configuration needed!
