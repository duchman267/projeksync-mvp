# ProjekSync Database Setup Guide

This directory contains all the database schema and configuration files for ProjekSync MVP.

## Files Overview

- `schema.sql` - Complete database schema with all tables and indexes
- `rls-policies.sql` - Row Level Security policies for data isolation
- `setup.sql` - Combined setup script that runs both schema and RLS
- `README.md` - This setup guide

## Prerequisites

1. A Supabase account and project
2. Access to Supabase SQL Editor
3. Environment variables configured in your applications

## Quick Start

For a complete step-by-step setup guide, see **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**.

For automated setup, run:
```bash
npx tsx database/setup-verification.ts
```

## Manual Setup Instructions

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization (create one if needed)
5. Fill in project details:
   - Name: `projeksync-mvp` (or your preferred name)
   - Database Password: Generate a strong password (save this!)
   - Region: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be ready (usually 1-2 minutes)
8. Once ready, you'll see your project dashboard

### 2. Get Your Supabase Credentials

Once your project is ready:

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 3. Configure Environment Variables

#### Backend (.env)
```bash
# Copy from backend/.env.example and fill in your values
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Frontend (.env.local)
```bash
# Copy from frontend/.env.example and fill in your values
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Database Setup

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `schema.sql`
5. Click "Run" to execute
6. Create another new query
7. Copy and paste the contents of `rls-policies.sql`
8. Click "Run" to execute

Alternatively, you can run the combined setup:
1. Copy and paste the contents of `setup.sql`
2. Click "Run" to execute

### 5. Verify Setup

#### Option 1: Using the Test Script
```bash
cd backend
npm run dev
# In another terminal:
npx tsx src/test-db-connection.ts
```

#### Option 2: Manual Verification in Supabase
1. Go to Table Editor in your Supabase dashboard
2. You should see all the tables listed:
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

### 6. Configure Authentication

1. In your Supabase dashboard, go to Authentication → Settings
2. Configure the following:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`
3. Enable email confirmations if desired
4. Configure any additional auth providers (Google, GitHub, etc.)

## Database Schema Overview

### Core Tables
- **user_profiles**: Extended user information beyond Supabase Auth
- **clients**: Client/customer information
- **projects**: Project management with client relationships
- **milestones**: Project milestone tracking

### Financial Tables
- **invoices** & **invoice_items**: Invoice management with line items
- **contracts**: Contract management and tracking
- **expenses**: Business expense tracking
- **proposals** & **proposal_items**: Quote and proposal system

### Communication & Files
- **project_messages**: Project-based communication
- **project_files**: File sharing and management
- **documents**: Document library and templates

### Time & Calendar
- **timesheets**: Time tracking per project
- **calendar_events**: Integrated calendar system

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Project-related data is accessible only to project owners
- Cascade permissions for related data (milestones, messages, etc.)

### Data Isolation
- Every table with user data includes a `user_id` foreign key
- RLS policies filter all queries by authenticated user
- No cross-user data leakage possible

## Performance Optimizations

### Indexes
The schema includes optimized indexes for:
- User-based queries (most common)
- Date-based filtering (timesheets, expenses)
- Status-based filtering (invoices, contracts)
- Project relationships

### Triggers
Automatic `updated_at` timestamp updates on all relevant tables.

## Troubleshooting

### Common Issues

1. **"relation does not exist" error**
   - Make sure you ran the schema.sql script
   - Check that you're connected to the right database

2. **"permission denied" or RLS errors**
   - Ensure RLS policies are applied (rls-policies.sql)
   - Make sure you're authenticated when testing

3. **Connection errors**
   - Verify your environment variables
   - Check that your Supabase project is active
   - Ensure your API keys are correct

4. **Foreign key constraint errors**
   - Make sure you have authenticated users before inserting test data
   - Check that referenced records exist

### Getting Help

1. Check Supabase documentation: https://supabase.com/docs
2. Review the test script output for specific errors
3. Check Supabase dashboard logs for detailed error messages

## Next Steps

After successful database setup:

1. Test authentication flows in your application
2. Implement API endpoints using the configured Supabase clients
3. Build frontend components that interact with the database
4. Add sample data for development and testing

## Maintenance

### Regular Tasks
- Monitor database performance in Supabase dashboard
- Review and optimize queries as needed
- Backup important data regularly
- Update RLS policies as requirements change

### Schema Updates
When making schema changes:
1. Test changes in a development environment first
2. Create migration scripts for production
3. Update TypeScript types accordingly
4. Test all affected functionality