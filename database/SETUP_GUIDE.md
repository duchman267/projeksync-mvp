# ProjekSync Database Setup Guide

This comprehensive guide will walk you through setting up your Supabase database for ProjekSync MVP from start to finish.

## Prerequisites

- Node.js 18+ installed
- A web browser
- Basic familiarity with SQL (helpful but not required)

## Step 1: Create Your Supabase Project

### 1.1 Sign Up for Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### 1.2 Create a New Project

1. Once logged in, click "New Project"
2. If you don't have an organization, create one:
   - Click "New organization"
   - Enter a name (e.g., "Your Name" or "Your Company")
   - Choose the free plan
3. Fill in project details:
   - **Name**: `projeksync-mvp` (or your preferred name)
   - **Database Password**: Click "Generate a password" and **SAVE THIS PASSWORD**
   - **Region**: Choose the region closest to you or your users
4. Click "Create new project"
5. Wait 1-2 minutes for the project to initialize

## Step 2: Get Your Supabase Credentials

### 2.1 Find Your Project Settings

1. Once your project is ready, go to **Settings** → **API**
2. You'll see several important values:

### 2.2 Copy These Values (You'll Need Them Later)

- **Project URL**: Starts with `https://` (e.g., `https://abcdefghijklmnop.supabase.co`)
- **anon public key**: A long string starting with `eyJ...`
- **service_role key**: Another long string starting with `eyJ...` (keep this secret!)

⚠️ **Important**: Keep the service_role key secret - never commit it to public repositories!

## Step 3: Set Up the Database Schema

### 3.1 Open the SQL Editor

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"

### 3.2 Run the Schema Script

1. Copy the entire contents of `database/schema.sql` from this project
2. Paste it into the SQL Editor
3. Click "Run" (or press Ctrl/Cmd + Enter)
4. Wait for it to complete - you should see "Success. No rows returned"

### 3.3 Run the RLS Policies Script

1. Click "New query" again
2. Copy the entire contents of `database/rls-policies.sql` from this project
3. Paste it into the SQL Editor
4. Click "Run"
5. Wait for completion

## Step 4: Configure Authentication

### 4.1 Set Up Auth Settings

1. Go to **Authentication** → **Settings**
2. Configure the following:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`
3. Scroll down and click "Save"

### 4.2 Optional: Configure Additional Auth Providers

If you want to enable Google, GitHub, or other social logins:
1. Go to **Authentication** → **Providers**
2. Enable the providers you want
3. Follow the setup instructions for each provider

## Step 5: Set Up Your Environment Variables

### 5.1 Automated Setup (Recommended)

Run our setup verification script:

```bash
# From the project root directory
npx tsx database/setup-verification.ts
```

This script will:
- Test your database connection
- Verify all tables exist
- Check RLS policies
- Generate your environment files automatically

### 5.2 Manual Setup (Alternative)

If you prefer to set up manually:

#### Backend Environment (.env)
Create `backend/.env`:
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

#### Frontend Environment (.env.local)
Create `frontend/.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# App Configuration
NEXT_PUBLIC_APP_NAME=ProjekSync
NEXT_PUBLIC_APP_VERSION=1.0.0

# Environment
NODE_ENV=development
```

## Step 6: Test Your Setup

### 6.1 Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (in another terminal)
cd frontend
npm install
```

### 6.2 Test Database Connection

```bash
# From the backend directory
npx tsx src/test-db-connection.ts
```

You should see:
- ✅ Basic connection successful
- ✅ Admin connection successful
- ✅ All tables exist and accessible
- ✅ RLS policies are working

### 6.3 Test Frontend Connection

```bash
# From the frontend directory
npm run dev
```

Visit `http://localhost:3000` - the app should load without connection errors.

## Step 7: Verify Everything Works

### 7.1 Check Your Supabase Dashboard

1. Go to **Table Editor** in your Supabase dashboard
2. You should see all these tables:
   - user_profiles
   - clients
   - projects
   - milestones
   - timesheets
   - invoices
   - invoice_items
   - contracts
   - expenses
   - project_messages
   - project_files
   - proposals
   - proposal_items
   - documents
   - calendar_events

### 7.2 Test Authentication

1. Try signing up for a new account in your app
2. Check the **Authentication** → **Users** section in Supabase
3. You should see your new user listed

## Troubleshooting

### Common Issues

#### "Missing environment variable" errors
- Make sure your `.env` files are in the correct locations
- Check that all required variables are set
- Restart your development servers after changing environment variables

#### "relation does not exist" errors
- This means the database schema wasn't set up properly
- Re-run the `schema.sql` script in your Supabase SQL Editor
- Make sure you're connected to the correct project

#### "row-level security" errors
- This is actually good - it means RLS is working!
- Make sure you're authenticated when testing
- Check that the RLS policies were applied correctly

#### Connection timeout or network errors
- Check your Supabase project URL
- Verify your API keys are correct
- Make sure your Supabase project is active (not paused)

### Getting Help

1. Check the Supabase documentation: https://supabase.com/docs
2. Review the console logs for specific error messages
3. Check your Supabase project logs in the dashboard
4. Verify all environment variables are set correctly

## Security Best Practices

### Environment Variables
- Never commit `.env` files to version control
- Use different credentials for development and production
- Rotate your service role key periodically

### Database Security
- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- All sensitive operations require authentication

### API Security
- Rate limiting is configured
- CORS is properly set up
- Input validation is implemented

## Next Steps

Once your database is set up and tested:

1. **Start Development**: Begin implementing your application features
2. **Add Sample Data**: Create some test clients and projects
3. **Test Workflows**: Try the complete user journey from signup to project management
4. **Deploy**: When ready, set up production environment with new Supabase project

## Production Deployment

When you're ready to deploy:

1. Create a new Supabase project for production
2. Run the same setup process with production credentials
3. Update your production environment variables
4. Configure your production domain in Supabase Auth settings
5. Set up proper backup and monitoring

---

🎉 **Congratulations!** Your ProjekSync database is now ready for development!