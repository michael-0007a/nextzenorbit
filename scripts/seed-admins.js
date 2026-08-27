const { createClient } = require('@supabase/supabase-js');


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const usersToCreate = [
  {
    email: 'superadmin@nextzenorbit.com',
    password: 'password123',
    full_name: 'Super Admin',
    role: 'super_admin'
  },
  {
    email: 'supervisor@nextzenorbit.com',
    password: 'password123',
    full_name: 'Supervisor Admin',
    role: 'supervisor_admin'
  },
  {
    email: 'admin@nextzenorbit.com',
    password: 'password123',
    full_name: 'Normal Admin',
    role: 'admin'
  }
];

async function createAdminUsers() {
  for (const u of usersToCreate) {
    console.log(`Creating user: ${u.email}...`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { provider: "email" }
    });

    if (authError) {
      console.error(`Error creating auth user ${u.email}:`, authError.message);
      // Wait a bit and try to update if it already exists?
      continue;
    }

    const userId = authData.user.id;
    console.log(`Auth user created. ID: ${userId}`);

    // Wait a brief moment for the trigger to insert into users and profiles tables
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(`Updating role to ${u.role}...`);
    const { error: userError } = await supabase.from('users').update({ role: u.role }).eq('id', userId);
    if (userError) {
      console.error(`Error updating role for ${u.email}:`, userError.message);
    }

    console.log(`Updating profile full_name to ${u.full_name}...`);
    const { error: profileError } = await supabase.from('profiles').update({ full_name: u.full_name }).eq('id', userId);
    if (profileError) {
      console.error(`Error updating profile for ${u.email}:`, profileError.message);
    }

    console.log(`Successfully created and configured ${u.email}\n`);
  }
}

createAdminUsers().then(() => console.log('Done!'));
