/**
 * Applications View — Client Component
 *
 * Toggle between Kanban board and table views.
 */

"use client";

import { useState,useEffect,useRef } from "react";
import dynamic from 'next/dynamic';
import { Pagination } from '@/components/ui/pagination';
import type { PaginationMeta } from '@/types/api';
import { toast } from 'sonner';
import { LayoutGrid, List } from "lucide-react";
import { ApplicationsKanban } from "./applications-kanban";
const ApplicationsTable=dynamic(()=>import('./applications-table').then(m=>m.ApplicationsTable),{loading:()=> <p role="status">Loading table…</p>});
import { cn } from "@/lib/utils";
import type { ApplicationRow } from "@/types/database";

interface ApplicationsViewProps {
  initialApplications: ApplicationRow[];
  initialPagination:PaginationMeta;
}

export function ApplicationsView({ initialApplications,initialPagination }: ApplicationsViewProps) {
  const [view, setView] = useState<"kanban" | "table">("kanban");

  const [applications,setApplications]=useState(initialApplications),[meta,setMeta]=useState(initialPagination);
  const [page,setPage]=useState(1),[search,setSearch]=useState(''),[status,setStatus]=useState(''),[version,setVersion]=useState(0),[loading,setLoading]=useState(false);
  const first=useRef(true);
  useEffect(()=>{
    if(first.current){first.current=false;return;}
    const controller=new AbortController();
    const timer=setTimeout(async()=>{setLoading(true);try{const res=await fetch('/api/applications?'+new URLSearchParams({include_queue:'1',page:String(page),search,status}),{signal:controller.signal});const body=await res.json();if(!res.ok)throw Error(body.error?.message||'Unable to load applications');if(!controller.signal.aborted){setApplications(body.data.applications);setMeta(body.data.pagination);}}catch(e){if(!controller.signal.aborted)toast.error(e instanceof Error?e.message:'Unable to load applications');}finally{if(!controller.signal.aborted)setLoading(false);}},search?250:0);
    return()=>{clearTimeout(timer);controller.abort();};
  },[page,search,status,version]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3"><input aria-label="Search all applications" placeholder="Search company or role" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);setVersion(v=>v+1);}} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"/><select aria-label="Filter application status" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);setVersion(v=>v+1);}} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">All statuses</option>{['applied','screening','interview','offer','rejected'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
      {/* View Toggle */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-text-secondary mr-2">View:</span>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
              view === "kanban"
                ? "bg-primary text-white"
                : "bg-background text-text-secondary hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </button>
          <button
            onClick={() => setView("table")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
              view === "table"
                ? "bg-primary text-white"
                : "bg-background text-text-secondary hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
            Table
          </button>
        </div>
      </div>

      {loading&&<p role="status">Loading applications…</p>}
      {/* View Content */}
      {view === "kanban" ? (
        <ApplicationsKanban key={applications.map(a=>a.id+a.updated_at).join()} initialApplications={applications} onChange={()=>setVersion(v=>v+1)} />
      ) : (
        <ApplicationsTable applications={applications} clientFiltering={false} />
      )}
      <Pagination meta={meta} onPage={setPage} loading={loading}/>
    </div>
  );
}

