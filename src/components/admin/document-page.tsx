import { redirect } from 'next/navigation';
import { requireAdmin,isAuthError } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminDocumentWorkspace } from '@/components/admin/document-workspace';
export async function AdminDocumentPage({kind}:{kind:'resume'|'cover_letter'}) {
 const auth=await requireAdmin();if(isAuthError(auth))redirect('/admin/login');
 let query=createAdminClient().from('users').select('id,email,profile:profiles!profiles_user_id_fkey!inner(full_name,assigned_admin_id)').in('role',['user','sso_user']).eq('is_suspended',false).order('email');
 if(auth.role==='admin')query=query.eq('profile.assigned_admin_id',auth.userId);
 const {data,error}=await query;
 const clients=(data||[]).map(user=>{const profile=Array.isArray(user.profile)?user.profile[0]:user.profile;return {id:user.id,label:`${profile?.full_name||user.email} (${user.email})`};});
 return <>{error&&<p role="alert">Client assignment is temporarily unavailable. You can still work on a private draft.</p>}<AdminDocumentWorkspace kind={kind} clients={clients}/></>;
}
