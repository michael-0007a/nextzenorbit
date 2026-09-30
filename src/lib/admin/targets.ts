import { PLANS } from "@/lib/subscription";

export type TargetSource = {date:string;clients:{id:string;name:string;plan:string|null;active:boolean;team:{id:string;name:string;since:string}[];counts:{adminId:string|null;month:number;week:number;day:number}[]}[]};
export function splitMonthlyTarget(total:number, adminIds:string[]) {
  const ids=[...new Set(adminIds)].sort();
  return ids.map((id,index)=>({id,target:Math.floor(total/ids.length)+(index<total%ids.length?1:0)}));
}
export function buildTargetReport(source:TargetSource) {
  const date=new Date(`${source.date}T00:00:00Z`);
  const workingDay=date.getUTCDay()!==0&&date.getUTCDay()!==6;
  let elapsed=0;
  for(let day=1;day<date.getUTCDate();day++) {
    const weekday=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),day)).getUTCDay();
    if(weekday!==0&&weekday!==6) elapsed++;
  }
  return {date:source.date,timeZone:"Asia/Kolkata",workingDay,clients:source.clients.map(client=>{
    const plan=PLANS[client.plan as keyof typeof PLANS];
    const monthly=client.active&&plan?plan.applications_per_month:0;
    const applied=client.counts.reduce((sum,c)=>sum+Number(c.month),0);
    const remaining=Math.max(0,monthly-applied);
    const shares=splitMonthlyTarget(monthly,client.team.map(a=>a.id));
    return {...client,planName:plan?.name||"No plan",monthly,applied,remaining,
      uncredited:client.counts.filter(c=>!c.adminId).reduce((sum,c)=>sum+Number(c.month),0),
      members:shares.map(share=>{
        const member=client.team.find(a=>a.id===share.id)!;
        const counts=client.counts.find(c=>c.adminId===share.id);
        const month=Number(counts?.month||0),week=Number(counts?.week||0),day=Number(counts?.day||0);
        const left=Math.min(remaining,Math.max(0,share.target-month));
        const weekly=Math.ceil(share.target/4),daily=Math.ceil(weekly/5);
        const todayGoal=workingDay?Math.min(daily,day+left):0;
        const behind=remaining>0&&month<Math.floor(share.target*Math.min(elapsed,20)/20);
        return {...member,monthly:share.target,weekly,daily,month,week,day,remaining:left,todayGoal,todayRemaining:Math.max(0,todayGoal-day),behind};
      })};
  })};
}
export type TargetReport=ReturnType<typeof buildTargetReport>;
