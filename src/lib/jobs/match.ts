import type { AdzunaJob } from "./adzuna";
import type { ResumeContent } from "@/lib/validations/resume";

export function resumeSkills(content?: ResumeContent | null): string[] {
  return [...new Set((content?.skills || []).flatMap(group => group.items))];
}

// Deliberately accepts only professional preferences, never demographic or visa data.
export function explainJobMatch(job: AdzunaJob, preferences: { role: string; skills?: string[]; location?: string; workType?: string }) {
  const reasons: string[] = [];
  const gaps: string[] = [];
  let score = 0;
  const title = job.title.toLowerCase();
  const tokens = preferences.role.toLowerCase().split(/[^a-z0-9+#]+/).filter(word=>word.length>2);
  const hits = tokens.filter(word=>title.includes(word));
  if (hits.length) {score+=hits.length*3;reasons.push(`Title includes: ${hits.join(", ")}`);}
  const body = `${job.title} ${job.description}`.toLowerCase();
  const skills = (preferences.skills || []).filter(skill=>skill.trim() && body.includes(skill.toLowerCase()));
  if (skills.length) {score+=Math.min(skills.length,8);reasons.push(`Listed skills: ${skills.slice(0,5).join(", ")}`);}
  if (preferences.location && job.location.toLowerCase().includes(preferences.location.toLowerCase())) {score+=2;reasons.push("Listing location matches your preference");}
  if (preferences.workType && preferences.workType !== "any") {
    if (job.work_arrangement===preferences.workType) {score+=2;reasons.push(`Listing mentions ${preferences.workType} work`);}
    else gaps.push(job.work_arrangement === "unknown" ? "Work arrangement needs verification" : "Check work arrangement against your preference");
  }
  gaps.push("Work authorization, sponsorship, and full requirements need review in the original listing");
  return { score, reasons, gaps };
}
