import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const email = `test-rls-${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('1. Creating test user...', email);
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authErr) {
    console.error('Failed to create user:', authErr);
    return;
  }
  const user = authData.user;

  console.log('2. Inserting subscription...');
  await adminClient.from('subscriptions').insert({
    user_id: user.id,
    plan_id: 'pro',
    status: 'active'
  });

  console.log('3. Signing in as user...');
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error: signInErr } = await userClient.auth.signInWithPassword({
    email,
    password
  });

  if (signInErr) {
    console.error('Failed to sign in:', signInErr);
    return;
  }

  console.log('4. Querying subscriptions as user...');
  const { data, error } = await userClient.from('subscriptions').select('*');
  
  if (error) {
    console.error('!!! RLS QUERY ERROR !!!');
    console.error(error);
  } else {
    console.log('SUCCESS! Data:', data);
  }

  // Cleanup
  console.log('5. Cleaning up test user...');
  await adminClient.auth.admin.deleteUser(user.id);
  console.log('Done.');
}

main().catch(console.error);
