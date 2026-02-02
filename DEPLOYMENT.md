# Deploying United Health Portal

This project is optimized for deployment on Vercel or Netlify. Follow the steps below to host your application.

## Prerequisites
- A GitHub repository containing the project code.
- A Supabase project (already set up in your `.env`).
- A Google Gemini API key.

---

## Option 1: Deploying with Vercel (Recommended)

1. **Push your code to GitHub**:
   Ensure all your changes are committed and pushed to your GitHub repository.

2. **Sign in to Vercel**:
   Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.

3. **Import the Project**:
   - Click **"Add New"** > **"Project"**.
   - Select the `united-health-portal` repository.

4. **Configure Build Settings**:
   - Vercel should automatically detect the Vite setup.
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Set Environment Variables**:
   In the **"Environment Variables"** section, add the following keys from your `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_GEMINI_API_KEY`

6. **Deploy**:
   Click **"Deploy"**. Vercel will build and host your application.

---

## Option 2: Deploying with Netlify

1. **Push your code to GitHub**:
   Ensure all changes are pushed.

2. **Sign in to Netlify**:
   Go to [netlify.com](https://app.netlify.com) and log in with GitHub.

3. **Add new site**:
   - Click **"Add new site"** > **"Import an existing project"**.
   - Connect to GitHub and select the `united-health-portal` repository.

4. **Configure Build Settings**:
   Netlify will use the `netlify.toml` file automatically.
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

5. **Set Environment Variables**:
   Go to **"Site Configuration"** > **"Environment variables"** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_GEMINI_API_KEY`

6. **Deploy**:
   Netlify will automatically trigger a deploy.

---

## Post-Deployment Steps

### 1. Supabase Redirect URLs
If you are using Supabase Authentication, you need to add your new production URL to the "Redirect URLs" in the Supabase Dashboard:
- Go to **Authentication** > **URL Configuration**.
- Add your production URL (e.g., `https://your-app.vercel.app`) to the **Redirect URLs** list.

### 2. Verify SPA Routing
Try refreshing the page while on a sub-route like `/dashboard`. If you see the dashboard instead of a 404, routing is correctly configured.

### 3. Build Test
You can run a local build test before pushing to ensure everything is correct:
```bash
npm run build
```
The output will be in the `dist` folder.
