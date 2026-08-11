const { Client } = require('pg');

const connectionString = "postgresql://postgres.bxdfqqxfhmycjxzaqrzc:BcjZVyCxVOwtrvRt@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

async function fixPolicies() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to remote DB.");

    const sql = `
      -- 1. Drop ALL policies on users table
      DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
      DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
      DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
      DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
      DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
      DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;
      DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
      DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.users;
      DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.users;

      -- 2. Create basic policies for users
      CREATE POLICY "Users can view own row" 
      ON public.users FOR SELECT 
      USING (auth.uid() = id);

      CREATE POLICY "Users can update own row" 
      ON public.users FOR UPDATE 
      USING (auth.uid() = id);

      -- 3. Drop ALL policies on subscriptions
      DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
      DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
      DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
      DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;

      -- 4. Create simple non-recursive policy for subscriptions
      CREATE POLICY "Users can view own subscriptions" 
      ON public.subscriptions FOR SELECT 
      USING (auth.uid() = user_id);

      -- 5. Create service role policy for subscriptions (no recursion)
      CREATE POLICY "Service role can manage subscriptions" 
      ON public.subscriptions FOR ALL 
      TO service_role 
      USING (true) WITH CHECK (true);
    `;

    await client.query(sql);
    console.log("Successfully updated policies on remote DB.");

  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

fixPolicies();
