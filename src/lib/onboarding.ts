import type { User } from '@supabase/supabase-js';
import { accountAccessFor } from '@/lib/account-access';
import { getRequestAccess } from '@/lib/request-access';
export type ApplicationAccess='draft'|'pending'|'approved'|'rejected';
export async function getApplicationAccess(user:Pick<User,'id'|'email'>):Promise<ApplicationAccess> {return (await accountAccessFor(user)).application;}
export async function requireApprovedAccount(userId:string):Promise<Response|null> {
 if((await getRequestAccess(userId)).application!=='approved')return Response.json({success:false,error:{code:'APPROVAL_REQUIRED',message:'Your application must be approved before payment or account access is available.'}},{status:403});
 return null;
}
