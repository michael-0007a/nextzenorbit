"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { User, Search, ChevronRight, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type UserRow = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  profileComplete: boolean;
  claimedBy: string | null;
  claimedByName: string | null;
  jobCounts: { pending: number; processing: number; applied: number; failed: number; skipped: number };
  profile: { full_name: string; avatar_url: string | null; assigned_admin_id: string | null } | null;
  subscription: { plan_id: string; status: string } | null;
};

type AdminUser = {
  id: string;
  email: string;
  profile: { full_name: string } | null;
};

export function AdminUsersClient({ adminRole, admins }: { adminRole: string; admins: AdminUser[] }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/users", window.location.origin);
      if (search) url.searchParams.set("search", search);
      
      const res = await fetch(url.toString());
      const json = await res.json();
      
      if (json.success) {
        let data = json.data;
        if (search) {
          const s = search.toLowerCase();
          data = data.filter((u: UserRow) => 
            u.email.toLowerCase().includes(s) || 
            (u.profile?.full_name || "").toLowerCase().includes(s)
          );
        }
        setUsers(data);
        setTotal(json.meta?.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleAssign = async (userId: string, adminId: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_admin", user_id: userId, admin_id: adminId || null }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(adminId ? "Admin assigned successfully!" : "Admin unassigned!");
        fetchUsers();
      } else {
        toast.error(json.error?.message || "Failed to assign admin.");
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {adminRole === "admin" ? "My Clients" : "Allocate Clients"}
          </h1>
          <p className="text-text-secondary">
            {adminRole === "admin" ? "Manage your assigned clients." : "Manage users and allocate them to admins."}
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 flex flex-col gap-4">
        <div className="max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
          <Input 
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-border"
          />
        </div>

        <div className="rounded-xl border border-border/60 overflow-x-auto bg-surface/30">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
            <thead className="bg-white/5 text-text-secondary border-b border-border/60">
              <tr>
                <th className="px-4 py-3 font-medium">User & Profile</th>
                <th className="px-4 py-3 font-medium">Assigned Admin</th>
                <th className="px-4 py-3 font-medium">Queue Stats</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs relative">
                          {user.profile?.full_name?.charAt(0).toUpperCase() || <User className="h-3 w-3" />}
                          {user.profileComplete ? (
                            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-success rounded-full border-2 border-surface flex items-center justify-center">
                              <CheckCircle2 className="h-2 w-2 text-surface" strokeWidth={4} />
                            </div>
                          ) : (
                            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-warning rounded-full border-2 border-surface flex items-center justify-center">
                              <AlertTriangle className="h-2 w-2 text-surface" strokeWidth={4} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground flex items-center gap-2">
                            {user.profile?.full_name || "Unknown User"}
                            {user.role === "admin" && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-secondary/20 text-secondary border border-secondary/30">
                                Admin
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-text-secondary">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {adminRole === "admin" ? (
                        user.claimedBy ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded bg-white/5 text-text-secondary border border-border/40">
                            <Shield className="h-3 w-3" />
                            {user.claimedByName || "Assigned"}
                          </span>
                        ) : (
                          <span className="text-xs text-text-secondary">Unassigned</span>
                        )
                      ) : (
                        <select
                          className="bg-white/5 border border-border/40 rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
                          value={user.claimedBy || ""}
                          onChange={(e) => handleAssign(user.id, e.target.value)}
                        >
                          <option value="" className="bg-background text-text-secondary">Unassigned</option>
                          {admins.map((admin) => (
                            <option key={admin.id} value={admin.id} className="bg-background text-foreground">
                              {admin.profile?.full_name || admin.email}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {user.jobCounts.pending > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-warning/10 text-warning border border-warning/20">
                            {user.jobCounts.pending} pnd
                          </span>
                        )}
                        {user.jobCounts.applied > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-success/10 text-success border border-success/20">
                            {user.jobCounts.applied} app
                          </span>
                        )}
                        {user.jobCounts.pending === 0 && user.jobCounts.applied === 0 && (
                          <span className="text-xs text-text-secondary">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.subscription ? (
                        <div>
                          <p className="font-medium text-foreground capitalize">{user.subscription.plan_id}</p>
                          <p className={`text-[10px] uppercase font-bold tracking-wider ${user.subscription.status === 'active' ? 'text-success' : 'text-warning'}`}>
                            {user.subscription.status}
                          </p>
                        </div>
                      ) : (
                        <span className="text-text-secondary">Free</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDistanceToNow(new Date(user.created_at))} ago
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link 
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 text-foreground hover:bg-white/10 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
