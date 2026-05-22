/**
 * Supabase Database Types
 *
 * Defines the full schema for Nextzen Orbit.
 * Keep in sync with supabase/migrations/*.sql
 */

import type { ResumeContent } from "@/lib/validations/resume";

// ── Enum types ──

export type UserRole = "user" | "admin";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled" | "paused";
export type PlanId = "free" | "pro" | "elite";
export type PaymentProviderType = "razorpay" | "cashfree";
export type ApplicationStatus = "applied" | "screening" | "interview" | "offer" | "rejected";
export type WorkType = "remote" | "onsite" | "hybrid" | "any";
export type JobQueueStatus = "pending" | "processing" | "applied" | "failed" | "skipped";
export type JobSource = "adzuna" | "jsearch" | "manual";

// ── Row types ──
// IMPORTANT: Use `type` not `interface` — interfaces lack implicit index
// signatures, so they don't satisfy Record<string, unknown> which the
// Supabase generic type system requires.

export type UserRow = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  headline: string | null;
  location: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  preferred_role: string | null;
  preferred_location: string | null;
  preferred_salary_min: number | null;
  preferred_salary_max: number | null;
  preferred_work_type: WorkType | null;
  years_of_experience: number | null;
  preferred_portals: string[];
  created_at: string;
  updated_at: string;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  provider: PaymentProviderType;
  plan_id: PlanId;
  status: SubscriptionStatus;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  razorpay_plan_id: string | null;
  cashfree_customer_id: string | null;
  cashfree_subscription_id: string | null;
  currency: string;
  amount_paise: number | null;
  gst_amount_paise: number | null;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ResumeRow = {
  id: string;
  user_id: string;
  title: string;
  content: ResumeContent;
  template_id: string | null;
  is_base: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ApplicationRow = {
  id: string;
  user_id: string;
  resume_id: string | null;
  company: string;
  position: string;
  job_url: string | null;
  status: ApplicationStatus;
  applied_at: string;
  notes: string | null;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AiUsageRow = {
  id: string;
  user_id: string;
  billing_period_start: string;
  billing_period_end: string;
  tokens_used: number;
  tokens_limit: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WebhookEventRow = {
  id: string;
  provider: PaymentProviderType;
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed_at: string;
};

export type ResumeVersionRow = {
  id: string;
  resume_id: string;
  user_id: string;
  version_number: number;
  content: ResumeContent;
  title: string;
  template_id: string | null;
  change_summary: string | null;
  created_at: string;
};

export type CoverLetterRow = {
  id: string;
  user_id: string;
  resume_id: string | null;
  title: string;
  content: string;
  company_name: string;
  job_title: string;
  job_description: string | null;
  created_at: string;
  updated_at: string;
};

export type JobQueueRow = {
  id: string;
  user_id: string;
  title: string;
  company: string;
  job_url: string;
  location: string | null;
  salary_text: string | null;
  description: string | null;
  source: JobSource;
  status: JobQueueStatus;
  error_message: string | null;
  cover_letter_id: string | null;
  resume_id: string | null;
  applied_at: string | null;
  screenshot_url: string | null;
  screenshot_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

// ── Supabase Database type ──
// Compatible with @supabase/supabase-js v2.98+

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: { id: string; email: string; role?: UserRole };
        Update: { email?: string; role?: UserRole };
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: { user_id: string; full_name?: string; phone?: string | null; headline?: string | null; location?: string | null; linkedin_url?: string | null; avatar_url?: string | null; preferred_role?: string | null; preferred_location?: string | null; preferred_salary_min?: number | null; preferred_salary_max?: number | null; preferred_work_type?: WorkType | null; years_of_experience?: number | null; preferred_portals?: string[] };
        Update: { full_name?: string; phone?: string | null; headline?: string | null; location?: string | null; linkedin_url?: string | null; avatar_url?: string | null; preferred_role?: string | null; preferred_location?: string | null; preferred_salary_min?: number | null; preferred_salary_max?: number | null; preferred_work_type?: WorkType | null; years_of_experience?: number | null; preferred_portals?: string[] };
        Relationships: [{ foreignKeyName: "profiles_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: { user_id: string; provider?: PaymentProviderType; plan_id?: PlanId; status?: SubscriptionStatus; razorpay_customer_id?: string | null; razorpay_subscription_id?: string | null; razorpay_plan_id?: string | null; cashfree_customer_id?: string | null; cashfree_subscription_id?: string | null; currency?: string; amount_paise?: number | null; gst_amount_paise?: number | null; trial_starts_at?: string | null; trial_ends_at?: string | null; current_period_start?: string | null; current_period_end?: string | null; cancel_at_period_end?: boolean };
        Update: { provider?: PaymentProviderType; plan_id?: PlanId; status?: SubscriptionStatus; razorpay_customer_id?: string | null; razorpay_subscription_id?: string | null; razorpay_plan_id?: string | null; cashfree_customer_id?: string | null; cashfree_subscription_id?: string | null; currency?: string; amount_paise?: number | null; gst_amount_paise?: number | null; trial_starts_at?: string | null; trial_ends_at?: string | null; current_period_start?: string | null; current_period_end?: string | null; cancel_at_period_end?: boolean; cancelled_at?: string | null };
        Relationships: [{ foreignKeyName: "subscriptions_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      resumes: {
        Row: ResumeRow;
        Insert: { user_id: string; title?: string; content?: ResumeContent; template_id?: string | null; is_base?: boolean; version?: number };
        Update: { title?: string; content?: ResumeContent; template_id?: string | null; is_base?: boolean; version?: number; deleted_at?: string | null };
        Relationships: [{ foreignKeyName: "resumes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      applications: {
        Row: ApplicationRow;
        Insert: { user_id: string; resume_id?: string | null; company: string; position: string; job_url?: string | null; status?: ApplicationStatus; applied_at?: string; notes?: string | null; follow_up_at?: string | null };
        Update: { resume_id?: string | null; company?: string; position?: string; job_url?: string | null; status?: ApplicationStatus; notes?: string | null; follow_up_at?: string | null };
        Relationships: [{ foreignKeyName: "applications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }, { foreignKeyName: "applications_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }];
      };
      ai_usage: {
        Row: AiUsageRow;
        Insert: { user_id: string; billing_period_start: string; billing_period_end: string; tokens_used?: number; tokens_limit?: number };
        Update: { tokens_used?: number; tokens_limit?: number; last_used_at?: string | null };
        Relationships: [{ foreignKeyName: "ai_usage_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      webhook_events: {
        Row: WebhookEventRow;
        Insert: { provider: PaymentProviderType; event_id: string; event_type: string; payload?: Record<string, unknown> };
        Update: Record<string, never>;
        Relationships: [];
      };
      resume_versions: {
        Row: ResumeVersionRow;
        Insert: { resume_id: string; user_id: string; version_number: number; content: ResumeContent; title: string; template_id?: string | null; change_summary?: string | null };
        Update: Record<string, never>;
        Relationships: [{ foreignKeyName: "resume_versions_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }, { foreignKeyName: "resume_versions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      cover_letters: {
        Row: CoverLetterRow;
        Insert: { user_id: string; resume_id?: string | null; title?: string; content: string; company_name: string; job_title: string; job_description?: string | null };
        Update: { title?: string; content?: string; company_name?: string; job_title?: string; job_description?: string | null };
        Relationships: [{ foreignKeyName: "cover_letters_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }, { foreignKeyName: "cover_letters_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }];
      };
      job_queue: {
        Row: JobQueueRow;
        Insert: { user_id: string; title: string; company: string; job_url: string; location?: string | null; salary_text?: string | null; description?: string | null; source?: JobSource; status?: JobQueueStatus; resume_id?: string | null };
        Update: { status?: JobQueueStatus; error_message?: string | null; cover_letter_id?: string | null; resume_id?: string | null; applied_at?: string | null; screenshot_url?: string | null; screenshot_expires_at?: string | null };
        Relationships: [{ foreignKeyName: "job_queue_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }, { foreignKeyName: "job_queue_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
