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
  {
    careerSlug: "software-engineer",
    role: "Software Engineer",
    title: "Software Engineering Mastery",
    description: "From programming basics to architecting large-scale systems.",
    steps: [
      { level: "beginner", title: "Mastering Data Structures & Algorithms", description: "Arrays, LinkedLists, Trees, and Sorting." },
      { level: "beginner", title: "Version Control & Git", description: "Branching, Merging, and Collaboration." },
      { level: "intermediate", title: "System Design Patterns", description: "Learn MVC, Factory, Singleton, and Observer patterns." },
      { level: "advanced", title: "Scalability and Microservices", description: "Design systems that handle millions of requests." },
    ]
  },
  {
    careerSlug: "product-manager",
    role: "Product Manager",
    title: "Product Management Roadmap",
    description: "Learn to build, launch, and scale successful products.",
    steps: [
      { level: "beginner", title: "Foundations of Product Strategy", description: "Market research and competitive analysis." },
      { level: "intermediate", title: "Roadmap Planning & Agile", description: "Backlog management and sprint planning." },
      { level: "advanced", title: "Growth & Product-Led Growth (PLG)", description: "Metrics, retention, and scaling strategies." },
    ]
  },
  {
    careerSlug: "data-scientist",
    role: "Data Scientist",
    title: "Data Science Specialization",
    description: "Statistical modeling, Machine Learning, and Data Engineering.",
    steps: [
      { level: "beginner", title: "Python for Data Science", description: "NumPy, Pandas, and Matplotlib." },
      { level: "intermediate", title: "Statistical Modeling", description: "Regression, Hypothesis Testing, and probability." },
      { level: "advanced", title: "Deep Learning & Neural Networks", description: "PyTorch, TensorFlow, and Large Language Models." },
    ]
  },
  {
    careerSlug: "ux-ui-designer",
    role: "UX/UI Designer",
    title: "UX/UI Design Path",
    description: "Design user-centric products with modern design tools.",
    steps: [
      { level: "beginner", title: "Design Principles & Typography", description: "Color theory, layout, and visual hierarchy." },
      { level: "intermediate", title: "Prototyping with Figma", description: "Interactive components and design systems." },
      { level: "advanced", title: "User Research & Testing", description: "Usability studies and journey mapping." },
    ]
  },
  {
    careerSlug: "cybersecurity-analyst",
    role: "Cybersecurity Analyst",
    title: "Security Roadmap",
    description: "Secure infrastructure and protect data integrity.",
    steps: [
      { level: "beginner", title: "Networking Fundamentals", description: "TCP/IP, DNS, and HTTP security." },
      { level: "intermediate", title: "Ethical Hacking & PenTesting", description: "Vulnerability analysis and exploit tools." },
      { level: "advanced", title: "Security Ops (SecOps)", description: "Incident response and cloud security." },
    ]
  },
  {
    careerSlug: "cloud-architect",
    role: "Cloud Architect",
    title: "Cloud Infrastructure Roadmap",
    description: "Design and manage hybrid/multi-cloud systems.",
    steps: [
      { level: "beginner", title: "Cloud Fundamentals (AWS/Azure)", description: "VPC, IAM, and Compute services." },
      { level: "intermediate", title: "Infrastructure as Code (IaC)", description: "Terraform, CloudFormation, and Pulumi." },
      { level: "advanced", title: "Cloud Optimization", description: "Cost management and high availability." },
    ]
  },
  {
    careerSlug: "mobile-app-developer",
    role: "Mobile App Developer",
    title: "Mobile Development Path",
    description: "Build native and cross-platform apps.",
    steps: [
      { level: "beginner", title: "React Native / Flutter Basics", description: "Components, styles, and navigation." },
      { level: "intermediate", title: "State Management in Mobile", description: "Redux, MobX, or Provider patterns." },
      { level: "advanced", title: "App Store Deployment", description: "CI/CD for iOS and Android." },
    ]
  },
  {
    careerSlug: "blockchain-developer",
    role: "Blockchain Developer",
    title: "Web3/Blockchain Roadmap",
    description: "Build decentralized apps and smart contracts.",
    steps: [
      { level: "beginner", title: "Smart Contract Basics (Solidity)", description: "Ethereum, tokens, and storage." },
      { level: "intermediate", title: "DeFi & NFT Platforms", description: "Protocols and marketplace architecture." },
      { level: "advanced", title: "ZK-Proofs & Scaling", description: "Layer 2 solutions and privacy algorithms." },
    ]
  },
  {
    careerSlug: "machine-learning-engineer",
    role: "Machine Learning Engineer",
    title: "Machine Learning Path",
    description: "Build and deploy production-grade ML models.",
    steps: [
      { level: "beginner", title: "Math & Statistics for ML", description: "Linear algebra, calculus, and probability." },
      { level: "intermediate", title: "MLOps Fundamentals", description: "Pipeline automation and model monitoring." },
      { level: "advanced", title: "System Scale ML", description: "Distributed training and low-latency serving." },
    ]
  },
  {
    careerSlug: "database-administrator",
    role: "Database Administrator",
    title: "DBA Roadmap",
    description: "Master database performance and reliability.",
    steps: [
      { level: "beginner", title: "SQL & Relational Models", description: "PostgreSQL, MySQL, and normalization." },
      { level: "intermediate", title: "Performance Tuning", description: "Indexing, partitioning, and vacuuming." },
      { level: "advanced", title: "Disaster Recovery", description: "Replication and automated backups." },
    ]
  },
  {
    careerSlug: "financial-analyst",
    role: "Financial Analyst",
    title: "Finance & Analytics Path",
    description: "Analyze financial data and business performance.",
    steps: [
      { level: "beginner", title: "Financial Modeling in Excel", description: "Forecasting and valuation models." },
      { level: "intermediate", title: "Corporate Finance", description: "Capital budgeting and risk management." },
      { level: "advanced", title: "SQL for Finance", description: "Analyzing large transactional datasets." },
    ]
  },
  {
    careerSlug: "marketing-manager",
    role: "Marketing Manager",
    title: "Marketing Strategy Path",
    description: "Lead growth through strategic marketing.",
    steps: [
      { level: "beginner", title: "Digital Marketing Basics", description: "SEO, SEM, and social media media." },
      { level: "intermediate", title: "Performance Marketing", description: "Conversion tracking and data analysis." },
      { level: "advanced", title: "Brand Management", description: "Building long-term brand equity." },
    ]
  },
  {
    careerSlug: "sales-representative",
    role: "Sales Representative",
    title: "Sales Mastery Roadmap",
    description: "Master the art of closing and relationship management.",
    steps: [
      { level: "beginner", title: "Communication Skills", description: "Active listening and persuasion." },
      { level: "intermediate", title: "CRM & Pipeline Management", description: "Salesforce/HubSpot workflows." },
      { level: "advanced", title: "Consultative Selling", description: "Selling solutions to complex problems." },
    ]
  },
  {
    careerSlug: "human-resources-manager",
    role: "HR Manager",
    title: "HR Leadership Roadmap",
    description: "Build and manage world-class teams.",
    steps: [
      { level: "beginner", title: "Talent Acquisition", description: "Sourcing and interviewing best practices." },
      { level: "intermediate", title: "Organizational Development", description: "Culture, values, and team structures." },
      { level: "advanced", title: "Strategic HR Planning", description: "Workforce forecasting and talent retention." },
    ]
  },
  {
    careerSlug: "registered-nurse",
    role: "Registered Nurse",
    title: "Nursing Excellence Path",
    description: "Clinical expertise and patient care management.",
    steps: [
      { level: "beginner", title: "Foundations of Nursing", description: "Clinical skills and patient safety." },
      { level: "intermediate", title: "Specialized Care", description: "ICU, ER, or pediatric specialties." },
      { level: "advanced", title: "Clinical Leadership", description: "Charge nurse and care coordination." },
    ]
  },
  {
    careerSlug: "pharmacist",
    role: "Pharmacist",
    title: "Pharmaceutical Mastery",
    description: "Manage clinical outcomes through medication.",
    steps: [
      { level: "beginner", title: "Pharmacology Foundations", description: "Drug interactions and thermodynamics." },
      { level: "intermediate", title: "Clinical Pharmacy", description: "Patient counseling and therapy management." },
      { level: "advanced", title: "Pharmacy Management", description: "Regulatory compliance and operations." },
    ]
  },
  {
    careerSlug: "biomedical-engineer",
    role: "Biomedical Engineer",
    title: "Biomedical Engineering Path",
    description: "Innovate at the intersection of biology and engineering.",
    steps: [
      { level: "beginner", title: "Bio-instrumentation", description: "Design sensors and diagnostic tools." },
      { level: "intermediate", title: "Biomaterials", description: "Compatibility for implants and prosthesis." },
      { level: "advanced", title: "Medical Device Regulatory", description: "FDA compliance and clinical trials." },
    ]
  },
  {
    careerSlug: "physical-therapist",
    role: "Physical Therapist",
    title: "Rehabilitation Path",
    description: "Restore function and manage pain.",
    steps: [
      { level: "beginner", title: "Anatomy & Kinesiology", description: "Understanding human movement." },
      { level: "intermediate", title: "Therapeutic Exercise", description: "Designing rehab programs." },
      { level: "advanced", title: "Manual Therapy Specialties", description: "Advanced clinical reasoning." },
    ]
  },
  {
    careerSlug: "graphic-designer",
    role: "Graphic Designer",
    title: "Graphic Design Journey",
    description: "Create visual identities and communications.",
    steps: [
      { level: "beginner", title: "Adobe Suite Mastery", description: "Photoshop, Illustrator, and InDesign." },
      { level: "intermediate", title: "Brand Identity Design", description: "Logo systems and guidelines." },
      { level: "advanced", title: "Motion Graphics", description: "Animation with After Effects." },
    ]
  },
  {
    careerSlug: "copywriter",
    role: "Copywriter",
    title: "Copywriting Mastery",
    description: "Persuade and inform through writing.",
    steps: [
      { level: "beginner", title: "Copywriting Fundamentals", description: "Headlines, CTAs, and storytelling." },
      { level: "intermediate", title: "Content Strategy", description: "SEO and campaign alignment." },
      { level: "advanced", title: "Brand Narrative", description: "Shaping brand voice and tone." },
    ]
  },
  {
    careerSlug: "video-editor",
    role: "Video Editor",
    title: "Video Production Path",
    description: "Edit professional-grade video content.",
    steps: [
      { level: "beginner", title: "Editing basics (Premiere)", description: "Cuts, transitions, and pacing." },
      { level: "intermediate", title: "Color Grading & Audio", description: "Advanced post-production techniques." },
      { level: "advanced", title: "Special Effects & Motion", description: "VFX and advanced storytelling." },
    ]
  },
  {
    careerSlug: "architect-building",
    role: "Architect",
    title: "Architecture Roadmap",
    description: "Design and build sustainable structures.",
    steps: [
      { level: "beginner", title: "Drafting & Modeling", description: "AutoCAD, Revit, and Rhino basics." },
      { level: "intermediate", title: "Building Codes & Ethics", description: "Sustainability and safety standards." },
      { level: "advanced", title: "Project Management", description: "Leading design-to-build workflows." },
    ]
  },
  {
    careerSlug: "corporate-lawyer",
    role: "Corporate Lawyer",
    title: "Legal Mastery Path",
    description: "Navigate business law and regulations.",
    steps: [
      { level: "beginner", title: "Contract Law Foundations", description: "Drafting and reviewing agreements." },
      { level: "intermediate", title: "M&A Transactions", description: "Mergers, acquisitions, and due diligence." },
      { level: "advanced", title: "Corporate Governance", description: "Compliance and board relations." },
    ]
  },
  {
    careerSlug: "high-school-teacher",
    role: "High School Teacher",
    title: "Teaching Mastery Path",
    description: "Educate and mentor future generations.",
    steps: [
      { level: "beginner", title: "Curriculum Design", description: "Planning lessons and objectives." },
      { level: "intermediate", title: "Classroom Management", description: "Student engagement and support." },
      { level: "advanced", title: "Educational Leadership", description: "Department head and mentoring." },
    ]
  },
  {
    careerSlug: "commercial-pilot",
    role: "Commercial Pilot",
    title: "Aviation Career Path",
    description: "Master flight operations and safety.",
    steps: [
      { level: "beginner", title: "Flight Foundations", description: "Navigation, meteorology, and aerodynamics." },
      { level: "intermediate", title: "Instrument Rating", description: "Flying via instruments and radar." },
      { level: "advanced", title: "Commercial Certification", description: "Multi-engine and commercial rules." },
    ]
  },
  {
    careerSlug: "mechanical-engineer",
    role: "Mechanical Engineer",
    title: "Mechanical Systems Path",
    description: "Innovate through hardware and systems.",
    steps: [
      { level: "beginner", title: "CAD Modeling", description: "SolidWorks and mechanical drafting." },
      { level: "intermediate", title: "Thermodynamics & Stress", description: "Materials science and thermal systems." },
      { level: "advanced", title: "Robotics & Automation", description: "Mechatronics and smart manufacturing." },
    ]
  },
  {
    careerSlug: "real-estate-agent",
    role: "Real Estate Agent",
    title: "Real Estate Mastery",
    description: "Build a high-performance property career.",
    steps: [
      { level: "beginner", title: "Market Fundamentals", description: "Valuation and property laws." },
      { level: "intermediate", title: "Negotiation & Sales", description: "Closing deals and building pipelines." },
      { level: "advanced", title: "Real Estate Investment", description: "Managing portfolios and developments." },
    ]
  },
];
