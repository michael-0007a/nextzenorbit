const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('Seeding careers...');
  await supabase.from('careers').upsert([
    { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', title: 'Software Engineer', slug: 'software-engineer', description: 'Build the future of technology by designing and developing scalable software systems.', icon: 'Code2' },
    { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', title: 'Product Manager', slug: 'product-manager', description: 'Lead product vision, strategy, and execution to deliver user-centric solutions.', icon: 'Briefcase' }
  ]);

  console.log('Seeding roadmaps...');
  await supabase.from('roadmaps').upsert([
    { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', career_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', role: 'Software Engineer', title: 'Full Stack Developer Roadmap', description: 'A comprehensive guide to becoming a modern full stack developer.' },
    { id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', career_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', role: 'Product Manager', title: 'Product Manager Roadmap', description: 'Master the skills required to lead cross-functional product teams.' }
  ]);

  console.log('Seeding roadmap steps...');
  await supabase.from('roadmap_steps').upsert([
    { roadmap_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', title: 'Learn HTML, CSS & JS', description: 'Master the foundations of the web. Build responsive layouts and add interactivity.', order_index: 1, level: 'beginner' },
    { roadmap_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', title: 'React & Frontend Frameworks', description: 'Learn React, component lifecycles, hooks, and state management (Zustand, Redux).', order_index: 2, level: 'intermediate' },
    { roadmap_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', title: 'Backend & APIs', description: 'Build RESTful and GraphQL APIs using Node.js, Express, or Next.js Route Handlers.', order_index: 3, level: 'intermediate' },
    { roadmap_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', title: 'Databases & ORMs', description: 'Understand SQL (Postgres) and NoSQL (MongoDB). Use Prisma or Drizzle ORM.', order_index: 4, level: 'advanced' },
    { roadmap_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', title: 'System Design & Architecture', description: 'Learn about caching, message queues, microservices, and system scalability.', order_index: 5, level: 'advanced' },
    
    { roadmap_id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', title: 'Product Lifecycle', description: 'Understand the phases of product development: Ideation, Definition, Design, Build, Launch.', order_index: 1, level: 'beginner' },
    { roadmap_id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', title: 'User Research & Persona', description: 'Learn how to conduct user interviews, A/B testing, and gather customer feedback.', order_index: 2, level: 'intermediate' },
    { roadmap_id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', title: 'Agile & Scrum', description: 'Master story pointing, backlog grooming, sprint planning, and writing PRDs.', order_index: 3, level: 'intermediate' },
    { roadmap_id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', title: 'Go-to-Market Strategy', description: 'Develop pricing strategies, marketing plans, and product launch sequences.', order_index: 4, level: 'advanced' }
  ]);

  console.log('Seeding interview questions...');
  await supabase.from('interview_questions').upsert([
    { career_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', role: 'Software Engineer', company: 'Google', difficulty: 'hard', topic: 'Algorithms', question: 'Reverse a linked list.', answer: 'To reverse a linked list iteratively, use three pointers: prev (null), current (head), and next (null). Iterate through, setting next to current.next, current.next to prev, prev to current, and current to next. Finally, return prev.' },
    { career_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', role: 'Software Engineer', company: 'Amazon', difficulty: 'hard', topic: 'System Design', question: 'How would you design a URL shortener like TinyURL?', answer: 'Key components include: 1. A highly available API Gateway. 2. A Hash Function (e.g., base62 encoding of an auto-incrementing ID) to generate the short code. 3. A database (NoSQL/SQL) to map short codes to long URLs. 4. A distributed cache (Redis/Memcached) to store heavily accessed URLs for fast redirection.' },
    { career_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', role: 'Software Engineer', company: 'Generic', difficulty: 'easy', topic: 'React', question: 'Explain the difference between useEffect and useLayoutEffect.', answer: 'useEffect runs asynchronously after the render is committed to the screen. useLayoutEffect runs synchronously immediately after DOM mutations, blocking the browser paint. Use useLayoutEffect only when you need to measure the DOM before the user sees it (to prevent flickering).' },
    { career_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', role: 'Product Manager', company: 'Meta', difficulty: 'hard', topic: 'Product Sense', question: 'How would you improve Facebook Groups?', answer: '1. Clarify the goal (engagement vs monetization). 2. Identify user segments (Admins, Active Members, Lurkers). 3. Identify pain points (Admins struggle with spam, lurkers find it hard to discover content). 4. Propose solutions (AI-powered spam filters, personalized group onboarding). 5. Prioritize and define success metrics.' }
  ]);

  console.log('Done seeding!');
}

seed().catch(console.error);
