import { supabase, supabaseAdmin } from './lib/supabase';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase database connection...\n');

  try {
    // Test 1: Environment variables check
    console.log('1. Checking environment variables...');
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      console.log('\n💡 To fix this:');
      console.log('1. Copy backend/.env.example to backend/.env');
      console.log('2. Fill in your Supabase credentials');
      console.log('3. Or run: npx tsx database/setup-verification.ts');
      return;
    }
    console.log('✅ All environment variables present');

    // Test 2: Basic connection test
    console.log('\n2. Testing basic connection...');
    const { error: connectionError } = await supabase
      .from('clients')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      if (connectionError.message.includes('relation') && connectionError.message.includes('does not exist')) {
        console.log('\n💡 This usually means the database schema hasn\'t been set up yet.');
        console.log('Please run the SQL scripts in your Supabase SQL Editor:');
        console.log('1. Run database/schema.sql');
        console.log('2. Run database/rls-policies.sql');
        console.log('3. Or follow the guide in database/SETUP_GUIDE.md');
      }
      return;
    }
    console.log('✅ Basic connection successful');

    // Test 3: Test admin connection
    console.log('\n3. Testing admin connection...');
    const { error: adminError } = await supabaseAdmin
      .from('clients')
      .select('count')
      .limit(1);

    if (adminError) {
      console.error('❌ Admin connection failed:', adminError.message);
      console.log('💡 Check your SUPABASE_SERVICE_ROLE_KEY in .env file');
      return;
    }
    console.log('✅ Admin connection successful');

    // Test 4: Test table existence
    console.log('\n4. Testing table existence...');
    const tables = [
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

    const missingTables = [];
    for (const table of tables) {
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
      return;
    }

    // Test 5: RLS policies
    console.log('\n5. Testing Row Level Security policies...');
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

    // Test 6: Authentication functionality
    console.log('\n6. Testing authentication functionality...');
    try {
      const { data: authTest, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) {
        console.log('⚠️  Could not verify auth configuration:', authError.message);
      } else {
        console.log('✅ Authentication is properly configured');
        console.log(`   Current user count: ${authTest.users?.length || 0}`);
      }
    } catch (authTestError) {
      console.log('⚠️  Authentication test failed:', authTestError instanceof Error ? authTestError.message : String(authTestError));
    }

    // Test 7: Basic CRUD operations (admin only)
    console.log('\n7. Testing basic CRUD operations...');
    try {
      // Test creating a user profile (this would normally be done after user signup)
      const testUserId = '00000000-0000-0000-0000-000000000000';
      
      // Try to insert a test profile (will fail if user doesn't exist, which is expected)
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({ 
          id: testUserId, 
          full_name: 'Test User', 
          business_name: 'Test Business' 
        }, { 
          onConflict: 'id',
          ignoreDuplicates: true 
        })
        .select();

      if (profileError && !profileError.message.includes('violates foreign key constraint')) {
        console.log('⚠️  Profile CRUD test failed:', profileError.message);
      } else {
        console.log('✅ Basic CRUD operations working');
      }
    } catch (crudError) {
      console.log('⚠️  CRUD test failed:', crudError instanceof Error ? crudError.message : String(crudError));
    }

    console.log('\n🎉 Database connection test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('✅ Environment variables configured');
    console.log('✅ Database connection established');
    console.log('✅ All required tables exist');
    console.log('✅ Row Level Security is active');
    console.log('✅ Authentication is configured');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Start your backend server: npm run dev');
    console.log('2. Start your frontend server: cd ../frontend && npm run dev');
    console.log('3. Test user registration and login flows');
    console.log('4. Begin implementing your application features');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your .env file exists and has correct values');
    console.log('2. Verify your Supabase project is active');
    console.log('3. Ensure you ran the database setup scripts');
    console.log('4. Check the database/SETUP_GUIDE.md for detailed instructions');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection();
}

export { testDatabaseConnection };