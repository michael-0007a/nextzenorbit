import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = "admin@nextzenorbit.com";
  const password = "SuperSecretPassword123!";
  
  console.log(`Creating Super Admin account for ${email}...`);

  // 1. Create the user in Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
       console.log("User already exists in Auth. Updating role...");
       // Fetch existing user to update role
       const { data: usersData } = await supabase.auth.admin.listUsers();
       const existingUser = usersData.users.find(u => u.email === email);
       if (existingUser) {
           await updateUserRole(existingUser.id);
       }
       return;
    } else {
      console.error("Failed to create user:", authError);
      process.exit(1);
    }
  }

  if (authData.user) {
    console.log("Auth user created. Setting super_admin role...");
    await updateUserRole(authData.user.id);
  }
}

async function updateUserRole(userId: string) {
  // 2. The trigger creates the `users` table row automatically. We just need to update it.
  // Wait a second for the trigger to finish
  await new Promise(r => setTimeout(r, 1000));

  const { error: updateError } = await supabase
    .from('users')
    .update({ role: 'super_admin' })
    .eq('id', userId);

  if (updateError) {
    console.error("Failed to update user role:", updateError);
    process.exit(1);
  }

  // Create a profile just in case the trigger didn't
  await supabase.from('profiles').upsert({
    id: userId,
    full_name: 'Super Admin',
  }, { onConflict: 'id' });

  console.log("✅ Successfully created Super Admin account!");
  console.log("Email:", "admin@nextzenorbit.com");
  console.log("Password:", "SuperSecretPassword123!");
  console.log("You can log in at /admin/login");
}

main().catch(console.error);
