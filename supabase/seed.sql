-- ============================================
-- Seed Data for Nextzen Orbit
-- Run with: npx supabase db reset (or push and then run this manually)
-- ============================================

-- 1. Insert Careers
INSERT INTO careers (id, title, slug, description, icon) 
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Software Engineer', 'software-engineer', 'Build the future of technology by designing and developing scalable software systems.', 'Code2'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Product Manager', 'product-manager', 'Lead product vision, strategy, and execution to deliver user-centric solutions.', 'Briefcase')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Roadmaps
INSERT INTO roadmaps (id, career_id, role, title, description) 
VALUES 
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Software Engineer', 'Full Stack Developer Roadmap', 'A comprehensive guide to becoming a modern full stack developer.'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Product Manager', 'Product Manager Roadmap', 'Master the skills required to lead cross-functional product teams.')
ON CONFLICT DO NOTHING;

-- 3. Insert Roadmap Steps (Software Engineer)
INSERT INTO roadmap_steps (roadmap_id, title, description, order_index, level)
VALUES
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Learn HTML, CSS & JS', 'Master the foundations of the web. Build responsive layouts and add interactivity.', 1, 'beginner'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'React & Frontend Frameworks', 'Learn React, component lifecycles, hooks, and state management (Zustand, Redux).', 2, 'intermediate'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Backend & APIs', 'Build RESTful and GraphQL APIs using Node.js, Express, or Next.js Route Handlers.', 3, 'intermediate'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Databases & ORMs', 'Understand SQL (Postgres) and NoSQL (MongoDB). Use Prisma or Drizzle ORM.', 4, 'advanced'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'System Design & Architecture', 'Learn about caching, message queues, microservices, and system scalability.', 5, 'advanced')
ON CONFLICT DO NOTHING;

-- 4. Insert Roadmap Steps (Product Manager)
INSERT INTO roadmap_steps (roadmap_id, title, description, order_index, level)
VALUES
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Product Lifecycle', 'Understand the phases of product development: Ideation, Definition, Design, Build, Launch.', 1, 'beginner'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'User Research & Persona', 'Learn how to conduct user interviews, A/B testing, and gather customer feedback.', 2, 'intermediate'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Agile & Scrum', 'Master story pointing, backlog grooming, sprint planning, and writing PRDs.', 3, 'intermediate'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Go-to-Market Strategy', 'Develop pricing strategies, marketing plans, and product launch sequences.', 4, 'advanced')
ON CONFLICT DO NOTHING;

-- 5. Insert Interview Questions
INSERT INTO interview_questions (career_id, role, company, difficulty, topic, question, answer)
VALUES
  -- SWE Questions
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Software Engineer', 'Google', 'Medium', 'Algorithms', 'Reverse a linked list.', 'To reverse a linked list iteratively, use three pointers: prev (null), current (head), and next (null). Iterate through, setting next to current.next, current.next to prev, prev to current, and current to next. Finally, return prev.'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Software Engineer', 'Amazon', 'Hard', 'System Design', 'How would you design a URL shortener like TinyURL?', 'Key components include: 1. A highly available API Gateway. 2. A Hash Function (e.g., base62 encoding of an auto-incrementing ID) to generate the short code. 3. A database (NoSQL/SQL) to map short codes to long URLs. 4. A distributed cache (Redis/Memcached) to store heavily accessed URLs for fast redirection.'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Software Engineer', 'Generic', 'Easy', 'React', 'Explain the difference between useEffect and useLayoutEffect.', 'useEffect runs asynchronously after the render is committed to the screen. useLayoutEffect runs synchronously immediately after DOM mutations, blocking the browser paint. Use useLayoutEffect only when you need to measure the DOM before the user sees it (to prevent flickering).'),
  
  -- PM Questions
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Product Manager', 'Meta', 'Hard', 'Product Sense', 'How would you improve Facebook Groups?', '1. Clarify the goal (engagement vs monetization). 2. Identify user segments (Admins, Active Members, Lurkers). 3. Identify pain points (Admins struggle with spam, lurkers find it hard to discover content). 4. Propose solutions (AI-powered spam filters, personalized group onboarding). 5. Prioritize and define success metrics.')
ON CONFLICT DO NOTHING;
