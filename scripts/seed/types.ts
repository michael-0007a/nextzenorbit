export type SeedCareer = {
  title: string;
  slug: string;
  description: string;
  icon: string;
};

export type RoadmapLevel = "beginner" | "intermediate" | "advanced";

export type SeedRoadmapStep = {
  title: string;
  description: string;
  level: RoadmapLevel;
};

export type SeedRoadmap = {
  careerSlug: string;
  role: string;
  title: string;
  description: string;
  steps: SeedRoadmapStep[];
};

export type InterviewDifficulty = "easy" | "medium" | "hard";

export type SeedInterviewQuestion = {
  careerSlug: string;
  role: string;
  difficulty: InterviewDifficulty;
  topic: string;
  question: string;
  answer: string;
  company?: string;
};

export type ResourceDifficulty = "beginner" | "intermediate" | "advanced";

export type SeedYoutubeResource = {
  careerSlug?: string;
  role: string;
  title: string;
  url: string;
  thumbnail: string;
  channel: string;
  topic: string;
  difficulty: ResourceDifficulty;
};
