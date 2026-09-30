"use client";
import { useCallback,useEffect,useState } from "react";
import Link from "next/link";
import { AlertTriangle,Target,RefreshCw,Users } from "lucide-react";
import type { TargetReport } from "@/lib/admin/targets";

type ResponseData={data:TargetReport;adminId:string;supervisor:boolean};
export function ApplicationTargets({adminId:filterAdminId}:{adminId?:string}) {
 const [result,setResult]=useState<ResponseData|null>(null),[error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const refresh=useCallback(async()=>{
  setLoading(true);
  try{const response=await fetch("/api/admin/targets",{cache:"no-store"});const body=await response.json();if(!response.ok)throw Error(body.error?.message||"Targets unavailable.");setResult(body);setError("");}
  catch(e){setError(e instanceof Error?e.message:"Targets unavailable.");}finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh();const timer=setInterval(()=>{if(document.visibilityState==="visible")void refresh();},60000);const update=()=>{void refresh();};window.addEventListener("application-progress-updated",update);window.addEventListener("focus",update);return()=>{clearInterval(timer);window.removeEventListener("application-progress-updated",update);window.removeEventListener("focus",update);};},[refresh]);
 const clients=(result?.data.clients||[]).filter(c=>!filterAdminId||c.members.some(a=>a.id===filterAdminId));
 const rows=clients.flatMap(client=>client.members.filter(member=>filterAdminId?member.id===filterAdminId:result?.supervisor||member.id===result?.adminId).map(member=>({client,member})));
 const outstanding=clients.reduce((sum,client)=>sum+Math.min(client.remaining,rows.filter(r=>r.client.id===client.id).reduce((n,r)=>n+r.member.todayRemaining,0)),0);
 const behind=rows.filter(r=>r.member.behind).length;
 const unassigned=clients.filter(c=>c.monthly>0&&!c.members.length);
 return <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-6">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-semibold"><Target className="h-5 w-5 text-primary"/>{result?.supervisor?'Team application targets':'Your application targets'}</h2><p className="mt-1 text-xs leading-5 text-text-secondary">Plan-based monthly shares. Weekly pace uses 4 weeks; daily pace uses Monday-Friday. Reporting: calendar month, India time.</p></div><button disabled={loading} onClick={()=>void refresh()} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading?'animate-spin':''}`}/>Refresh</button></div>
  {error&&<p role="alert" className="text-sm text-error">{error} {result?'The figures below may be out of date.':''}</p>}
  {!result&&!error&&<p role="status" className="text-sm text-text-secondary">Loading targets...</p>}
  {result&&<>
   <div className="grid gap-3 sm:grid-cols-3">{[["Remaining today",outstanding],["Below monthly pace",behind],["Clients without a team",unassigned.length]].map(([label,value])=><div key={label} className="rounded-xl border border-border bg-background/40 p-4"><p className="text-xs text-text-secondary">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}</div>
   {(outstanding>0||behind>0||unassigned.length>0)&&<div role="status" className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning"/><p>{result.data.workingDay?`${outstanding} applications remain against today's goals.`:'Weekend: no daily target today.'}{behind>0?` ${behind} admin/client shares are below the expected monthly pace.`:''}{unassigned.length>0?` ${unassigned.length} active clients need a team.`:''}</p></div>}
   {!rows.length&&!unassigned.length&&<p className="text-sm text-text-secondary">No assigned client targets yet.</p>}
   {unassigned.map(c=><p key={c.id} className="text-sm"><Link href="/admin/users" className="text-primary underline">Assign admins to {c.name}</Link> - {c.monthly}/month ({c.planName})</p>)}
   {!!rows.length&&<div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-background/40 text-xs text-text-secondary"><tr>{['Client / admin','Today','This week','This month','Remaining','Status'].map(label=><th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{rows.map(({client,member})=><tr key={`${client.id}:${member.id}`}><td className="px-4 py-3"><Link href={`/admin/users/${client.id}`} className="font-medium hover:text-primary">{client.name}</Link><p className="mt-1 flex items-center gap-1 text-xs text-text-secondary"><Users className="h-3 w-3"/>{member.name} · {client.planName}</p><p className="mt-1 text-xs text-text-secondary">Client total: {client.applied} / {client.monthly} this month</p></td><td className="px-4 py-3">{member.day} / {member.todayGoal}</td><td className="px-4 py-3">{member.week} / {member.weekly}</td><td className="px-4 py-3"><span>{member.month} / {member.monthly}</span><div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${member.monthly?Math.min(100,100*member.month/member.monthly):0}%`}}/></div></td><td className="px-4 py-3">{member.remaining}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${member.behind?'bg-warning/10 text-warning':'bg-primary/10 text-primary'}`}>{!client.active?'Plan inactive':client.remaining===0||member.remaining===0?'Goal met':member.behind?'Below pace':'In progress'}</span></td></tr>)}</tbody></table></div>}
   <details className="text-xs text-text-secondary"><summary className="cursor-pointer">How targets and credit work</summary><p className="mt-2 leading-5">Equal monthly shares add up to the plan allowance. Any indivisible remainder is distributed one application at a time in stable admin order. Daily and weekly figures are rounded planning goals; monthly totals never increase. Today&apos;s goal stops when the monthly target is met. Changing the team or plan recalculates this month&apos;s targets without moving completed application credit.</p><p className="mt-2 leading-5">Older applications without a verified completing admin count toward the client total but are not credited to an individual. Reports include only jobs marked applied. Week totals shown here stay within the current month.</p>{clients.filter(c=>c.uncredited>0).map(c=><p key={c.id} className="mt-2">{c.name}: {c.applied} / {c.monthly} total this month; {c.uncredited} without individual credit.</p>)}</details>
  </>}
 </section>;
}
