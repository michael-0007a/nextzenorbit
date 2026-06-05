import type { Database } from "../../src/types/database";
import { careers } from "./data/careers";
import { interviewQuestions } from "./data/interview-questions";
import { roadmaps } from "./data/roadmaps";
import { youtubeResources } from "./data/youtube-resources";
import { createSeedClient, insertRows, logSection, seedId, upsertRows } from "./helpers";

async function seedCareers(client: ReturnType<typeof createSeedClient>) {
  logSection("Careers");

  const careerRows: Database["public"]["Tables"]["careers"]["Insert"][] = careers.map(
    (career) => ({
      title: career.title,
      slug: career.slug,
      description: career.description,
      icon: career.icon,
    })
  );

  await upsertRows(client, "careers", careerRows, { onConflict: "slug" });

  const { data, error } = await client
    .from("careers")
    .select("id, slug")
    .in(
      "slug",
      careers.map((career) => career.slug)
    );

  if (error || !data) {
    throw new Error(`Failed to fetch career IDs: ${error?.message ?? "unknown"}`);
  }

  const careerIdBySlug = new Map(data.map((row) => [row.slug, row.id]));
  return careerIdBySlug;
}

async function seedRoadmaps(
  client: ReturnType<typeof createSeedClient>,
  careerIdBySlug: Map<string, string>
) {
  logSection("Roadmaps");

  const roadmapRows: Database["public"]["Tables"]["roadmaps"]["Insert"][] = roadmaps.map(
    (roadmap) => {
      const careerId = careerIdBySlug.get(roadmap.careerSlug);
      if (!careerId) {
        throw new Error(`Missing career for slug ${roadmap.careerSlug}`);
      }

      return {
        id: seedId("roadmap", roadmap.careerSlug),
        career_id: careerId,
        role: roadmap.role,
        title: roadmap.title,
        description: roadmap.description,
      };
    }
  );

  await upsertRows(client, "roadmaps", roadmapRows, { onConflict: "id" });

  const roadmapIds = roadmapRows.map((row) => row.id as string);
  const { error: deleteError } = await client
    .from("roadmap_steps")
    .delete()
    .in("roadmap_id", roadmapIds);

  if (deleteError) {
    throw new Error(`Failed clearing roadmap steps: ${deleteError.message}`);
  }

  const stepRows: Database["public"]["Tables"]["roadmap_steps"]["Insert"][] = roadmaps.flatMap(
    (roadmap) => {
      const roadmapId = seedId("roadmap", roadmap.careerSlug);

      return roadmap.steps.map((step, index) => ({
        id: seedId(
          "roadmap_step",
          `${roadmapId}:${index + 1}:${step.title}`
        ),
        roadmap_id: roadmapId,
        title: step.title,
        description: step.description,
        order_index: index + 1,
        level: step.level,
      }));
    }
  );

  await insertRows(client, "roadmap_steps", stepRows);
}

async function seedInterviewQuestions(
  client: ReturnType<typeof createSeedClient>,
  careerIdBySlug: Map<string, string>
) {
  logSection("Interview Questions");

  const rows: Database["public"]["Tables"]["interview_questions"]["Insert"][] =
    interviewQuestions.map((question) => ({
      id: seedId("interview", `${question.role}:${question.topic}:${question.question}`),
      career_id: careerIdBySlug.get(question.careerSlug) ?? null,
      role: question.role,
      company: question.company ?? null,
      difficulty: question.difficulty,
      topic: question.topic,
      question: question.question,
      answer: question.answer,
    }));

  await upsertRows(client, "interview_questions", rows, { onConflict: "id" });
}

async function seedYoutubeResources(
  client: ReturnType<typeof createSeedClient>,
  careerIdBySlug: Map<string, string>
) {
  logSection("YouTube Resources");

  const rows: Database["public"]["Tables"]["youtube_resources"]["Insert"][] =
    youtubeResources.map((resource) => ({
      career_id: resource.careerSlug
        ? careerIdBySlug.get(resource.careerSlug) ?? null
        : null,
      role: resource.role,
      title: resource.title,
      url: resource.url,
      thumbnail: resource.thumbnail,
      channel: resource.channel,
      topic: resource.topic,
      difficulty: resource.difficulty,
    }));

  await upsertRows(client, "youtube_resources", rows, { onConflict: "url" });
}

async function run() {
  const client = createSeedClient();
  const careerIdBySlug = await seedCareers(client);

  await seedRoadmaps(client, careerIdBySlug);
  await seedInterviewQuestions(client, careerIdBySlug);
  await seedYoutubeResources(client, careerIdBySlug);

  console.log("\nSeed complete.");
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
