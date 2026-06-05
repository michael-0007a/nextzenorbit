import type { Career, InterviewQuestion, Roadmap, RoadmapWithSteps, YoutubeResource } from "@/types/domain";
import type { Job } from "@/types/domain/jobs";
import type { AiNote } from "@/types/domain/notes";
import { fetchJson } from "./request";

export async function fetchCareers(query?: string) {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await fetchJson<Career[]>(`/api/careers${params}`);
  return response.data;
}

export async function fetchCareer(slug: string) {
  const response = await fetchJson<Career>(`/api/careers/${slug}`);
  return response.data;
}

export async function fetchRoadmaps(careerId?: string, role?: string) {
  const params = new URLSearchParams();
  if (careerId) params.set("career_id", careerId);
  if (role) params.set("role", role);
  const response = await fetchJson<Roadmap[]>(
    `/api/roadmaps${params.toString() ? `?${params.toString()}` : ""}`
  );
  return response.data;
}

export async function fetchRoadmap(id: string) {
  const response = await fetchJson<RoadmapWithSteps>(`/api/roadmaps/${id}`);
  return response.data;
}

export async function fetchInterviewQuestions(filters: {
  careerId?: string;
  role?: string;
  company?: string;
  difficulty?: string;
  topic?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters.careerId) params.set("career_id", filters.careerId);
  if (filters.role) params.set("role", filters.role);
  if (filters.company) params.set("company", filters.company);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.limit) params.set("limit", String(filters.limit));

  const response = await fetchJson<InterviewQuestion[]>(
    `/api/interview-questions${params.toString() ? `?${params.toString()}` : ""}`
  );
  return response.data;
}

export async function fetchYoutubeResources(filters: {
  careerId?: string;
  role?: string;
  topic?: string;
  difficulty?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters.careerId) params.set("career_id", filters.careerId);
  if (filters.role) params.set("role", filters.role);
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.limit) params.set("limit", String(filters.limit));

  const response = await fetchJson<YoutubeResource[]>(
    `/api/youtube${params.toString() ? `?${params.toString()}` : ""}`
  );
  return response.data;
}

export async function fetchJobs(filters: {
  query?: string;
  location?: string;
  source?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.location) params.set("location", filters.location);
  if (filters.source) params.set("source", filters.source);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));

  const response = await fetchJson<Job[]>(
    `/api/jobs${params.toString() ? `?${params.toString()}` : ""}`
  );
  return response.data;
}

export async function fetchAiNotes(filters?: { role?: string; topic?: string }) {
  const params = new URLSearchParams();
  if (filters?.role) params.set("role", filters.role);
  if (filters?.topic) params.set("topic", filters.topic);

  const response = await fetchJson<AiNote[]>(
    `/api/ai-notes${params.toString() ? `?${params.toString()}` : ""}`
  );
  return response.data;
}
