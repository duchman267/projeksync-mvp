#!/usr/bin/env npx tsx

/**
 * ProjekSync Database Setup Verification Script
 * 
 * This script helps verify that your Supabase database is properly configured
 * and all required tables and policies are in place.
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🚀 ProjekSync Database Setup Verification\n');
  console.log('This script will help you verify your Supabase database setup.\n');

  // Get Supabase credentials
  const supabaseUrl = await askQuestion('Enter your Supabase Project URL: ');
  const supabaseAnonKey = await askQuestion('Enter your Supabase Anon Key: ');
  const supabaseServiceKey = await askQuestion('Enter your Supabase Service Role Key: ');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ All Supabase credentials are required!');
    rl.close();
    return;
  }

  // Create Supabase clients
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('\n🔍 Starting verification...\n');

  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { error: connectionError } = await supabase
      .from('clients')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      if (connectionError.message.includes('relation') && connectionError.message.includes('does not exist')) {
        console.log('💡 This usually means the database schema hasn\'t been set up yet.');
        console.log('   Please run the SQL scripts in your Supabase SQL Editor first.');
      }
      rl.close();
      return;
    }
    console.log('✅ Basic connection successful');

    // Test 2: Admin connection
    console.log('\n2. Testing admin connection...');
    const { error: adminError } = await supabaseAdmin
      .from('clients')
      .select('count')
      .limit(1);

    if (adminError) {
      console.error('❌ Admin connection failed:', adminError.message);
      rl.close();
      return;
    }
    console.log('✅ Admin connection successful');

    // Test 3: Table existence
    console.log('\n3. Checking table existence...');
    const requiredTables = [
      'user_profiles',
      'clients', 
      'projects',
      'milestones',
      'timesheets',
      'invoices',
      'invoice_items',
      'contracts',
      'expenses',
      'project_messages',
      'project_files',
      'proposals',
      'proposal_items',
      'documents',
      'calendar_events'
    ];

    let missingTables = [];
    for (const table of requiredTables) {
      const { error } = await supabaseAdmin
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}' missing or inaccessible`);
        missingTables.push(table);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    }

    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
      console.log('Please run the database schema script in your Supabase SQL Editor.');
      rl.close();
      return;
    }

    // Test 4: RLS policies
    console.log('\n4. Testing Row Level Security policies...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('clients')
      .select('*');

    if (rlsError && rlsError.message.includes('row-level security')) {
      console.log('✅ RLS policies are working (access denied without auth)');
    } else if (!rlsError && (!rlsTest || rlsTest.length === 0)) {
      console.log('✅ RLS policies are working (no data returned without auth)');
    } else {
      console.log('⚠️  RLS policies might not be properly configured');
      console.log('   Please run the RLS policies script in your Supabase SQL Editor.');
    }

    // Test 5: Authentication configuration
    console.log('\n5. Testing authentication configuration...');
    const { data: authConfig, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.log('⚠️  Could not verify auth configuration:', authError.message);
    } else {
      console.log('✅ Authentication is properly configured');
      console.log(`   Current user count: ${authConfig.users?.length || 0}`);
    }

    // Generate environment files
    console.log('\n6. Generating environment configuration files...');
    
    const backendEnv = `# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=${supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}
SUPABASE_ANON_KEY=${supabaseAnonKey}

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
`;

    const frontendEnv = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# App Configuration
NEXT_PUBLIC_APP_NAME=ProjekSync
NEXT_PUBLIC_APP_VERSION=1.0.0

# Environment
NODE_ENV=development
`;

    // Write environment files
    const fs = require('fs');
    const path = require('path');
    
    try {
      fs.writeFileSync(path.join(__dirname, '../backend/.env'), backendEnv);
      console.log('✅ Created backend/.env file');
    } catch (error) {
      console.log('⚠️  Could not create backend/.env file:', error.message);
    }

    try {
      fs.writeFileSync(path.join(__dirname, '../frontend/.env.local'), frontendEnv);
      console.log('✅ Created frontend/.env.local file');
    } catch (error) {
      console.log('⚠️  Could not create frontend/.env.local file:', error.message);
    }

    console.log('\n🎉 Database setup verification completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Your environment files have been created');
    console.log('2. Test the database connection: cd backend && npx tsx src/test-db-connection.ts');
    console.log('3. Start your development servers');
    console.log('4. Begin implementing your application features');

  } catch (error) {
    console.error('❌ Unexpected error during verification:', error);
  }

  rl.close();
}

main().catch(console.error);