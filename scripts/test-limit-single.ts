import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Pick any user
  const { data: users } = await adminClient.from('users').select('id').limit(1);
  if (!users || users.length === 0) return;
  const userId = users[0].id;
  
  const { data, error } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  console.log("Error:", error);
  console.log("Data is array?", Array.isArray(data));
  console.log("Data:", data);
}

main().catch(console.error);
