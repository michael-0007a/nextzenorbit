const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  const { data, error } = await supabase
    .from("users")
    .select(`
      id, email, role, created_at,
      profile:profiles(full_name),
      subscription:subscriptions(plan_id, status)
    `)
    .limit(1);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success! Data:", data);
  }
}

testQuery();
