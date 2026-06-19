"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { User, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

type UserRow = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  profile: { full_name: string; avatar_url: string | null } | null;
  subscription: { plan_id: string; status: string } | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const url = new URL("/api/admin/users", window.location.origin);
        if (search) url.searchParams.set("search", search);
        
        const res = await fetch(url.toString());
        const json = await res.json();
        
        if (json.success) {
          setUsers(json.data);
          setTotal(json.meta?.pagination?.total || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Users
          </h1>
          <p className="text-text-secondary">
            View all registered users on the platform ({total} total).
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 flex flex-col gap-4">
        <div className="max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
          <Input 
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-border"
          />
        </div>

        <div className="rounded-xl border border-border/60 overflow-hidden bg-surface/30">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 text-text-secondary border-b border-border/60">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                          {user.profile?.full_name?.charAt(0) || <User className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.profile?.full_name || "Unknown"}</p>
                          <p className="text-xs text-text-secondary">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-foreground">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.subscription ? (
                        <div>
                          <p className="font-medium text-foreground capitalize">{user.subscription.plan_id}</p>
                          <p className={`text-xs ${user.subscription.status === 'active' ? 'text-success' : 'text-warning'}`}>
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
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-text-secondary hover:text-foreground hover:bg-white/10 transition-colors"
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
