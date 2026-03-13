/**
 * Applications View — Client Component
 *
 * Toggle between Kanban board and table views.
 */

"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { ApplicationsKanban } from "./applications-kanban";
import { ApplicationsTable } from "./applications-table";
import { cn } from "@/lib/utils";
import type { ApplicationRow } from "@/types/database";

interface ApplicationsViewProps {
  initialApplications: ApplicationRow[];
}

export function ApplicationsView({ initialApplications }: ApplicationsViewProps) {
  const [view, setView] = useState<"kanban" | "table">("kanban");

  return (
    <div className="space-y-4">
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

      {/* View Content */}
      {view === "kanban" ? (
        <ApplicationsKanban initialApplications={initialApplications} />
      ) : (
        <ApplicationsTable applications={initialApplications} />
      )}
    </div>
  );
}

