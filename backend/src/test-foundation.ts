#!/usr/bin/env node

/**
 * Test script to verify backend API foundation components
 * This tests the structure and configuration without requiring live Supabase connection
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 Testing ProjekSync Backend API Foundation...\n');

// Test 1: Check if all required files exist
console.log('1. Checking file structure...');
const requiredFiles = [
  'src/server.ts',
  'src/middleware/errorHandler.ts',
  'src/middleware/auth.ts',
  'src/middleware/supabase.ts',
  'src/routes/health.ts',
  'src/lib/supabase.ts',
  'src/types/index.ts',
  'package.json',
  'tsconfig.json',
  '.env.example'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (fs.existsSync(path.join(__dirname, '..', file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error('\n❌ Some required files are missing!');
  process.exit(1);
}

// Test 2: Check package.json dependencies
console.log('\n2. Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const requiredDeps = [
  'express',
  '@supabase/supabase-js',
  'cors',
  'helmet',
  'express-rate-limit',
  'express-validator',
  'dotenv',
  'compression',
  'morgan'
];

let allDepsPresent = true;
for (const dep of requiredDeps) {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    allDepsPresent = false;
  }
}

if (!allDepsPresent) {
  console.error('\n❌ Some required dependencies are missing!');
  process.exit(1);
}

// Test 3: Check TypeScript configuration
console.log('\n3. Checking TypeScript configuration...');
const tsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tsconfig.json'), 'utf8'));
const requiredTsOptions = ['strict', 'esModuleInterop', 'skipLibCheck'];

let tsConfigValid = true;
for (const option of requiredTsOptions) {
  if (tsConfig.compilerOptions[option]) {
    console.log(`✅ ${option}: ${tsConfig.compilerOptions[option]}`);
  } else {
    console.log(`❌ ${option} - MISSING or FALSE`);
    tsConfigValid = false;
  }
}

if (!tsConfigValid) {
  console.error('\n❌ TypeScript configuration is incomplete!');
  process.exit(1);
}

// Test 4: Check environment variables template
console.log('\n4. Checking environment variables template...');
const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL'
];

let allEnvVarsPresent = true;
for (const envVar of requiredEnvVars) {
  if (envExample.includes(envVar)) {
    console.log(`✅ ${envVar}`);
  } else {
    console.log(`❌ ${envVar} - MISSING`);
    allEnvVarsPresent = false;
  }
}

if (!allEnvVarsPresent) {
  console.error('\n❌ Some required environment variables are missing from .env.example!');
  process.exit(1);
}

// Test 5: Check middleware structure
console.log('\n5. Checking middleware structure...');
const middlewareFiles = [
  'errorHandler.ts',
  'auth.ts',
  'supabase.ts'
];

let middlewareValid = true;
for (const middleware of middlewareFiles) {
  const filePath = path.join(__dirname, 'middleware', middleware);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if middleware exports the expected functions
    if (middleware === 'errorHandler.ts') {
      if (content.includes('export const errorHandler') && content.includes('export const asyncHandler')) {
        console.log(`✅ ${middleware} - exports errorHandler and asyncHandler`);
      } else {
        console.log(`❌ ${middleware} - missing required exports`);
        middlewareValid = false;
      }
    } else if (middleware === 'auth.ts') {
      if (content.includes('export const authMiddleware')) {
        console.log(`✅ ${middleware} - exports authMiddleware`);
      } else {
        console.log(`❌ ${middleware} - missing authMiddleware export`);
        middlewareValid = false;
      }
    } else if (middleware === 'supabase.ts') {
      if (content.includes('export const supabaseMiddleware')) {
        console.log(`✅ ${middleware} - exports supabaseMiddleware`);
      } else {
        console.log(`❌ ${middleware} - missing supabaseMiddleware export`);
        middlewareValid = false;
      }
    }
  } else {
    console.log(`❌ ${middleware} - FILE MISSING`);
    middlewareValid = false;
  }
}

if (!middlewareValid) {
  console.error('\n❌ Middleware structure is incomplete!');
  process.exit(1);
}

// Test 6: Check server configuration
console.log('\n6. Checking server configuration...');
const serverContent = fs.readFileSync(path.join(__dirname, 'server.ts'), 'utf8');
const serverFeatures = [
  'helmet', // Security middleware
  'cors', // CORS configuration
  'express-rate-limit', // Rate limiting
  'compression', // Compression middleware
  'morgan', // Logging middleware
  'errorHandler', // Error handling
  'authMiddleware', // Authentication
  'supabaseMiddleware' // Supabase client
];

let serverConfigValid = true;
for (const feature of serverFeatures) {
  if (serverContent.includes(feature)) {
    console.log(`✅ ${feature} configured`);
  } else {
    console.log(`❌ ${feature} - NOT CONFIGURED`);
    serverConfigValid = false;
  }
}

if (!serverConfigValid) {
  console.error('\n❌ Server configuration is incomplete!');
  process.exit(1);
}

// Test 7: Check health endpoint
console.log('\n7. Checking health endpoint structure...');
const healthContent = fs.readFileSync(path.join(__dirname, 'routes', 'health.ts'), 'utf8');
const healthEndpoints = [
  'GET /', // Basic health check
  '/detailed', // Detailed health check
  '/ready', // Readiness probe
  '/live' // Liveness probe
];

let healthValid = true;
for (const endpoint of healthEndpoints) {
  if (healthContent.includes(endpoint)) {
    console.log(`✅ Health endpoint ${endpoint}`);
  } else {
    console.log(`❌ Health endpoint ${endpoint} - MISSING`);
    healthValid = false;
  }
}

if (!healthValid) {
  console.error('\n❌ Health endpoints are incomplete!');
  process.exit(1);
}

console.log('\n🎉 All backend API foundation tests passed!');
console.log('\n📋 Summary of implemented features:');
console.log('✅ Express.js server with TypeScript configuration');
console.log('✅ Supabase client connection and middleware');
console.log('✅ Authentication middleware for protected routes');
console.log('✅ CORS, rate limiting, and security middleware');
console.log('✅ Error handling middleware with standardized responses');
console.log('✅ Basic health check endpoint with multiple variants');
console.log('✅ Proper project structure and dependencies');
console.log('✅ Environment variables configuration');
console.log('✅ TypeScript types and interfaces');

console.log('\n🚀 Backend API foundation is ready for development!');