/**
 * Applications Kanban Board — Client Component
 *
 * Drag-and-drop Kanban board for tracking job applications.
 * Supports: Applied → Screening → Interview → Offer/Rejected
 */

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  ExternalLink,
  MoreVertical,
  Calendar,
  Building2,
  Briefcase,
  Trash2,
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApplicationRow, ApplicationStatus } from "@/types/database";

interface ApplicationsKanbanProps {
  initialApplications: ApplicationRow[];
}

interface Column {
  id: ApplicationStatus;
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const columns: Column[] = [
  { id: "applied", title: "Applied", icon: Clock, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "screening", title: "Screening", icon: AlertCircle, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  { id: "interview", title: "Interview", icon: MessageSquare, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "offer", title: "Offer", icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-500/10" },
  { id: "rejected", title: "Rejected", icon: XCircle, color: "text-red-500", bgColor: "bg-red-500/10" },
];

export function ApplicationsKanban({ initialApplications }: ApplicationsKanbanProps) {
  const [applications, setApplications] = useState<ApplicationRow[]>(initialApplications);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationRow | null>(null);

  const getColumnApps = useCallback(
    (status: ApplicationStatus) =>
      applications.filter((app) => app.status === status),
    [applications]
  );

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDrop = async (targetStatus: ApplicationStatus) => {
    if (!draggingId) return;

    const app = applications.find((a) => a.id === draggingId);
    if (!app || app.status === targetStatus) return;

    // Optimistic update
    setApplications((prev) =>
      prev.map((a) => (a.id === draggingId ? { ...a, status: targetStatus } : a))
    );

    try {
      const res = await fetch(`/api/applications/${draggingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) throw new Error("Update failed");
      toast.success(`Moved to ${targetStatus}`);
    } catch {
      // Revert on error
      setApplications((prev) =>
        prev.map((a) => (a.id === draggingId ? { ...a, status: app.status } : a))
      );
      toast.error("Failed to update status");
    }

    setDraggingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this application?")) return;

    setApplications((prev) => prev.filter((a) => a.id !== id));

    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Application deleted");
    } catch {
      // Refetch on error
      toast.error("Failed to delete");
    }
  };

  const handleAdd = async (data: Partial<ApplicationRow>) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        setApplications((prev) => [result.data, ...prev]);
        setShowAddModal(false);
        toast.success("Application added!");
      }
    } catch {
      toast.error("Failed to add application");
    }
  };

  const handleUpdate = async (id: string, data: Partial<ApplicationRow>) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...result.data } : a))
        );
        setEditingApp(null);
        toast.success("Application updated!");
      }
    } catch {
      toast.error("Failed to update application");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            {applications.length} Applications
          </h2>
          <div className="flex gap-2">
            {columns.slice(0, 4).map((col) => (
              <Badge
                key={col.id}
                variant="default"
                size="sm"
                className={cn("gap-1", col.bgColor, col.color)}
              >
                {getColumnApps(col.id).length} {col.title}
              </Badge>
            ))}
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowAddModal(true)}
        >
          Add Application
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            applications={getColumnApps(column.id)}
            draggingId={draggingId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={() => handleDrop(column.id)}
            onEdit={setEditingApp}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <ApplicationModal
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAdd}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingApp && (
          <ApplicationModal
            application={editingApp}
            onClose={() => setEditingApp(null)}
            onSubmit={(data) => handleUpdate(editingApp.id, data)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Kanban Column ───
interface KanbanColumnProps {
  column: Column;
  applications: ApplicationRow[];
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onEdit: (app: ApplicationRow) => void;
  onDelete: (id: string) => void;
}

function KanbanColumn({
  column,
  applications,
  draggingId,
  onDragStart,
  onDragEnd,
  onDrop,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  const Icon = column.icon;
  const isDropTarget = draggingId && !applications.find((a) => a.id === draggingId);

  return (
    <div
      className={cn(
        "flex-shrink-0 w-72 rounded-xl border bg-card transition-colors",
        isDropTarget ? "border-primary border-dashed bg-primary/5" : "border-border"
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Column Header */}
      <div className={cn("px-4 py-3 border-b border-border", column.bgColor)}>
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", column.color)} />
          <h3 className="font-medium text-foreground">{column.title}</h3>
          <span className={cn("ml-auto text-sm font-bold", column.color)}>
            {applications.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
        <AnimatePresence>
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              isDragging={draggingId === app.id}
              onDragStart={() => onDragStart(app.id)}
              onDragEnd={onDragEnd}
              onEdit={() => onEdit(app)}
              onDelete={() => onDelete(app.id)}
            />
          ))}
        </AnimatePresence>

        {applications.length === 0 && (
          <div className="py-8 text-center text-sm text-granite">
            No applications
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Application Card ───
interface ApplicationCardProps {
  application: ApplicationRow;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ApplicationCard({
  application,
  isDragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}: ApplicationCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative p-3 rounded-lg border bg-background cursor-grab active:cursor-grabbing",
        "hover:border-primary/50 transition-colors",
        isDragging && "ring-2 ring-primary"
      )}
    >
      {/* Company & Position */}
      <div className="mb-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm text-foreground line-clamp-1">
            {application.company}
          </h4>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4 text-granite" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 rounded-lg border border-border bg-card shadow-lg z-10">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <Edit className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-text-secondary line-clamp-1">{application.position}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-granite">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(application.applied_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
        {application.job_url && (
          <a
            href={application.job_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" />
            Link
          </a>
        )}
      </div>

      {/* Notes preview */}
      {application.notes && (
        <p className="mt-2 text-xs text-text-secondary line-clamp-2 italic">
          {application.notes}
        </p>
      )}

      {/* Follow-up indicator */}
      {application.follow_up_at && new Date(application.follow_up_at) > new Date() && (
        <div className="mt-2 flex items-center gap-1 text-xs text-warning">
          <Clock className="h-3 w-3" />
          Follow-up: {new Date(application.follow_up_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Add/Edit Modal ───
interface ApplicationModalProps {
  application?: ApplicationRow;
  onClose: () => void;
  onSubmit: (data: Partial<ApplicationRow>) => void;
}

function ApplicationModal({ application, onClose, onSubmit }: ApplicationModalProps) {
  const [company, setCompany] = useState(application?.company || "");
  const [position, setPosition] = useState(application?.position || "");
  const [jobUrl, setJobUrl] = useState(application?.job_url || "");
  const [status, setStatus] = useState<ApplicationStatus>(application?.status || "applied");
  const [notes, setNotes] = useState(application?.notes || "");
  const [followUpAt, setFollowUpAt] = useState(
    application?.follow_up_at ? application.follow_up_at.split("T")[0] : ""
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !position.trim()) {
      toast.error("Company and position are required");
      return;
    }

    setSubmitting(true);
    await onSubmit({
      company: company.trim(),
      position: position.trim(),
      job_url: jobUrl.trim() || null,
      status,
      notes: notes.trim() || null,
      follow_up_at: followUpAt ? new Date(followUpAt).toISOString() : null,
    });
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {application ? "Edit Application" : "Add Application"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Company *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-granite" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Google"
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Position *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-granite" />
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Job URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Job URL
            </label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Follow-up Date
            </label>
            <input
              type="date"
              value={followUpAt}
              onChange={(e) => setFollowUpAt(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              className="flex-1"
            >
              {application ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

