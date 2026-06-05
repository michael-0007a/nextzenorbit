import { notFound } from "next/navigation";
import { CareerHero } from "@/components/career";
import { RoadmapSection } from "@/components/career";
import { InterviewSection } from "@/components/career";
import { ResourcesSection } from "@/components/career";
import { RelatedJobsSection } from "@/components/career";
import { AiNotesPanel } from "@/components/career";
import { ProjectsSection } from "@/components/career";
import { careerQueryBySlug } from "@/features/career/metadata";
import { createClient } from "@/lib/supabase/server";
import { getCareerBySlug } from "@/services/careers-service";
import { listRoadmaps, getRoadmapWithSteps } from "@/services/roadmaps-service";
import { listInterviewQuestions } from "@/services/interview-service";
import { listYoutubeResources } from "@/services/youtube-service";
import { listJobs } from "@/services/jobs-service";
import { listProjects } from "@/services/projects-service";

export const dynamic = "force-dynamic";

interface CareerDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CareerDetailPage({ params }: CareerDetailPageProps) {
  const { slug } = await params;
  const careerResult = await getCareerBySlug(slug);

  if (!careerResult.ok) {
    return notFound();
  }

  const career = careerResult.data;

  const [roadmapList, interviewQuestions, resources, jobs, auth] = await Promise.all([
    listRoadmaps({ careerId: career.id }),
    listInterviewQuestions({ careerId: career.id, role: career.title, limit: 80 }),
    listYoutubeResources({ careerId: career.id, role: career.title, limit: 12 }),
    listJobs({
      query: careerQueryBySlug[slug] ?? career.title,
      limit: 6,
    }),
    (async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user ? { userId: user.id } : null;
    })(),
  ]);

  const roadmap = roadmapList.ok && roadmapList.data[0]
    ? await getRoadmapWithSteps(roadmapList.data[0].id)
    : null;

  const roadmapData = roadmap && roadmap.ok ? roadmap.data : null;

  const projectData = auth ? await listProjects(auth.userId) : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-6 py-10">
      <CareerHero
        career={career}
        stats={{
          steps: roadmapData?.steps.length ?? 0,
          questions: interviewQuestions.ok ? interviewQuestions.data.length : 0,
          resources: resources.ok ? resources.data.length : 0,
        }}
      />

      <RoadmapSection roadmap={roadmapData} />

      <InterviewSection questions={interviewQuestions.ok ? interviewQuestions.data : []} />

      <ResourcesSection resources={resources.ok ? resources.data : []} />

      <AiNotesPanel roleLabel={career.title} />

      <RelatedJobsSection jobs={jobs.ok ? jobs.data : []} />

      <ProjectsSection
        projects={projectData && projectData.ok ? projectData.data : []}
        isAuthenticated={!!auth}
      />
    </div>
  );
}
