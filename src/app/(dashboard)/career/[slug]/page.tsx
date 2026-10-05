import { Suspense,type ReactNode } from 'react';
import { PageLoading } from '@/components/layout/page-loading';
import { notFound } from "next/navigation";
import { CareerHero } from "@/components/career";
import { RoadmapSection } from "@/components/career";
import { InterviewSection } from "@/components/career";
import { ResourcesSection } from "@/components/career";
import { RelatedJobsSection } from "@/components/career";
import { AiNotesPanel } from "@/components/career";
import { ProjectsSection } from "@/components/career";
import { careerQueryBySlug } from "@/features/career/metadata";
import { getCachedUser } from "@/lib/supabase/server";
import { getCareerBySlug } from "@/services/careers-service";
import { listRoadmaps, getRoadmapWithSteps } from "@/services/roadmaps-service";
import { listInterviewQuestions } from "@/services/interview-service";
import { listYoutubeResources } from "@/services/youtube-service";
import { listJobs } from "@/services/jobs-service";
import { listProjects } from "@/services/projects-service";



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

  const roadmapPromise=listRoadmaps({careerId:career.id}).then(async result=>result.ok&&result.data[0]?getRoadmapWithSteps(result.data[0].id):null).then(result=>result?.ok?result.data:null);
  const interviewPromise=listInterviewQuestions({careerId:career.id,role:career.title,limit:80});
  const resourcesPromise=listYoutubeResources({careerId:career.id,role:career.title,limit:12});
  const jobsPromise=listJobs({query:careerQueryBySlug[slug]??career.title,limit:6});
  const projectsPromise=getCachedUser().then(async({user})=>({authenticated:!!user,result:user?await listProjects(user.id):null}));
  const stats=Promise.all([roadmapPromise,interviewPromise,resourcesPromise]).then(([r,i,v])=><>{[[r?.steps.length??0,'roadmap steps'],[i.ok?i.data.length:0,'interview questions'],[v.ok?v.data.length:0,'learning resources']].map(([count,label])=><div key={label} className="rounded-full border border-border/60 bg-white/5 px-4 py-2">{count} {label}</div>)}</>);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-6 py-10">
      <CareerHero career={career} statsContent={<Suspense fallback={<span role="status">Loading track details…</span>}><Resolved content={stats}/></Suspense>}/>
      <Suspense fallback={<PageLoading/>}><Resolved content={roadmapPromise.then(roadmap=><RoadmapSection roadmap={roadmap}/>)}/></Suspense>
      <Suspense fallback={<PageLoading/>}><Resolved content={interviewPromise.then(result=><InterviewSection questions={result.ok?result.data:[]}/>)}/></Suspense>
      <Suspense fallback={<PageLoading/>}><Resolved content={resourcesPromise.then(result=><ResourcesSection resources={result.ok?result.data:[]}/>)}/></Suspense>
      <AiNotesPanel roleLabel={career.title}/>
      <Suspense fallback={<PageLoading/>}><Resolved content={jobsPromise.then(result=><RelatedJobsSection jobs={result.ok?result.data:[]}/>)}/></Suspense>
      <Suspense fallback={<PageLoading/>}><Resolved content={projectsPromise.then(({authenticated,result})=><ProjectsSection projects={result?.ok?result.data:[]} isAuthenticated={authenticated}/>)}/></Suspense>
    </div>
  );
}

async function Resolved({content}:{content:Promise<ReactNode>}){return await content;}
