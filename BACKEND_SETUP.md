# Backend Setup Guide

This guide will help you set up the Supabase backend for the United Health Portal.

## Prerequisites

- Supabase account (already configured in `.env`)
- Node.js and npm installed

## Step 1: Apply Database Migrations

You need to apply the SQL migrations to your Supabase database. There are two ways to do this:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://dnxozuhdiwbzdyolnciv.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of each migration file in order:
   - First: `supabase/migrations/001_initial_schema.sql`
   - Second: `supabase/migrations/002_rls_policies.sql`
   - Third: `supabase/migrations/003_storage_buckets.sql`
5. Click **Run** for each migration

### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref dnxozuhdiwbzdyolnciv

# Push migrations
supabase db push
```

## Step 2: Verify Database Setup

After running the migrations, verify in the Supabase Dashboard:

1. **Tables**: Go to **Table Editor** and confirm you see:
   - `profiles`
   - `hospital_bills`
   - `insurance_documents`
   - `chat_messages`

2. **Storage**: Go to **Storage** and confirm you see buckets:
   - `hospital-bills`
   - `insurance-documents`

3. **Policies**: Go to **Authentication** → **Policies** and verify RLS policies are enabled

## Step 3: Generate TypeScript Types (Optional but Recommended)

To get full TypeScript support, generate types from your database schema:

```bash
# Install Supabase CLI if not already done
npm install -g supabase

# Generate types
supabase gen types typescript --project-id dnxozuhdiwbzdyolnciv > src/integrations/supabase/types.ts
```

## Step 4: Run the Application

```bash
npm run dev
```

## Testing the Backend

### 1. Create a New Account
- Navigate to `/signup`
- Create a new account
- Verify the profile is created automatically

### 2. Upload a Bill
- Go to `/bills/upload`
- Fill in bill details
- Upload a PDF or image file
- Check Supabase Dashboard → Table Editor → `hospital_bills`
- Check Supabase Dashboard → Storage → `hospital-bills`

### 3. Upload Insurance Document
- Go to `/insurance/upload`
- Select document type
- Upload a file
- Verify in Supabase Dashboard

### 4. Test AI Chat
- Go to `/chat`
- Send messages
- Verify chat history persists after page refresh
- Check Supabase Dashboard → Table Editor → `chat_messages`

## Troubleshooting

### TypeScript Errors
The TypeScript errors you see are expected until you run the migrations and optionally generate types. The application will still work, but you'll see type warnings in your IDE.

### Authentication Issues
- Make sure email confirmation is disabled in Supabase Dashboard → Authentication → Settings
- Or check your email for confirmation link

### Storage Upload Errors
- Verify storage buckets are created
- Check RLS policies are properly set up
- Ensure file sizes are under 10MB

### Database Connection Errors
- Verify `.env` file has correct Supabase credentials
- Check Supabase project is active and not paused

## Migration Files

The migrations are located in `supabase/migrations/`:

1. **001_initial_schema.sql**: Creates tables and indexes
2. **002_rls_policies.sql**: Sets up Row Level Security policies
3. **003_storage_buckets.sql**: Creates storage buckets for file uploads

## Important Notes

- **Breaking Change**: This replaces localStorage with Supabase. Existing localStorage data will not be migrated.
- **User Data**: Each user can only access their own data (enforced by RLS policies)
- **File Storage**: Files are stored in Supabase Storage with user-specific folders
- **Real-time**: The app supports real-time updates (currently implemented for chat)

## Next Steps

After setup, you can:
- Customize the database schema by creating new migrations
- Add more RLS policies for fine-grained access control
- Implement real-time subscriptions for bills and documents
- Add server-side functions for complex operations
