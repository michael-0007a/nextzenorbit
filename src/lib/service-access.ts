import { getRequestAccess } from '@/lib/request-access';
export async function hasServiceAccess(userId:string):Promise<boolean> {return (await getRequestAccess(userId)).service;}
