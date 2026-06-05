import type { SeedRoadmap } from "../types";

export const roadmaps: SeedRoadmap[] = [
  {
    careerSlug: "frontend-developer",
    role: "Frontend Developer",
    title: "Frontend Developer Roadmap",
    description: "From web fundamentals to advanced performance and design systems.",
    steps: [
      {
        level: "beginner",
        title: "HTML semantics and accessibility foundations",
        description: "Use semantic tags, proper forms, and basic ARIA patterns.",
      },
      {
        level: "beginner",
        title: "CSS fundamentals and responsive layouts",
        description: "Master Flexbox, Grid, and mobile-first design.",
      },
      {
        level: "beginner",
        title: "JavaScript fundamentals and DOM",
        description: "Understand events, async basics, and DOM manipulation.",
      },
      {
        level: "beginner",
        title: "Version control with Git and GitHub",
        description: "Branching, pull requests, and code reviews.",
      },
      {
        level: "intermediate",
        title: "TypeScript for frontend apps",
        description: "Types, generics, and strict mode patterns.",
      },
      {
        level: "intermediate",
        title: "React fundamentals",
        description: "Components, props/state, hooks, and composition.",
      },
      {
        level: "intermediate",
        title: "State management and data fetching",
        description: "Context/Zustand and server-state libraries.",
      },
      {
        level: "intermediate",
        title: "Testing UI components",
        description: "Unit and integration tests with React Testing Library.",
      },
      {
        level: "intermediate",
        title: "API integration and error handling",
        description: "REST/GraphQL patterns, retries, and empty states.",
      },
      {
        level: "advanced",
        title: "Next.js App Router and SSR",
        description: "Server components, routing, and caching behavior.",
      },
      {
        level: "advanced",
        title: "Performance optimization",
        description: "Code splitting, memoization, profiling, and Web Vitals.",
      },
      {
        level: "advanced",
        title: "Accessibility and design systems",
        description: "WCAG, tokens, and reusable component libraries.",
      },
      {
        level: "advanced",
        title: "Observability and frontend reliability",
        description: "Error tracking, session replay, and client metrics.",
      },
    ],
  },
  {
    careerSlug: "backend-developer",
    role: "Backend Developer",
    title: "Backend Developer Roadmap",
    description: "Core APIs, data modeling, and scalable service design.",
    steps: [
      {
        level: "beginner",
        title: "HTTP, REST, and API fundamentals",
        description: "Status codes, headers, and request lifecycles.",
      },
      {
        level: "beginner",
        title: "Node.js runtime and Express basics",
        description: "Routing, middleware, and error handling.",
      },
      {
        level: "beginner",
        title: "SQL basics with PostgreSQL",
        description: "CRUD, joins, and basic schema design.",
      },
      {
        level: "beginner",
        title: "Authentication and authorization",
        description: "JWT, sessions, and role-based access.",
      },
      {
        level: "beginner",
        title: "Git workflows and deployment basics",
        description: "Branching, releases, and environment config.",
      },
      {
        level: "intermediate",
        title: "API design patterns",
        description: "Pagination, filtering, and versioning strategies.",
      },
      {
        level: "intermediate",
        title: "Database indexing and query tuning",
        description: "Indexes, query plans, and performance tradeoffs.",
      },
      {
        level: "intermediate",
        title: "Caching strategies",
        description: "Cache-aside, write-through, and TTLs.",
      },
      {
        level: "intermediate",
        title: "Background jobs and queues",
        description: "Async processing, retries, and idempotency.",
      },
      {
        level: "intermediate",
        title: "Testing and contracts",
        description: "Unit, integration, and schema validation.",
      },
      {
        level: "advanced",
        title: "Scalability and capacity planning",
        description: "Horizontal scaling, load balancing, and hotspots.",
      },
      {
        level: "advanced",
        title: "Observability",
        description: "Structured logs, metrics, and tracing.",
      },
      {
        level: "advanced",
        title: "Security hardening",
        description: "OWASP, rate limiting, and secrets management.",
      },
      {
        level: "advanced",
        title: "Architecture tradeoffs",
        description: "Monolith vs microservices and modular design.",
      },
      {
        level: "advanced",
        title: "CI/CD for backend services",
        description: "Automated tests, migrations, and rollbacks.",
      },
    ],
  },
  {
    careerSlug: "full-stack-developer",
    role: "Full Stack Developer",
    title: "Full Stack Developer Roadmap",
    description: "Deliver features across frontend, backend, and deployment.",
    steps: [
      {
        level: "beginner",
        title: "Web fundamentals",
        description: "HTML, CSS, JavaScript, and accessibility basics.",
      },
      {
        level: "beginner",
        title: "Git and collaboration",
        description: "Branches, pull requests, and code reviews.",
      },
      {
        level: "beginner",
        title: "API basics",
        description: "REST, request validation, and error responses.",
      },
      {
        level: "beginner",
        title: "React fundamentals",
        description: "Components, hooks, and UI composition.",
      },
      {
        level: "intermediate",
        title: "TypeScript across the stack",
        description: "Shared types and strict contracts.",
      },
      {
        level: "intermediate",
        title: "Database modeling",
        description: "Schema design, relations, and migrations.",
      },
      {
        level: "intermediate",
        title: "Auth flows",
        description: "OAuth, sessions, and secure storage.",
      },
      {
        level: "intermediate",
        title: "File uploads and storage",
        description: "Signed URLs and validation pipelines.",
      },
      {
        level: "advanced",
        title: "SSR and performance",
        description: "Caching, streaming, and asset optimization.",
      },
      {
        level: "advanced",
        title: "Deployment workflows",
        description: "Vercel/Fly, env management, and rollbacks.",
      },
      {
        level: "advanced",
        title: "Observability",
        description: "Logs, metrics, and alerting baselines.",
      },
      {
        level: "advanced",
        title: "Security and compliance",
        description: "OWASP, data protection, and auditability.",
      },
    ],
  },
  {
    careerSlug: "devops-engineer",
    role: "DevOps Engineer",
    title: "DevOps Engineer Roadmap",
    description: "Automate infrastructure, reliability, and delivery pipelines.",
    steps: [
      {
        level: "beginner",
        title: "Linux and shell fundamentals",
        description: "CLI, permissions, and process management.",
      },
      {
        level: "beginner",
        title: "Networking basics",
        description: "DNS, HTTP, TLS, and load balancing concepts.",
      },
      {
        level: "beginner",
        title: "Git and CI basics",
        description: "Build pipelines and automated tests.",
      },
      {
        level: "beginner",
        title: "Docker fundamentals",
        description: "Images, containers, and multi-stage builds.",
      },
      {
        level: "beginner",
        title: "Cloud fundamentals",
        description: "Compute, storage, and IAM basics.",
      },
      {
        level: "intermediate",
        title: "Infrastructure as code",
        description: "Terraform modules, state, and environments.",
      },
      {
        level: "intermediate",
        title: "CI/CD pipelines",
        description: "GitHub Actions, deploy strategies, and secrets.",
      },
      {
        level: "intermediate",
        title: "Kubernetes basics",
        description: "Deployments, services, and ingress.",
      },
      {
        level: "intermediate",
        title: "Monitoring and logging",
        description: "Prometheus, Grafana, and alerting.",
      },
      {
        level: "advanced",
        title: "Reliability engineering",
        description: "SLI/SLOs, error budgets, and incident response.",
      },
      {
        level: "advanced",
        title: "Security hardening",
        description: "Least privilege, secrets rotation, and audits.",
      },
      {
        level: "advanced",
        title: "Scaling strategies",
        description: "Auto-scaling, cost optimization, and capacity planning.",
      },
      {
        level: "advanced",
        title: "Runbooks and operational readiness",
        description: "Playbooks, rollback plans, and postmortems.",
      },
    ],
  },
  {
    careerSlug: "data-analyst",
    role: "Data Analyst",
    title: "Data Analyst Roadmap",
    description: "Turn raw data into insights and stakeholder-ready reports.",
    steps: [
      {
        level: "beginner",
        title: "SQL fundamentals",
        description: "SELECT, JOIN, GROUP BY, and filtering.",
      },
      {
        level: "beginner",
        title: "Spreadsheet proficiency",
        description: "Pivot tables, formulas, and data cleaning.",
      },
      {
        level: "beginner",
        title: "Data cleaning basics",
        description: "Handle missing data and standardize formats.",
      },
      {
        level: "beginner",
        title: "Intro to statistics",
        description: "Distributions, variance, and correlation.",
      },
      {
        level: "intermediate",
        title: "BI tools",
        description: "Power BI or Tableau dashboards and filters.",
      },
      {
        level: "intermediate",
        title: "Data visualization principles",
        description: "Chart selection and storytelling with data.",
      },
      {
        level: "intermediate",
        title: "Experimentation basics",
        description: "A/B testing and hypothesis framing.",
      },
      {
        level: "intermediate",
        title: "Python for analysis",
        description: "Pandas, numpy, and notebooks.",
      },
      {
        level: "advanced",
        title: "Advanced SQL",
        description: "Window functions, CTEs, and performance tuning.",
      },
      {
        level: "advanced",
        title: "KPI design",
        description: "Metric definitions and guardrails.",
      },
      {
        level: "advanced",
        title: "Stakeholder communication",
        description: "Narrative framing and insight delivery.",
      },
      {
        level: "advanced",
        title: "ETL and data pipelines",
        description: "Ingestion, transformation, and scheduling basics.",
      },
    ],
  },
  {
    careerSlug: "ai-ml-engineer",
    role: "AI/ML Engineer",
    title: "AI/ML Engineer Roadmap",
    description: "Learn ML foundations, model training, and production deployment.",
    steps: [
      {
        level: "beginner",
        title: "Python for ML",
        description: "NumPy, pandas, and data manipulation.",
      },
      {
        level: "beginner",
        title: "Math foundations",
        description: "Linear algebra, probability, and statistics.",
      },
      {
        level: "beginner",
        title: "ML fundamentals",
        description: "Supervised vs unsupervised and model evaluation.",
      },
      {
        level: "beginner",
        title: "Data preparation",
        description: "Feature engineering and dataset splits.",
      },
      {
        level: "intermediate",
        title: "Model training workflows",
        description: "PyTorch or TensorFlow pipelines.",
      },
      {
        level: "intermediate",
        title: "Deep learning basics",
        description: "Neural networks, backprop, and tuning.",
      },
      {
        level: "intermediate",
        title: "Data pipelines",
        description: "Batching, validation, and versioning.",
      },
      {
        level: "intermediate",
        title: "Experiment tracking",
        description: "Metrics, runs, and reproducibility.",
      },
      {
        level: "advanced",
        title: "MLOps and model registry",
        description: "CI/CD for models and artifact management.",
      },
      {
        level: "advanced",
        title: "Deployment patterns",
        description: "Online APIs, batch inference, and canaries.",
      },
      {
        level: "advanced",
        title: "Monitoring and drift detection",
        description: "Data drift, model decay, and alerting.",
      },
      {
        level: "advanced",
        title: "Responsible AI",
        description: "Bias checks, privacy, and compliance.",
      },
    ],
  },
];
