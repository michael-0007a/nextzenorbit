const { createClient } = require("@supabase/supabase-js");
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeData() {
  console.log("Starting data wipe process...");
  
  try {
    // Fetch all non-admin users
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id")
      .not("role", "in", "('admin','supervisor_admin','super_admin')");

    if (userError) throw userError;

    if (!users || users.length === 0) {
      console.log("No non-admin users found. Database is already clean.");
      return;
    }

    const userIds = users.map(u => u.id);
    console.log(`Found ${userIds.length} non-admin users to wipe.`);

    // Tables that reference user_id directly
    const tables = [
      "applications",
      "job_queue",
      "cover_letters",
      "resume_versions",
      "resumes",
      "ai_notes",
      "ai_usage",
      "projects",
      "autofill_telemetry",
      "notifications",
      "subscriptions",
      "profiles",
      "users"
    ];

    for (const table of tables) {
      console.log(`Wiping ${table}...`);
      
      // Batch delete by user_id
      // Split into chunks of 100 to avoid request URL length limits if we were using a GET, 
      // but with POST/in it should be fine up to a reasonable number. We'll chunk to 500.
      for (let i = 0; i < userIds.length; i += 500) {
        const chunk = userIds.slice(i, i + 500);
        // "users" table deletion must use auth API for complete removal, but we can delete from public.users
        
        const { error } = await supabase
          .from(table)
          .delete()
          .in(table === 'users' ? 'id' : 'user_id', chunk);

        if (error) {
          console.error(`Error wiping ${table} for chunk:`, error.message);
        }
      }
    }

    // Delete users from Auth
    const { createClient: createAuthAdmin } = require('@supabase/supabase-js');
    const authAdmin = createAuthAdmin(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log("Wiping auth users...");
    for (const id of userIds) {
      const { error } = await authAdmin.auth.admin.deleteUser(id);
      if (error && !error.message.includes("not found")) {
        console.error(`Error deleting auth user ${id}:`, error.message);
      }
    }

    console.log("Data wipe completed successfully.");
  } catch (error) {
    console.error("Critical error during wipe:", error);
  }
}

wipeData();
