import { requireAdmin, isAuthError } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminDocumentSchema } from "@/lib/admin/documents/schema";
import { z } from "zod";
export async function GET(request:Request) {
 const auth=await requireAdmin();if(isAuthError(auth))return auth;
 const id=new URL(request.url).searchParams.get("id");
 const admin=createAdminClient();
 if(id){if(!z.string().uuid().safeParse(id).success)return Response.json({error:{message:"Invalid document."}},{status:400});const {data,error}=await admin.from("admin_documents").select("id,kind,title,payload,updated_at").eq("owner_id",auth.userId).eq("id",id).maybeSingle();return error||!data?Response.json({error:{message:"Document unavailable."}},{status:404}):Response.json({data},{headers:{"Cache-Control":"private, no-store"}});}
 const {data,error}=await admin.from("admin_documents").select("id,kind,title,updated_at").eq("owner_id",auth.userId).order("updated_at",{ascending:false}).limit(100);
 return error?Response.json({error:{message:"Library unavailable. Apply migration 038 before using saved documents."}},{status:503}):Response.json({data},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request:Request) {
 const auth=await requireAdmin();if(isAuthError(auth))return auth;
 const parsed=adminDocumentSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:{message:"Check the document title and content before saving."}},{status:400});
 const d=parsed.data;
 if(d.kind==='cover_letter'&&!d.payload.letter.trim())return Response.json({error:{message:"Write or generate a cover letter first."}},{status:400});
 const {data,error}=await createAdminClient().rpc("save_admin_document",{p_id:d.id,p_owner_id:auth.userId,p_kind:d.kind,p_title:d.title,p_payload:d.payload,p_client_id:d.clientId||null});
 return error?Response.json({error:{message:"Unable to save. Check the selected client's assignment and retry. No partial save was made."}},{status:409}):Response.json({data});
}
export async function DELETE(request:Request) {
 const auth=await requireAdmin();if(isAuthError(auth))return auth;
 const id=new URL(request.url).searchParams.get('id');if(!z.string().uuid().safeParse(id).success)return Response.json({error:{message:"Invalid document."}},{status:400});
 const {error}=await createAdminClient().from("admin_documents").delete().eq("id",id!).eq("owner_id",auth.userId);
 return error?Response.json({error:{message:"Unable to delete document."}},{status:503}):Response.json({success:true});
}
