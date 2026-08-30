import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    if (key && !key.startsWith('#')) {
      process.env[key] = value;
    }
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // 1. Get the admin's ID
  const { data: adminUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'admin@nextzenorbit.com')
    .single();

  if (!adminUser) {
    console.error("admin@nextzenorbit.com not found!");
    return;
  }
  const adminId = adminUser.id;
  console.log("Admin ID:", adminId);

  // 2. Assign some clients
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'user')
    .limit(5);

  if (users && users.length > 0) {
    const userIds = users.map(u => u.id);
    await supabase
      .from('profiles')
      .update({ assigned_admin_id: adminId })
      .in('user_id', userIds);
    console.log(`Assigned ${userIds.length} clients to admin.`);
  }

  // 3. Insert some dummy job queue data
  // We need a user to assign these to, let's use the first one from above if exists, or just a dummy user id
  const dummyUserId = users?.[0]?.id || adminId;

  const jobs = [
    {
      user_id: dummyUserId,
      title: "Frontend Developer",
      company: "Google",
      job_url: "https://google.com/jobs",
      source: "manual",
      status: "applied",
      claimed_by: adminId,
      created_at: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), // Last month
      applied_at: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
    },
    {
      user_id: dummyUserId,
      title: "React Engineer",
      company: "Facebook",
      job_url: "https://facebook.com/jobs",
      source: "manual",
      status: "pending",
      claimed_by: adminId,
      created_at: new Date().toISOString(), // This month
    },
    {
      user_id: dummyUserId,
      title: "Fullstack Dev",
      company: "Amazon",
      job_url: "https://amazon.com/jobs",
      source: "manual",
      status: "failed",
      claimed_by: adminId,
      created_at: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(), // 2 months ago
      applied_at: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
    },
  ];

  for (const job of jobs) {
    const { error } = await supabase.from('job_queue').insert(job);
    if (error) {
      console.error("Error inserting job:", error);
    }
  }

  console.log("Added dummy jobs.");
}

run();
