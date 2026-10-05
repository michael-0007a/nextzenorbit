// Uses configured credentials only; never prints credentials, host, or personal rows.
const {Client}=require('pg'),fs=require('node:fs');
const project=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const client=new Client({connectionString:process.env.DATABASE_URL,host:process.env.DATABASE_URL?undefined:process.env.SUPABASE_DB_HOST||`db.${project}.supabase.co`,port:5432,user:'postgres',password:process.env.SUPABASE_DB_PASSWORD,database:'postgres',ssl:{rejectUnauthorized:false},connectionTimeoutMillis:10000,query_timeout:15000});
(async()=>{try{
 await client.connect();await client.query('BEGIN READ ONLY');
 const indexes=(await client.query("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN ('users','profiles','subscriptions','job_queue','resumes','applications','client_admin_assignments') ORDER BY tablename,indexname")).rows;
 const counts=(await client.query("SELECT relname, n_live_tup::int AS estimated_rows FROM pg_stat_user_tables WHERE schemaname='public' ORDER BY n_live_tup DESC LIMIT 12")).rows;
 const plans=(await client.query("EXPLAIN (FORMAT JSON) SELECT id,status FROM job_queue WHERE user_id='00000000-0000-0000-0000-000000000000' ORDER BY created_at DESC,id LIMIT 20")).rows;
 await client.query('ROLLBACK');
 const report={measuredAt:new Date().toISOString(),indexes,counts,plans};
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}catch(error){console.error('Read-only database inspection unavailable:',error.code||error.name);process.exitCode=1;}finally{await client.end();}})();
