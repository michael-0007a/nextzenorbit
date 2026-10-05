// Short-lived display data only. Every server endpoint still verifies current access.
const entries=new Map<string,{value:unknown;expires:number}>();
let account:string|null=null;
let generation=0;
export function clearClientQueries(){entries.clear();generation++;}
export function setClientQueryAccount(userId:string|null){if(account!==userId){clearClientQueries();account=userId;}}
export function invalidateClientQueries(prefix=''){for(const key of entries.keys())if(key.startsWith(prefix))entries.delete(key);generation++;}
export async function clientQuery<T>(url:string,signal?:AbortSignal,fresh=false):Promise<T> {
 const entry=entries.get(url);if(!fresh&&entry&&entry.expires>Date.now())return entry.value as T;
 const version=generation;
 const response=await fetch(url,{signal,cache:'no-store'}),value=await response.json();
 if(signal?.aborted||version!==generation)throw new DOMException('Query was superseded.','AbortError');
 if(response.ok&&!signal?.aborted&&version===generation&&account){
  if(entries.size>=20)entries.delete(entries.keys().next().value!);
  entries.set(url,{value,expires:Date.now()+15000});
 }
 return value as T;
}
