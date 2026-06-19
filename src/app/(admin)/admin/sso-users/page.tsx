"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Users, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type SSOUser = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  profile: { full_name: string; avatar_url: string | null } | null;
};

export default function AdminSSOUsersPage() {
  const [users, setUsers] = useState<SSOUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/sso-users");
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (err) {
      toast.error("Failed to load SSO users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await fetch("/api/admin/sso-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, full_name: newName }),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success("SSO User created successfully");
        setShowCreate(false);
        setNewEmail("");
        setNewPassword("");
        setNewName("");
        fetchUsers();
      } else {
        toast.error(json.error?.message || "Failed to create user");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Are you sure you want to deactivate this SSO user? They will lose their free access.")) return;
    
    try {
      const res = await fetch(`/api/admin/sso-users?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success("User deactivated");
        fetchUsers();
      } else {
        toast.error(json.error?.message || "Failed to deactivate");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            SSO Users
          </h1>
          <p className="text-text-secondary">
            Manage users who bypass subscriptions (free access).
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} variant="primary" className="bg-accent hover:bg-accent/80 text-foreground shadow-[0_0_24px_rgba(0,209,255,0.2)]">
          <UserPlus className="mr-2 h-4 w-4" />
          Create SSO User
        </Button>
      </div>

      {showCreate && (
        <div className="glass-card rounded-2xl p-6 border-accent/30 animate-fade-in">
          <h3 className="font-semibold text-foreground mb-4">Add New SSO User</h3>
          <p className="text-sm text-text-secondary mb-6">This user will be able to log in with email/password and will bypass all subscription paywalls.</p>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="jane@example.com"
              required
            />
            <Input
              label="Default Password"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={creating} className="bg-accent text-foreground hover:bg-accent/90">Create SSO User</Button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card rounded-2xl p-4">
        <div className="rounded-xl border border-border/60 overflow-hidden bg-surface/30">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 text-text-secondary border-b border-border/60">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">No SSO users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-xs">
                          {user.profile?.full_name?.charAt(0) || <Users className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.profile?.full_name}</p>
                          <p className="text-xs text-text-secondary">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-text-secondary border border-border/60">
                        SSO Free
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDistanceToNow(new Date(user.created_at))} ago
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleDeactivate(user.id)}
                        className="text-error hover:text-error/80 flex items-center gap-1 ml-auto p-1"
                        title="Deactivate SSO Access"
                      >
                        <UserMinus className="h-4 w-4" /> Deactivate
                      </button>
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
