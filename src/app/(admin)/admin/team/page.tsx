"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Shield, UserPlus, Trash2, Crown, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  profile: { full_name: string; avatar_url: string | null } | null;
};

export default function AdminTeamPage() {
  const [team, setTeam] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [creating, setCreating] = useState(false);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/team");
      const json = await res.json();
      if (json.success) {
        setTeam(json.data);
      }
    } catch (err) {
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, full_name: newName, role: newRole }),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success("Team member created successfully");
        setShowCreate(false);
        setNewEmail("");
        setNewPassword("");
        setNewName("");
        fetchTeam();
      } else {
        toast.error(json.error?.message || "Failed to create team member");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: newRole }),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success("Role updated");
        fetchTeam();
      } else {
        toast.error(json.error?.message || "Failed to update role");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove admin access for this user? They will become a regular user.")) return;
    
    try {
      const res = await fetch(`/api/admin/team?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success("Admin removed");
        fetchTeam();
      } else {
        toast.error(json.error?.message || "Failed to remove admin");
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
            Admin Team
          </h1>
          <p className="text-text-secondary">
            Manage your internal team members and their access levels.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} variant="primary" className="bg-secondary hover:bg-secondary-hover shadow-[0_0_24px_rgba(124,58,237,0.3)] text-white">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {showCreate && (
        <div className="glass-card rounded-2xl p-6 border-secondary/30 animate-fade-in">
          <h3 className="font-semibold text-foreground mb-4">Add New Team Member</h3>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="John Doe"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="john@example.com"
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Role</label>
              <select 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full h-[42px] px-3 rounded-xl bg-white/5 border border-border/60 text-sm text-foreground outline-none focus:border-secondary transition-colors"
              >
                <option value="admin" className="bg-surface text-foreground">Admin</option>
                <option value="super_admin" className="bg-surface text-foreground">Super Admin</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={creating} className="bg-secondary text-white hover:bg-secondary-hover">Create Account</Button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card rounded-2xl p-4">
        <div className="rounded-xl border border-border/60 overflow-hidden bg-surface/30">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 text-text-secondary border-b border-border/60">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
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
              ) : team.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">No team members found.</td>
                </tr>
              ) : (
                team.map((member) => (
                  <tr key={member.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary-light font-bold text-xs">
                          {member.profile?.full_name?.charAt(0) || <Shield className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{member.profile?.full_name}</p>
                          <p className="text-xs text-text-secondary">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {member.role === 'super_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                            <Crown className="h-3 w-3" /> Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-secondary/10 text-secondary-light border border-secondary/20">
                            <ShieldAlert className="h-3 w-3" /> Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDistanceToNow(new Date(member.created_at))} ago
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {member.role === 'admin' ? (
                          <button 
                            onClick={() => handleUpdateRole(member.id, 'super_admin')}
                            className="text-xs text-secondary-light hover:underline"
                          >
                            Promote
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUpdateRole(member.id, 'admin')}
                            className="text-xs text-text-secondary hover:underline"
                          >
                            Demote
                          </button>
                        )}
                        <span className="text-border/60">|</span>
                        <button 
                          onClick={() => handleRemove(member.id)}
                          className="text-error hover:text-error/80 p-1"
                          title="Remove Admin Access"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
