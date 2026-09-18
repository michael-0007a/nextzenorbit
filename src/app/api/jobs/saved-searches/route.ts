import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adzunaSearchSchema } from "@/lib/jobs/adzuna";
const schema = z.object({ title:z.string().trim().min(1).max(100), filters:adzunaSearchSchema });
export async function GET() {
  const client=await createClient();const {data:{user}}=await client.auth.getUser();
  if(!user)return Response.json({error:{message:"Please sign in."}},{status:401});
  const {data,error}=await client.from("saved_job_searches").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100);
  return error ? Response.json({error:{message:"Unable to load saved searches."}},{status:503}) : Response.json({success:true,data});
}
export async function POST(request:Request) {
  const client=await createClient();const {data:{user}}=await client.auth.getUser();
  if(!user)return Response.json({error:{message:"Please sign in."}},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return Response.json({error:{message:"Name your search and choose valid filters."}},{status:400});
  const {data,error}=await client.from("saved_job_searches").insert({user_id:user.id,title:parsed.data.title,filters:{...parsed.data.filters,page:1}}).select("*").single();
  return error ? Response.json({error:{message:"Unable to save search."}},{status:503}) : Response.json({success:true,data});
}
export async function DELETE(request:Request) {
  const client=await createClient();const {data:{user}}=await client.auth.getUser();
  if(!user)return Response.json({error:{message:"Please sign in."}},{status:401});
  const id=new URL(request.url).searchParams.get("id");
  if(!z.string().uuid().safeParse(id).success)return Response.json({error:{message:"Invalid saved search."}},{status:400});
  const {error}=await client.from("saved_job_searches").delete().eq("id",id!).eq("user_id",user.id);
  return error ? Response.json({error:{message:"Unable to delete saved search."}},{status:503}) : Response.json({success:true});
}
