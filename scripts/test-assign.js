const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAssign() {
  const admin_id = 'admin-id-here'; // We'll query an admin first
  const user_id = 'user-id-here'; // We'll query a user first

  // Get first admin
  const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin').limit(1);
  if (!admins || admins.length === 0) { console.log('No admins found'); return; }
  const adminId = admins[0].id;

  // Get first user
  const { data: users } = await supabase.from('users').select('id').eq('role', 'user').limit(1);
  if (!users || users.length === 0) { console.log('No users found'); return; }
  const userId = users[0].id;

  console.log('Assigning admin', adminId, 'to user', userId);

  const { error } = await supabase
    .from('profiles')
    .update({ assigned_admin_id: adminId })
    .eq('user_id', userId)
    .select();

  console.log('Update result:', error ? error : 'Success!');
  
  // Verify
  const { data: verify } = await supabase.from('profiles').select('user_id, assigned_admin_id').eq('user_id', userId);
  console.log('Verified profile:', verify);
}

testAssign();
