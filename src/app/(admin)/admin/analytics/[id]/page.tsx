"use client";

import { useState, useEffect, use } from "react";
import { ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type MonthlyData = {
  month: string;
  applied: number;
  failed: number;
  pending: number;
};

type ClientData = {
  id: string;
  name: string;
  email: string;
  applied: number;
  failed: number;
  pending: number;
};

type JobData = {
  id: string;
  title: string;
  company: string;
  status: string;
  applied_at: string | null;
  created_at: string;
  user_id: string;
  job_url: string;
};

type AdminAnalytics = {
  admin: {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
  };
  currentClients: number;
  monthlyData: MonthlyData[];
  clientsData: ClientData[];
  allJobs: JobData[];
};

export default function AdminDetailedAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const adminId = resolvedParams.id;
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/admin/analytics?id=${adminId}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          toast.error("Failed to load admin analytics");
        }
      } catch (err) {
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [adminId]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
      </div>
    );
  }

  const filteredJobs = data.allJobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to analytics
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Admin Details
          </h1>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Admin Profile */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl p-6 sticky top-6">
            <div className="flex items-start gap-4 mb-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary font-bold text-2xl shrink-0">
                {data.admin.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground truncate">{data.admin.name}</h2>
                <p className="text-sm text-text-secondary truncate">{data.admin.email}</p>
                {data.admin.role === 'super_admin' && <span className="mt-2 text-[10px] uppercase font-bold tracking-wider text-error block">Super Admin</span>}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <span className="text-sm text-text-secondary">Role</span>
                <span className="text-sm font-medium text-foreground">{formatRole(data.admin.role)}</span>
              </div>
              
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <span className="text-sm text-text-secondary">Joined</span>
                <span className="text-sm font-medium text-foreground">
                  {new Date(data.admin.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <span className="text-sm text-text-secondary">Current Clients</span>
                <span className="text-sm font-medium text-foreground">{data.currentClients}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics Data */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Monthly Breakdown */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-secondary" />
              <h2 className="text-lg font-bold text-foreground">Monthly Breakdown</h2>
            </div>
            
            <div className="rounded-xl border border-border/60 overflow-hidden bg-surface/30">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/5 text-text-secondary border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3 font-medium">Month</th>
                    <th className="px-4 py-3 font-medium">Jobs Applied</th>
                    <th className="px-4 py-3 font-medium">Jobs Pending/Processing</th>
                    <th className="px-4 py-3 font-medium">Jobs Failed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                        No activity recorded yet.
                      </td>
                    </tr>
                  ) : (
                    data.monthlyData.map((stat) => (
                      <tr key={stat.month} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {stat.month}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-success/10 text-success font-medium text-xs">
                            {stat.applied} applied
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-accent/10 text-accent font-medium text-xs">
                            {stat.pending} pending
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-error/10 text-error font-medium text-xs">
                            {stat.failed} failed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Client Performance */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-lg font-bold text-foreground">Client Performance</h2>
            </div>
            
            <div className="rounded-xl border border-border/60 overflow-x-auto bg-surface/30">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/5 text-text-secondary border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Jobs Applied</th>
                    <th className="px-4 py-3 font-medium">Jobs Pending</th>
                    <th className="px-4 py-3 font-medium">Jobs Failed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.clientsData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                        No clients assigned yet.
                      </td>
                    </tr>
                  ) : (
                    data.clientsData.map((client) => (
                      <tr key={client.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{client.name}</p>
                            {client.name !== client.email && (
                              <p className="text-xs text-text-secondary">{client.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-success/10 text-success font-medium text-xs">
                            {client.applied} applied
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-accent/10 text-accent font-medium text-xs">
                            {client.pending} pending
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-error/10 text-error font-medium text-xs">
                            {client.failed} failed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Job Activity */}
          <div className="glass-card rounded-2xl p-6 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-foreground">All Job Activity</h2>
              <input 
                type="text" 
                placeholder="Search company or title..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border/60 text-sm text-foreground focus:outline-none focus:border-secondary transition-colors w-full sm:w-auto"
              />
            </div>
            
            <div className="rounded-xl border border-border/60 overflow-x-auto bg-surface/30">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                <thead className="bg-white/5 text-text-secondary border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                        No jobs found.
                      </td>
                    </tr>
                  ) : (
                    paginatedJobs.map((job) => {
                      const client = data.clientsData.find(c => c.id === job.user_id);
                      const clientName = client ? client.name : "Unknown Client";
                      const dateStr = job.applied_at || job.created_at;
                      
                      return (
                        <tr key={job.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-text-secondary">
                            {dateStr ? new Date(dateStr).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {clientName}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {job.company}
                          </td>
                          <td className="px-4 py-3">
                            <a 
                              href={job.job_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-secondary hover:underline"
                            >
                              {job.title}
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded font-medium text-xs ${
                              job.status === 'applied' ? 'bg-success/10 text-success' :
                              job.status === 'failed' ? 'bg-error/10 text-error' :
                              'bg-accent/10 text-accent'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
                <span className="text-sm text-text-secondary">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-border/60 text-text-secondary hover:text-foreground hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium text-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-border/60 text-text-secondary hover:text-foreground hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
