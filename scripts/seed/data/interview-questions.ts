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
  {
    careerSlug: "software-engineer",
    questions: [
      { question: "Explain the difference between a process and a thread.", answer: "A process is an independent execution unit with its own memory space, while a thread is a subset of a process sharing the same memory space." },
      { question: "What is Big O notation?", answer: "Big O notation describes the complexity of an algorithm in terms of time or space as the input size grows." },
    ]
  },
  {
    careerSlug: "product-manager",
    questions: [
      { question: "How do you prioritize a product backlog?", answer: "I use frameworks like RICE (Reach, Impact, Confidence, Effort) or MoSCoW to align with strategic goals." },
      { question: "Tell me about a time a product failed.", answer: "Discuss the metrics, why it didn't meet goals, and the lessons learned for future iterations." },
    ]
  },
  {
    careerSlug: "data-scientist",
    questions: [
      { question: "What is overfitting?", answer: "Overfitting occurs when a model learns the noise in the training data rather than the signal, leading to poor generalization." },
      { question: "Explain the Central Limit Theorem.", answer: "It states that the distribution of sample means will be approximately normal regardless of the population distribution, given a large enough sample size." },
    ]
  },
  {
    careerSlug: "ux-ui-designer",
    questions: [
      { question: "What is your design process?", answer: "Usually involves discovery, research, ideation, prototyping, and testing." },
      { question: "How do you handle negative feedback on a design?", answer: "Focus on the goals and user needs rather than personal preference, and use it as data for improvement." },
    ]
  },
  {
    careerSlug: "cybersecurity-analyst",
    questions: [
      { question: "What is a DDoS attack?", answer: "A Distributed Denial of Service attack attempts to make an online service unavailable by overwhelming it with traffic from multiple sources." },
      { question: "Explain Salting in password hashing.", answer: "Salting involves adding unique random data to each password before hashing to protect against rainbow table attacks." },
    ]
  },
  {
    careerSlug: "cloud-architect",
    questions: [
      { question: "What are the benefits of Serverless architecture?", answer: "Reduced operational overhead, automatic scaling, and pay-per-use billing." },
      { question: "Explain High Availability (HA).", answer: "Designing a system to ensure a pre-agreed level of operational performance, usually through redundancy." },
    ]
  },
  {
    careerSlug: "mobile-app-developer",
    questions: [
      { question: "What is React Native?", answer: "A framework for building native apps using React and JavaScript." },
      { question: "Explain the app lifecycle and state.", answer: "Foreground, background, and suspended states, and how to manage data persistence." },
    ]
  },
  {
    careerSlug: "blockchain-developer",
    questions: [
      { question: "What is a Smart Contract?", answer: "Self-executing contracts with the terms of the agreement directly written into code on the blockchain." },
      { question: "Explain Proof of Work vs Proof of Stake.", answer: "PoW requires computational work to validate transactions, while PoS selects validators based on the number of coins they hold." },
    ]
  },
  {
    careerSlug: "machine-learning-engineer",
    questions: [
      { question: "What is Gradient Descent?", answer: "An optimization algorithm used to minimize a loss function by iteratively moving toward the steepest descent." },
      { question: "Explain the difference between supervised and unsupervised learning.", answer: "Supervised learning uses labeled data to predict outcomes, while unsupervised learning finds patterns in unlabelled data." },
    ]
  },
  {
    careerSlug: "database-administrator",
    questions: [
      { question: "What is an index and why use it?", answer: "A data structure that improves the speed of data retrieval at the cost of slower writes and more storage." },
      { question: "Explain ACID properties.", answer: "Atomicity, Consistency, Isolation, and Durability - the core requirements for reliable database transactions." },
    ]
  },
  {
    careerSlug: "financial-analyst",
    questions: [
      { question: "What is WACC?", answer: "Weighted Average Cost of Capital represents the average rate a company pays to finance its assets." },
      { question: "How do you value a company?", answer: "Methods include DCF (Discounted Cash Flow), Comparable Company Analysis, and Precedent Transactions." },
    ]
  },
  {
    careerSlug: "marketing-manager",
    questions: [
      { question: "What is CAC and LTV?", answer: "Customer Acquisition Cost and Lifetime Value - critical metrics for measuring marketing ROI." },
      { question: "How do you measure campaign success?", answer: "KPIs like conversion rate, traffic, engagement, and incremental sales." },
    ]
  },
  {
    careerSlug: "sales-representative",
    questions: [
      { question: "How do you handle 'No'?", answer: "View it as a starting point for discovery, identifying the real blocker or timing issue." },
      { question: "Describe your sales process.", answer: "Prospecting, qualifying, presenting, handling objections, and closing." },
    ]
  },
  {
    careerSlug: "human-resources-manager",
    questions: [
      { question: "How do you resolve conflict between employees?", answer: "Mediating a conversation, focusing on facts and neutral solutions." },
      { question: "What makes a good company culture?", answer: "Transparency, growth opportunities, and psychological safety." },
    ]
  },
  {
    careerSlug: "registered-nurse",
    questions: [
      { question: "How do you prioritize care for multiple patients?", answer: "Triage based on acuity and immediate needs." },
      { question: "Dealing with a difficult patient/family member.", answer: "Active listening, empathy, and clear communication of care plans." },
    ]
  },
  {
    careerSlug: "pharmacist",
    questions: [
      { question: "How do you ensure medication safety?", answer: "Double-checking high-risk meds and counseling patients on interactions." },
      { question: "Dealing with insurance rejections.", answer: "Verifying coverage and offering alternatives or assistance programs." },
    ]
  },
  {
    careerSlug: "biomedical-engineer",
    questions: [
      { question: "What is biomimicry?", answer: "Designing materials or systems modeled on biological entities and processes." },
      { question: "Explain FDA Class I, II, III devices.", answer: "Risk-based classification for medical devices and their regulatory requirements." },
    ]
  },
  {
    careerSlug: "physical-therapist",
    questions: [
      { question: "How do you motivate a patient in pain?", answer: "Setting small, achievable goals and celebrating progress." },
      { question: "Manual therapy vs exercise therapy.", answer: "Using both in tandem for optimal functional recovery." },
    ]
  },
  {
    careerSlug: "graphic-designer",
    questions: [
      { question: "What is your favorite design style?", answer: "Discuss your aesthetic and why it works for specific use cases." },
      { question: "Explain the importance of typography.", answer: "It sets the tone and readability of the communication." },
    ]
  },
  {
    careerSlug: "copywriter",
    questions: [
      { question: "How do you write for different brand voices?", answer: "Developing a style guide and understanding the target audience." },
      { question: "Short-form vs long-form copy.", answer: "Conciseness for impact vs depth for authority and SEO." },
    ]
  },
  {
    careerSlug: "video-editor",
    questions: [
      { question: "What is a jump cut and when to use it?", answer: "A cut between two shots of the same subject that creates an effect of 'jumping' forward in time." },
      { question: "How do you manage large amounts of raw footage?", answer: "Organized folder structures, metadata tagging, and favoriting." },
    ]
  },
  {
    careerSlug: "architect-building",
    questions: [
      { question: "What is sustainable architecture?", answer: "Design that minimizes the negative environmental impact of buildings." },
      { question: "Balancing aesthetics with function.", answer: "Form follows function, but beauty is a functional requirement for human spaces." },
    ]
  },
  {
    careerSlug: "corporate-lawyer",
    questions: [
      { question: "What is due diligence?", answer: "Comprehensive appraisal of a business by a prospective buyer." },
      { question: "Explain fiduciary duty.", answer: "The legal obligation to act in the best interest of another party." },
    ]
  },
  {
    careerSlug: "high-school-teacher",
    questions: [
      { question: "How do you engage unmotivated students?", answer: "Finding their interests and connecting the subject matter to the real world." },
      { question: "Differentiation in the classroom.", answer: "Adapting teaching techniques to meet diverse learning needs." },
    ]
  },
  {
    careerSlug: "commercial-pilot",
    questions: [
      { question: "What is Crew Resource Management (CRM)?", answer: "Optimizing the human-machine interface and interpersonal communication in the cockpit." },
      { question: "Handling an emergency in flight.", answer: "Fly the plane, navigate, and communicate (Aviate, Navigate, Communicate)." },
    ]
  },
  {
    careerSlug: "mechanical-engineer",
    questions: [
      { question: "What is FMEA?", answer: "Failure Mode and Effects Analysis - identifying potential failure points in a design." },
      { question: "Explain the difference between stress and strain.", answer: "Stress is the force per unit area; strain is the deformation result." },
    ]
  },
  {
    careerSlug: "real-estate-agent",
    questions: [
      { question: "How do you find new clients?", answer: "Networking, referrals, marketing, and local market presence." },
      { question: "Handling a multi-offer situation.", answer: "Transparency, speed, and strategic advice for the client." },
    ]
  },
];
