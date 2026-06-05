import { createAdminClient } from "@/lib/supabase/admin";
import type { Result } from "@/types/api";
import type { AutofillProfile } from "@/lib/validations/autofill";
import type { ResumeContent } from "@/lib/validations/resume";

export async function getAutofillProfile(
  userId: string,
  email: string
): Promise<Result<AutofillProfile>> {
  // Use admin client to avoid RLS recursion while still scoping by user ID.
  const supabase = createAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, phone, linkedin_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return { ok: false, error: new Error(profileError.message) };
  }

  const { data: resumes, error: resumeError } = await supabase
    .from("resumes")
    .select("content, is_base, updated_at, file_url")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("is_base", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1);

  if (resumeError) {
    return { ok: false, error: new Error(resumeError.message) };
  }

  const resume = resumes?.[0];
  const content = resume?.content as ResumeContent | undefined;
  const contact = content?.contact;

  const skills = (content?.skills ?? [])
    .flatMap((skill) => skill.items ?? [])
    .filter(Boolean);

  const education = (content?.education ?? []).map((edu) => ({
    institution: edu.institution ?? "",
    degree: edu.degree ?? "",
    fieldOfStudy: edu.field_of_study ?? "",
    startDate: edu.start_date ?? "",
    endDate: edu.end_date ?? "",
    location: edu.location ?? "",
    gpa: edu.gpa ?? "",
  }));

  const experience = (content?.experience ?? []).map((exp) => ({
    company: exp.company ?? "",
    position: exp.position ?? "",
    location: exp.location ?? "",
    startDate: exp.start_date ?? "",
    endDate: exp.end_date ?? "",
    isCurrent: exp.is_current ?? false,
    bullets: exp.bullets ?? [],
  }));

  const fullName =
    profile?.full_name || contact?.full_name || email.split("@")[0] || "";

  return {
    ok: true,
    data: {
      fullName,
      email,
      phone: profile?.phone || contact?.phone || "",
      linkedinUrl: profile?.linkedin_url || contact?.linkedin_url || "",
      githubUrl: contact?.github_url || "",
      portfolioUrl: contact?.portfolio_url || "",
      skills,
      education,
      experience,
      resumeUrl: resume?.file_url ?? null,
    },
  };
}
