#!/usr/bin/env node

/**
 * RealCIS Backend Setup Script
 * Initializes the backend development environment
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const setupBackend = async () => {
  console.log('🏥 Setting up RealCIS Backend...\n');

  try {
    // Check if we're in the correct directory
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    try {
      await fs.access(packageJsonPath);
    } catch {
      console.error('❌ Please run this script from the server directory');
      process.exit(1);
    }

    // Check for .env file
    const envPath = path.join(process.cwd(), '.env');
    
    try {
      await fs.access(envPath);
      console.log('✅ Environment file found');
    } catch {
      console.log('📄 Creating .env file from template...');
      await fs.copyFile('.env.example', '.env');
      console.log('⚠️  Please update .env with your Supabase credentials');
    }

    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // Test database connection
    console.log('🔗 Testing database connection...');
    try {
      // We'll add this test later when Supabase is configured
      console.log('⚠️  Database connection test skipped - configure Supabase first');
    } catch (error) {
      console.log('⚠️  Database connection failed - please check your Supabase configuration');
    }

    console.log('\n🎉 Backend setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Update .env with your Supabase credentials');
    console.log('2. Create the database tables in Supabase');
    console.log('3. Run "npm run dev" to start the development server');
    console.log('4. Visit http://localhost:5000/health to verify the API is running');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

// Run setup if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  setupBackend();
}

export default setupBackend;
