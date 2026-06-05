import type { SeedInterviewQuestion } from "../types";

export const interviewQuestions: SeedInterviewQuestion[] = [
  {
    careerSlug: "frontend-developer",
    role: "Frontend Developer",
    difficulty: "easy",
    topic: "React Hooks",
    question: "What problem do hooks solve and when would you use useEffect?",
    answer:
      "Hooks let you reuse stateful logic without classes. useEffect is used for side effects like data fetching, subscriptions, or manual DOM changes. It runs after render and should include a dependency array plus cleanup when needed.",
    company: "Flipkart",
  },
  {
    careerSlug: "frontend-developer",
    role: "Frontend Developer",
    difficulty: "medium",
    topic: "Performance",
    question: "How would you optimize rendering a large list in React?",
    answer:
      "Use list virtualization (react-window or react-virtualized), memoize row components, and avoid recreating inline props. Keep stable keys and consider pagination or infinite scroll to limit DOM size.",
    company: "Swiggy",
  },
  {
    careerSlug: "frontend-developer",
    role: "Frontend Developer",
    difficulty: "easy",
    topic: "CSS Layout",
    question: "When would you use CSS Grid over Flexbox?",
    answer:
      "Grid is best for two-dimensional layouts with rows and columns, while Flexbox is ideal for one-dimensional alignment. Use Grid for page or section layout and Flexbox inside components.",
  },
  {
    careerSlug: "frontend-developer",
    role: "Frontend Developer",
    difficulty: "medium",
    topic: "Accessibility",
    question: "What are ARIA roles and when should you use them?",
    answer:
      "ARIA roles describe custom interactive elements for assistive technology. Prefer semantic HTML first; add ARIA only for custom controls and ensure keyboard behavior matches the role.",
  },
  {
    careerSlug: "frontend-developer",
    role: "Frontend Developer",
    difficulty: "hard",
    topic: "Next.js",
    question: "How does caching work in the Next.js App Router and how do you opt out?",
    answer:
      "Server components cache fetches by default. Use fetch options like cache: \"no-store\" or revalidate: 0, or set segment config dynamic = \"force-dynamic\" to disable caching for a route.",
    company: "Vercel",
  },
  {
    careerSlug: "frontend-developer",
    role: "Frontend Developer",
    difficulty: "medium",
    topic: "State Management",
    question: "When would you use a server-state library instead of global client state?",
    answer:
      "Server-state libraries handle caching, deduping, retries, and background refresh for API data. Use them for remote data and keep global state for UI-only or cross-component local state.",
  },
  {
    careerSlug: "backend-developer",
    role: "Backend Developer",
    difficulty: "easy",
    topic: "HTTP",
    question: "What is the difference between PUT and PATCH?",
    answer:
      "PUT replaces the entire resource representation, while PATCH applies a partial update. PUT should be idempotent; PATCH is often idempotent but only updates specified fields.",
  },
  {
    careerSlug: "backend-developer",
    role: "Backend Developer",
    difficulty: "medium",
    topic: "Database Indexes",
    question: "How do indexes speed up queries and what are the tradeoffs?",
    answer:
      "Indexes use data structures like B-trees to locate rows faster. They improve read performance but add storage overhead and slow down writes, so index only critical query paths.",
  },
  {
    careerSlug: "backend-developer",
    role: "Backend Developer",
    difficulty: "medium",
    topic: "Transactions",
    question: "Explain ACID and give an example where you need a transaction.",
    answer:
      "ACID ensures atomicity, consistency, isolation, and durability. A money transfer needs a transaction so the debit and credit succeed together or roll back.",
  },
  {
    careerSlug: "backend-developer",
    role: "Backend Developer",
    difficulty: "hard",
    topic: "Caching",
    question: "How would you design cache invalidation for user profile updates?",
    answer:
      "Use a cache-aside or write-through strategy with TTLs. On update, invalidate or update the cached key and include versioning to prevent stale reads in distributed systems.",
    company: "Razorpay",
  },
  {
    careerSlug: "backend-developer",
    role: "Backend Developer",
    difficulty: "medium",
    topic: "Idempotency",
    question: "How do you make a POST endpoint idempotent?",
    answer:
      "Accept an idempotency key, store the result with that key, and return the same response on retries. This prevents duplicate side effects in case of network failures.",
  },
  {
    careerSlug: "backend-developer",
    role: "Backend Developer",
    difficulty: "hard",
    topic: "Rate Limiting",
    question: "Design a rate limiter for an API.",
    answer:
      "Use a token bucket or sliding window algorithm backed by Redis. Track requests per user or IP and return 429 with retry headers when limits are exceeded.",
    company: "Amazon",
  },
  {
    careerSlug: "devops-engineer",
    role: "DevOps Engineer",
    difficulty: "easy",
    topic: "CI/CD",
    question: "What is the difference between CI and CD?",
    answer:
      "CI automates build and test on every change. CD automates delivery or deployment to environments, either with manual approval or fully automated releases.",
  },
  {
    careerSlug: "devops-engineer",
    role: "DevOps Engineer",
    difficulty: "medium",
    topic: "Containers",
    question: "How is a container different from a virtual machine?",
    answer:
      "Containers share the host OS kernel and isolate processes, making them lightweight and fast. VMs include a full guest OS, providing stronger isolation but higher overhead.",
  },
  {
    careerSlug: "devops-engineer",
    role: "DevOps Engineer",
    difficulty: "medium",
    topic: "Kubernetes",
    question: "What are readiness and liveness probes?",
    answer:
      "Readiness probes decide when a pod can receive traffic. Liveness probes decide when a pod should be restarted. Together they improve availability and safe rollouts.",
  },
  {
    careerSlug: "devops-engineer",
    role: "DevOps Engineer",
    difficulty: "hard",
    topic: "Observability",
    question: "How would you monitor a microservices system?",
    answer:
      "Use centralized logs, metrics, and distributed tracing. Define SLOs, alert on error budgets, and correlate requests with trace IDs for faster diagnosis.",
  },
  {
    careerSlug: "devops-engineer",
    role: "DevOps Engineer",
    difficulty: "medium",
    topic: "Infrastructure as Code",
    question: "Why use Terraform modules and state locking?",
    answer:
      "Modules standardize and reuse infrastructure patterns. State locking prevents concurrent changes from corrupting state and ensures consistent deployments.",
  },
  {
    careerSlug: "devops-engineer",
    role: "DevOps Engineer",
    difficulty: "hard",
    topic: "Incident Response",
    question: "Walk through how you would handle a production outage.",
    answer:
      "Triage impact, mitigate quickly with rollback or failover, and communicate status. After recovery, run a root-cause analysis and update runbooks to prevent recurrence.",
  },
  {
    careerSlug: "ai-ml-engineer",
    role: "AI/ML Engineer",
    difficulty: "easy",
    topic: "Overfitting",
    question: "What is overfitting and how do you prevent it?",
    answer:
      "Overfitting occurs when a model learns noise and performs poorly on new data. Prevent it with regularization, more data, cross-validation, and early stopping.",
  },
  {
    careerSlug: "ai-ml-engineer",
    role: "AI/ML Engineer",
    difficulty: "medium",
    topic: "Evaluation",
    question: "When would you use precision and recall instead of accuracy?",
    answer:
      "When classes are imbalanced or false positives and false negatives have different costs, precision and recall provide a more meaningful evaluation than accuracy.",
  },
  {
    careerSlug: "ai-ml-engineer",
    role: "AI/ML Engineer",
    difficulty: "medium",
    topic: "Feature Scaling",
    question: "Why scale features for gradient-based models?",
    answer:
      "Scaling prevents features with large ranges from dominating gradients and improves convergence for models like logistic regression and neural networks.",
  },
  {
    careerSlug: "ai-ml-engineer",
    role: "AI/ML Engineer",
    difficulty: "hard",
    topic: "Deployment",
    question: "How do you roll out a new model safely?",
    answer:
      "Use shadow or canary deployments, compare metrics against the current model, and gradually shift traffic. Keep model versioning and rollback paths ready.",
  },
  {
    careerSlug: "ai-ml-engineer",
    role: "AI/ML Engineer",
    difficulty: "hard",
    topic: "Data Drift",
    question: "What is data drift and how would you detect it?",
    answer:
      "Data drift is when input distributions change over time. Detect it with statistical tests, feature distribution monitoring, and alerts on divergence.",
  },
  {
    careerSlug: "ai-ml-engineer",
    role: "AI/ML Engineer",
    difficulty: "medium",
    topic: "RAG vs Fine-Tuning",
    question: "Explain the difference between fine-tuning and RAG.",
    answer:
      "Fine-tuning updates model weights to learn patterns, while RAG keeps the model fixed and retrieves external context at inference. RAG is faster to update and better for dynamic knowledge.",
  },
];
