
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('Seeding extended careers...');
  await supabase.from('careers').upsert([
    { id: '10000000-0000-0000-0000-000000000001', title: 'Data Scientist', slug: 'data-scientist', description: 'Analyze complex data to help companies make better decisions using machine learning.', icon: 'Database' },
    { id: '10000000-0000-0000-0000-000000000002', title: 'UX/UI Designer', slug: 'ux-ui-designer', description: 'Create intuitive, accessible, and beautiful user experiences for digital products.', icon: 'PenTool' },
    { id: '10000000-0000-0000-0000-000000000003', title: 'Frontend Developer', slug: 'frontend-developer', description: 'Build visually stunning and highly interactive user interfaces for the web.', icon: 'Layout' },
    { id: '10000000-0000-0000-0000-000000000004', title: 'DevOps Engineer', slug: 'devops-engineer', description: 'Bridge the gap between development and operations through automation and CI/CD.', icon: 'Terminal' },
    { id: '10000000-0000-0000-0000-000000000005', title: 'Cybersecurity Analyst', slug: 'cybersecurity-analyst', description: 'Protect IT infrastructure, networks, and data from cyber attacks and breaches.', icon: 'Shield' }
  ]);

  console.log('Seeding extended roadmaps...');
  await supabase.from('roadmaps').upsert([
    { id: '20000000-0000-0000-0000-000000000001', career_id: '10000000-0000-0000-0000-000000000001', role: 'Data Scientist', title: 'Data Science & ML Roadmap', description: 'A comprehensive path from data wrangling to deep learning.' },
    { id: '20000000-0000-0000-0000-000000000002', career_id: '10000000-0000-0000-0000-000000000002', role: 'UX/UI Designer', title: 'Product Design Roadmap', description: 'Master Figma, user research, and interaction design.' },
    { id: '20000000-0000-0000-0000-000000000003', career_id: '10000000-0000-0000-0000-000000000003', role: 'Frontend Developer', title: 'Modern Frontend Engineering', description: 'From HTML/CSS basics to advanced React and performance optimization.' },
    { id: '20000000-0000-0000-0000-000000000004', career_id: '10000000-0000-0000-0000-000000000004', role: 'DevOps Engineer', title: 'Cloud & Infrastructure Roadmap', description: 'Master Docker, Kubernetes, AWS, and CI/CD pipelines.' },
    { id: '20000000-0000-0000-0000-000000000005', career_id: '10000000-0000-0000-0000-000000000005', role: 'Cybersecurity Analyst', title: 'Security & Penetration Testing', description: 'Learn network security, ethical hacking, and incident response.' }
  ]);

  console.log('Seeding extended roadmap steps...');
  await supabase.from('roadmap_steps').upsert([
    // Data Scientist
    { roadmap_id: '20000000-0000-0000-0000-000000000001', title: 'Python & Statistics', description: 'Learn Python fundamentals, Pandas, NumPy, and core statistical concepts (probability, distributions).', order_index: 1, level: 'beginner' },
    { roadmap_id: '20000000-0000-0000-0000-000000000001', title: 'Data Wrangling & EDA', description: 'Master Exploratory Data Analysis. Learn to clean, transform, and visualize data using Matplotlib and Seaborn.', order_index: 2, level: 'intermediate' },
    { roadmap_id: '20000000-0000-0000-0000-000000000001', title: 'Machine Learning', description: 'Understand supervised and unsupervised learning algorithms (Linear Regression, Random Forests, K-Means) using Scikit-Learn.', order_index: 3, level: 'intermediate' },
    { roadmap_id: '20000000-0000-0000-0000-000000000001', title: 'Deep Learning & NLP', description: 'Build neural networks using PyTorch or TensorFlow. Learn about CNNs, RNNs, and Transformers.', order_index: 4, level: 'advanced' },
    { roadmap_id: '20000000-0000-0000-0000-000000000001', title: 'MLOps & Deployment', description: 'Learn how to deploy models into production using Docker, MLflow, and cloud platforms like AWS SageMaker.', order_index: 5, level: 'advanced' },

    // UX/UI Designer
    { roadmap_id: '20000000-0000-0000-0000-000000000002', title: 'Design Fundamentals', description: 'Understand color theory, typography, spacing, and the principles of visual hierarchy.', order_index: 1, level: 'beginner' },
    { roadmap_id: '20000000-0000-0000-0000-000000000002', title: 'Figma & Prototyping', description: 'Master Figma tools, auto-layout, components, and create interactive prototypes.', order_index: 2, level: 'intermediate' },
    { roadmap_id: '20000000-0000-0000-0000-000000000002', title: 'User Research', description: 'Conduct user interviews, create personas, and perform usability testing to gather actionable feedback.', order_index: 3, level: 'intermediate' },
    { roadmap_id: '20000000-0000-0000-0000-000000000002', title: 'Design Systems', description: 'Build scalable design systems with design tokens, component libraries, and documentation.', order_index: 4, level: 'advanced' },

    // Frontend Developer
    { roadmap_id: '20000000-0000-0000-0000-000000000003', title: 'HTML, CSS & JS Basics', description: 'Master DOM manipulation, semantic HTML, and CSS Flexbox/Grid layouts.', order_index: 1, level: 'beginner' },
    { roadmap_id: '20000000-0000-0000-0000-000000000003', title: 'React & State Management', description: 'Learn React hooks, functional components, context API, and tools like Redux or Zustand.', order_index: 2, level: 'intermediate' },
    { roadmap_id: '20000000-0000-0000-0000-000000000003', title: 'Next.js & SSR', description: 'Understand Server-Side Rendering, Static Site Generation, and Next.js App Router.', order_index: 3, level: 'intermediate' },
    { roadmap_id: '20000000-0000-0000-0000-000000000003', title: 'Performance & Testing', description: 'Optimize Core Web Vitals, implement lazy loading, and write tests using Jest and Cypress.', order_index: 4, level: 'advanced' },

    // DevOps
    { roadmap_id: '20000000-0000-0000-0000-000000000004', title: 'Linux & Scripting', description: 'Master the Linux command line, Bash scripting, and basic networking concepts.', order_index: 1, level: 'beginner' },
    { roadmap_id: '20000000-0000-0000-0000-000000000004', title: 'Docker & Containers', description: 'Learn containerization, writing Dockerfiles, and managing multi-container apps with Docker Compose.', order_index: 2, level: 'intermediate' },
    { roadmap_id: '20000000-0000-0000-0000-000000000004', title: 'CI/CD Pipelines', description: 'Automate testing and deployment using GitHub Actions, GitLab CI, or Jenkins.', order_index: 3, level: 'intermediate' },
    { roadmap_id: '20000000-0000-0000-0000-000000000004', title: 'Infrastructure as Code', description: 'Provision and manage cloud resources (AWS/GCP) using Terraform or Ansible.', order_index: 4, level: 'advanced' },
    { roadmap_id: '20000000-0000-0000-0000-000000000004', title: 'Kubernetes & Monitoring', description: 'Deploy applications on Kubernetes clusters. Set up monitoring with Prometheus and Grafana.', order_index: 5, level: 'advanced' },

    // Cybersecurity
    { roadmap_id: '20000000-0000-0000-0000-000000000005', title: 'Networking & OS Basics', description: 'Understand TCP/IP, DNS, HTTP, firewalls, and operating system internals.', order_index: 1, level: 'beginner' },
    { roadmap_id: '20000000-0000-0000-0000-000000000005', title: 'Security Principles', description: 'Learn about cryptography, hashing, access controls, and the CIA triad.', order_index: 2, level: 'intermediate' },
    { roadmap_id: '20000000-0000-0000-0000-000000000005', title: 'Vulnerability Assessment', description: 'Use tools like Nmap and Wireshark to scan networks and identify vulnerabilities.', order_index: 3, level: 'intermediate' },
    { roadmap_id: '20000000-0000-0000-0000-000000000005', title: 'Ethical Hacking (Pentesting)', description: 'Exploit vulnerabilities using Metasploit. Understand OWASP Top 10 web vulnerabilities.', order_index: 4, level: 'advanced' },
    { roadmap_id: '20000000-0000-0000-0000-000000000005', title: 'Incident Response', description: 'Learn how to detect, contain, and recover from security breaches. Analyze malware and logs.', order_index: 5, level: 'advanced' }
  ]);

  console.log('Seeding extended interview questions...');
  await supabase.from('interview_questions').upsert([
    // Data Scientist
    { career_id: '10000000-0000-0000-0000-000000000001', role: 'Data Scientist', company: 'Netflix', difficulty: 'hard', topic: 'Machine Learning', question: 'Explain the Bias-Variance tradeoff.', answer: 'Bias is the error from erroneous assumptions in the learning algorithm (high bias = underfitting). Variance is the error from sensitivity to small fluctuations in the training set (high variance = overfitting). The goal is to find the optimal complexity that minimizes the total error (Bias + Variance + Irreducible Error).' },
    { career_id: '10000000-0000-0000-0000-000000000001', role: 'Data Scientist', company: 'Generic', difficulty: 'intermediate', topic: 'Statistics', question: 'What is a p-value?', answer: 'A p-value is the probability of observing results at least as extreme as those measured when the null hypothesis is true. A lower p-value (typically < 0.05) indicates strong evidence against the null hypothesis, leading to its rejection.' },
    
    // UX Designer
    { career_id: '10000000-0000-0000-0000-000000000002', role: 'UX/UI Designer', company: 'Airbnb', difficulty: 'intermediate', topic: 'Design Process', question: 'How do you balance user needs with business goals?', answer: 'I start by clearly defining both user pain points and business KPIs. Then, I look for intersecting solutions where solving the user\'s problem directly drives the business metric (e.g., simplifying checkout reduces user friction and increases conversion rate). I validate this through A/B testing.' },
    
    // Frontend
    { career_id: '10000000-0000-0000-0000-000000000003', role: 'Frontend Developer', company: 'Vercel', difficulty: 'hard', topic: 'React', question: 'How does React\'s Virtual DOM work and why is it fast?', answer: 'The Virtual DOM is a lightweight JavaScript representation of the actual DOM. When state changes, React creates a new Virtual DOM tree, compares it with the previous one (diffing), and calculates the minimum number of operations required to update the real DOM (reconciliation). This minimizes expensive layout reflows and repaints in the browser.' },
    
    // DevOps
    { career_id: '10000000-0000-0000-0000-000000000004', role: 'DevOps Engineer', company: 'Amazon', difficulty: 'hard', topic: 'Kubernetes', question: 'Explain the difference between a Deployment and a StatefulSet in Kubernetes.', answer: 'A Deployment manages stateless applications and ensures a specified number of identical pods are running. Pods are interchangeable. A StatefulSet is used for stateful applications (like databases) where each pod requires a unique, persistent identity, stable hostname, and ordered deployment/scaling.' },
    
    // Cybersecurity
    { career_id: '10000000-0000-0000-0000-000000000005', role: 'Cybersecurity Analyst', company: 'Generic', difficulty: 'intermediate', topic: 'Web Security', question: 'What is Cross-Site Scripting (XSS) and how do you prevent it?', answer: 'XSS occurs when an attacker injects malicious scripts into web pages viewed by other users. To prevent it, developers must sanitize and validate all user input, encode data before rendering it in the browser (e.g., using React\'s default escaping), and implement a strong Content Security Policy (CSP).' }
  ]);

  console.log('Done seeding extended roles!');
}

seed().catch(console.error);
