import type { SeedCareer } from "../types";

export const careers: SeedCareer[] = [
  {
    title: "Frontend Developer",
    slug: "frontend-developer",
    description:
      "Build user-facing web apps with React, TypeScript, and modern CSS. Focus on performance, accessibility, and design systems.",
    icon: "layout",
  },
  {
    title: "Backend Developer",
    slug: "backend-developer",
    description:
      "Design APIs and databases that scale. Own data modeling, security, and reliability.",
    icon: "server",
  },
  {
    title: "Full Stack Developer",
    slug: "full-stack-developer",
    description:
      "Ship end-to-end features across frontend and backend. Balance UX, APIs, and deployments.",
    icon: "layers",
  },
  {
    title: "DevOps Engineer",
    slug: "devops-engineer",
    description:
      "Automate infrastructure, CI/CD, and reliability. Own monitoring, security, and cloud costs.",
    icon: "cloud-cog",
  },
  {
    title: "Data Analyst",
    slug: "data-analyst",
    description:
      "Translate raw data into insights with SQL and BI tools. Drive decisions with metrics and dashboards.",
    icon: "bar-chart-3",
  },
  {
    title: "AI/ML Engineer",
    slug: "ai-ml-engineer",
    description:
      "Build and deploy ML systems from data pipelines to model serving. Focus on MLOps and responsible AI.",
    icon: "brain",
  },
];
