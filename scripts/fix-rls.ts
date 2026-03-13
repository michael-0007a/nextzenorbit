/**
 * One-time script to fix RLS infinite recursion
 * Run with: npx tsx scripts/fix-rls.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fixRLS() {
  console.log('Connecting to Supabase...');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Test connection by querying profiles (should work with service role)
  console.log('Testing connection...');
  const { error } = await supabase.from('profiles').select('id').limit(1);

  if (error) {
    console.error('Connection test failed:', error.message);
    console.log('\nThe RLS policy needs to be fixed directly in Supabase Dashboard.');
    console.log('Go to: SQL Editor and run:');
    console.log('DROP POLICY IF EXISTS "admin_all_users" ON users;');
    return;
  }

  console.log('Connection successful. Profiles accessible.');
  console.log('\nTo fix the RLS issue, run this SQL in Supabase Dashboard > SQL Editor:');
  console.log('');
  console.log('DROP POLICY IF EXISTS "admin_all_users" ON users;');
  console.log('');
}

fixRLS().catch(console.error);

