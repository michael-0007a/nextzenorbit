import type { JobRow } from "@/types/database";

export type Job = JobRow;

export type JobSummary = Pick<
  JobRow,
  "id" | "company" | "title" | "location" | "apply_url" | "source" | "tags" | "created_at"
>;
