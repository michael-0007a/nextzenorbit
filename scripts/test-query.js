const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  const { data, error, count } = await supabase
    .from("users")
    .select(`
      id,
      email,
      role,
      created_at,
      profile:profiles!profiles_user_id_fkey(full_name, avatar_url, preferred_role, location, phone, headline, assigned_admin_id),
      subscription:subscriptions!inner(plan_id, status),
      job_queue:job_queue!job_queue_user_id_fkey(status, claimed_by)
    `, { count: "exact" })
    .eq("role", "user")
    .in("subscriptions.status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .range(0, 49);

  if (error) {
    console.error("Error from Supabase:", error);
  } else {
    console.log("Success! Users count:", data.length);
  }
}

testQuery();
