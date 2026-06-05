const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to generate deterministic UUIDs for idempotency
function uuid(seed) {
  return crypto.createHash('md5').update(seed).digest('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

const rolesData = [
  // TECH & IT
  {
    title: 'Cloud Architect', slug: 'cloud-architect', icon: 'Cloud',
    desc: 'Design and manage robust, scalable cloud infrastructure and services.',
    steps: [
      { t: 'Networking & OS Basics', d: 'Understand Linux, TCP/IP, DNS, and basic virtualization concepts.', l: 'beginner' },
      { t: 'Cloud Providers (AWS/GCP/Azure)', d: 'Learn core services: Compute, Storage, Databases, and IAM.', l: 'intermediate' },
      { t: 'Infrastructure as Code (IaC)', d: 'Master Terraform, CloudFormation, and configuration management tools.', l: 'intermediate' },
      { t: 'Cloud Security & Architecture', d: 'Design highly available, fault-tolerant, and secure architectures. Master VPCs, WAFs, and encryption.', l: 'advanced' }
    ]
  },
  {
    title: 'Mobile App Developer', slug: 'mobile-app-developer', icon: 'Smartphone',
    desc: 'Create intuitive applications for iOS and Android devices.',
    steps: [
      { t: 'Programming Fundamentals', d: 'Learn Swift (iOS) or Kotlin (Android), or a cross-platform language like Dart.', l: 'beginner' },
      { t: 'UI & State Management', d: 'Build responsive layouts and manage complex application state.', l: 'intermediate' },
      { t: 'APIs & Local Storage', d: 'Connect to REST APIs, use WebSockets, and store data locally using SQLite or CoreData.', l: 'intermediate' },
      { t: 'App Store Deployment', d: 'Handle certificates, provisioning profiles, and automated deployment via Fastlane.', l: 'advanced' }
    ]
  },
  {
    title: 'Blockchain Developer', slug: 'blockchain-developer', icon: 'Box',
    desc: 'Build decentralized applications and write secure smart contracts.',
    steps: [
      { t: 'Cryptography & Consensus', d: 'Understand hash functions, public-key cryptography, and Proof of Work/Stake.', l: 'beginner' },
      { t: 'Smart Contracts', d: 'Write, test, and deploy smart contracts using Solidity or Rust.', l: 'intermediate' },
      { t: 'DApps & Web3', d: 'Connect frontend interfaces to blockchain networks using Ethers.js or Web3.js.', l: 'intermediate' },
      { t: 'Security & Auditing', d: 'Learn common vulnerabilities (Reentrancy) and how to audit smart contracts safely.', l: 'advanced' }
    ]
  },
  {
    title: 'Machine Learning Engineer', slug: 'machine-learning-engineer', icon: 'Cpu',
    desc: 'Design AI models and deploy machine learning systems into production.',
    steps: [
      { t: 'Math & Python', d: 'Master Linear Algebra, Calculus, Statistics, and core Python libraries (NumPy, Pandas).', l: 'beginner' },
      { t: 'Classical ML Algorithms', d: 'Learn Regression, Classification, Clustering, and ensemble methods.', l: 'intermediate' },
      { t: 'Deep Learning', d: 'Build Neural Networks with PyTorch/TensorFlow. Study CNNs, RNNs, and Transformers.', l: 'advanced' },
      { t: 'MLOps & Deployment', d: 'Deploy models using Docker, FastAPI, and manage experiments using MLflow or Weights & Biases.', l: 'advanced' }
    ]
  },
  {
    title: 'Database Administrator', slug: 'database-administrator', icon: 'Database',
    desc: 'Ensure database systems are secure, optimized, and highly available.',
    steps: [
      { t: 'SQL & Relational Theory', d: 'Master complex queries, joins, window functions, and normalization.', l: 'beginner' },
      { t: 'Database Performance', d: 'Learn indexing strategies, query execution plans, and performance tuning.', l: 'intermediate' },
      { t: 'Backup & Recovery', d: 'Implement robust backup solutions and disaster recovery protocols.', l: 'intermediate' },
      { t: 'Clustering & Replication', d: 'Set up High Availability (HA) clusters and read replicas for scaling.', l: 'advanced' }
    ]
  },

  // BUSINESS & FINANCE
  {
    title: 'Financial Analyst', slug: 'financial-analyst', icon: 'LineChart',
    desc: 'Analyze financial data, forecast trends, and help businesses make investment decisions.',
    steps: [
      { t: 'Accounting Principles', d: 'Understand income statements, balance sheets, and cash flow statements.', l: 'beginner' },
      { t: 'Financial Modeling', d: 'Build complex models in Excel to forecast future revenues and expenses.', l: 'intermediate' },
      { t: 'Valuation Techniques', d: 'Learn DCF (Discounted Cash Flow) analysis and comparable company analysis.', l: 'advanced' },
      { t: 'Data Visualization', d: 'Present financial insights using tools like Tableau, Power BI, or advanced Excel charting.', l: 'advanced' }
    ]
  },
  {
    title: 'Marketing Manager', slug: 'marketing-manager', icon: 'Megaphone',
    desc: 'Develop strategies to promote products and drive brand growth.',
    steps: [
      { t: 'Market Research', d: 'Analyze market trends, competitor strategies, and target audience demographics.', l: 'beginner' },
      { t: 'Digital Marketing Channels', d: 'Master SEO, Content Marketing, Email campaigns, and Social Media strategies.', l: 'intermediate' },
      { t: 'Performance & Analytics', d: 'Track KPIs, CAC (Customer Acquisition Cost), and ROI using Google Analytics.', l: 'intermediate' },
      { t: 'Brand Strategy & Positioning', d: 'Define the brand voice, messaging, and oversee multi-channel campaign execution.', l: 'advanced' }
    ]
  },
  {
    title: 'Sales Representative', slug: 'sales-representative', icon: 'Target',
    desc: 'Identify leads, pitch products, and close deals to drive company revenue.',
    steps: [
      { t: 'Product Knowledge', d: 'Deeply understand the product offerings, features, and value propositions.', l: 'beginner' },
      { t: 'Prospecting & Lead Gen', d: 'Learn cold calling, email outreach, and how to qualify potential leads.', l: 'intermediate' },
      { t: 'Negotiation & Closing', d: 'Handle objections, negotiate terms, and successfully close complex deals.', l: 'advanced' },
      { t: 'CRM Management', d: 'Master tools like Salesforce or HubSpot to track the sales pipeline.', l: 'intermediate' }
    ]
  },
  {
    title: 'Human Resources Manager', slug: 'human-resources-manager', icon: 'Users',
    desc: 'Oversee recruitment, employee relations, and company culture.',
    steps: [
      { t: 'Recruitment & Onboarding', d: 'Learn sourcing strategies, interviewing techniques, and new hire orientation.', l: 'beginner' },
      { t: 'Employee Relations', d: 'Handle workplace conflicts, performance reviews, and employee engagement.', l: 'intermediate' },
      { t: 'Compensation & Benefits', d: 'Design competitive salary structures and manage health/retirement benefits.', l: 'advanced' },
      { t: 'Labor Law & Compliance', d: 'Ensure company policies comply with local and federal employment laws.', l: 'advanced' }
    ]
  },
  {
    title: 'Supply Chain Analyst', slug: 'supply-chain-analyst', icon: 'Truck',
    desc: 'Optimize logistics, inventory, and supply chain operations.',
    steps: [
      { t: 'Inventory Management', d: 'Learn how to forecast demand, track stock levels, and minimize waste.', l: 'beginner' },
      { t: 'Procurement & Sourcing', d: 'Negotiate with suppliers and evaluate vendor performance.', l: 'intermediate' },
      { t: 'Logistics & Distribution', d: 'Optimize shipping routes, warehouse operations, and delivery schedules.', l: 'intermediate' },
      { t: 'Supply Chain Analytics', d: 'Use data modeling to identify bottlenecks and reduce operational costs.', l: 'advanced' }
    ]
  },

  // HEALTHCARE & SCIENCE
  {
    title: 'Registered Nurse', slug: 'registered-nurse', icon: 'Activity',
    desc: 'Provide patient care, educate patients about health conditions, and provide support.',
    steps: [
      { t: 'Anatomy & Physiology', d: 'Understand the human body systems and fundamental medical terminology.', l: 'beginner' },
      { t: 'Patient Assessment', d: 'Learn to check vital signs, evaluate symptoms, and document patient history.', l: 'intermediate' },
      { t: 'Pharmacology', d: 'Understand medication classifications, administration, and side effects.', l: 'intermediate' },
      { t: 'Specialized Care', d: 'Gain expertise in ICU, ER, Pediatrics, or Oncology nursing protocols.', l: 'advanced' }
    ]
  },
  {
    title: 'Pharmacist', slug: 'pharmacist', icon: 'Pill',
    desc: 'Dispense prescription medications and offer expertise in the safe use of prescriptions.',
    steps: [
      { t: 'Chemistry & Biology Basics', d: 'Master organic chemistry, biochemistry, and human physiology.', l: 'beginner' },
      { t: 'Pharmacokinetics', d: 'Study how the body absorbs, distributes, metabolizes, and excretes drugs.', l: 'intermediate' },
      { t: 'Pharmacy Law & Ethics', d: 'Understand controlled substance regulations and ethical dispensing practices.', l: 'intermediate' },
      { t: 'Clinical Pharmacy', d: 'Advise physicians on drug interactions and optimize patient medication therapy.', l: 'advanced' }
    ]
  },
  {
    title: 'Biomedical Engineer', slug: 'biomedical-engineer', icon: 'Microscope',
    desc: 'Combine engineering principles with medical sciences to design and create equipment.',
    steps: [
      { t: 'Engineering Fundamentals', d: 'Learn mechanics, electronics, and materials science.', l: 'beginner' },
      { t: 'Biomechanics & Biomaterials', d: 'Study how artificial materials interact with biological systems.', l: 'intermediate' },
      { t: 'Medical Imaging', d: 'Understand the physics and engineering behind MRI, CT, and X-ray machines.', l: 'advanced' },
      { t: 'Regulatory Compliance (FDA)', d: 'Learn the rigorous testing and approval processes for medical devices.', l: 'advanced' }
    ]
  },
  {
    title: 'Physical Therapist', slug: 'physical-therapist', icon: 'Heart',
    desc: 'Help injured or ill people improve movement and manage pain.',
    steps: [
      { t: 'Kinesiology & Anatomy', d: 'Study human movement, muscles, bones, and joints in extreme detail.', l: 'beginner' },
      { t: 'Diagnostic Assessment', d: 'Learn to evaluate mobility, strength, and diagnose physical impairments.', l: 'intermediate' },
      { t: 'Therapeutic Exercise', d: 'Design and supervise rehabilitation programs tailored to specific injuries.', l: 'intermediate' },
      { t: 'Neurological Rehabilitation', d: 'Specialize in treating patients recovering from strokes or spinal cord injuries.', l: 'advanced' }
    ]
  },

  // DESIGN & CREATIVE
  {
    title: 'Graphic Designer', slug: 'graphic-designer', icon: 'PenTool',
    desc: 'Create visual concepts to communicate ideas that inspire, inform, and captivate consumers.',
    steps: [
      { t: 'Design Fundamentals', d: 'Master color theory, typography, grid systems, and layout principles.', l: 'beginner' },
      { t: 'Software Mastery (Adobe CC)', d: 'Become proficient in Photoshop, Illustrator, and InDesign.', l: 'intermediate' },
      { t: 'Brand Identity', d: 'Design logos, brand guidelines, and cohesive visual identities for companies.', l: 'intermediate' },
      { t: 'Print & Digital Production', d: 'Learn color profiles (CMYK vs RGB) and prepare files for commercial printing or web.', l: 'advanced' }
    ]
  },
  {
    title: 'Copywriter', slug: 'copywriter', icon: 'FileText',
    desc: 'Write compelling marketing and promotional materials to drive engagement and sales.',
    steps: [
      { t: 'Writing Fundamentals', d: 'Master grammar, tone, active voice, and persuasive writing techniques.', l: 'beginner' },
      { t: 'SEO Copywriting', d: 'Learn keyword research and how to write content that ranks well on search engines.', l: 'intermediate' },
      { t: 'Direct Response & Conversion', d: 'Write high-converting landing pages, ad copy, and email sequences.', l: 'advanced' },
      { t: 'Brand Voice Development', d: 'Adapt writing styles to match the distinct voice and personality of different brands.', l: 'advanced' }
    ]
  },
  {
    title: 'Video Editor', slug: 'video-editor', icon: 'Video',
    desc: 'Manipulate and arrange video shots to create cohesive and engaging visual stories.',
    steps: [
      { t: 'NLE Software Basics', d: 'Learn Premiere Pro, Final Cut Pro, or DaVinci Resolve interfaces and basic cuts.', l: 'beginner' },
      { t: 'Audio Mixing & Sound Design', d: 'Clean up dialogue, mix music, and add sound effects (Foley).', l: 'intermediate' },
      { t: 'Color Correction & Grading', d: 'Balance exposure/white balance, and apply creative color grades to set the mood.', l: 'advanced' },
      { t: 'Motion Graphics (After Effects)', d: 'Create lower thirds, title sequences, and basic visual effects.', l: 'advanced' }
    ]
  },
  {
    title: 'Architect (Building)', slug: 'architect-building', icon: 'Home',
    desc: 'Design buildings and structures while ensuring safety, functionality, and aesthetics.',
    steps: [
      { t: 'Drafting & 2D CAD', d: 'Learn architectural drawing standards and AutoCAD software.', l: 'beginner' },
      { t: '3D Modeling & BIM', d: 'Master Revit, SketchUp, or Rhino for Building Information Modeling.', l: 'intermediate' },
      { t: 'Building Codes & Zoning', d: 'Understand legal regulations, accessibility (ADA), and safety codes.', l: 'intermediate' },
      { t: 'Sustainable Design', d: 'Design energy-efficient buildings and obtain LEED certification knowledge.', l: 'advanced' }
    ]
  },

  // LEGAL & EDUCATION
  {
    title: 'Corporate Lawyer', slug: 'corporate-lawyer', icon: 'Briefcase',
    desc: 'Advise businesses on their legal rights, responsibilities, and obligations.',
    steps: [
      { t: 'Legal Research & Writing', d: 'Learn to analyze case law, statutes, and draft legal memorandums.', l: 'beginner' },
      { t: 'Contracts & Agreements', d: 'Draft, review, and negotiate NDAs, employment agreements, and vendor contracts.', l: 'intermediate' },
      { t: 'Mergers & Acquisitions (M&A)', d: 'Conduct due diligence and structure complex corporate transactions.', l: 'advanced' },
      { t: 'Corporate Governance', d: 'Ensure companies comply with regulatory frameworks and advise boards of directors.', l: 'advanced' }
    ]
  },
  {
    title: 'High School Teacher', slug: 'high-school-teacher', icon: 'BookOpen',
    desc: 'Educate students in a specific subject and help them develop critical thinking skills.',
    steps: [
      { t: 'Subject Matter Expertise', d: 'Gain deep knowledge in your chosen subject (Math, Science, English, etc.).', l: 'beginner' },
      { t: 'Lesson Planning', d: 'Develop curriculums, assessments, and engaging classroom activities.', l: 'intermediate' },
      { t: 'Classroom Management', d: 'Learn strategies to maintain discipline, motivation, and a positive learning environment.', l: 'intermediate' },
      { t: 'Differentiated Instruction', d: 'Adapt teaching methods to accommodate diverse learning styles and special needs.', l: 'advanced' }
    ]
  },

  // TRADES & SPECIALIZED
  {
    title: 'Commercial Pilot', slug: 'commercial-pilot', icon: 'Plane',
    desc: 'Navigate and fly airplanes or helicopters for airlines or commercial transport.',
    steps: [
      { t: 'Private Pilot License (PPL)', d: 'Learn basic flight maneuvers, aerodynamics, and pass the initial FAA exam.', l: 'beginner' },
      { t: 'Instrument Rating (IR)', d: 'Learn to fly relying solely on aircraft instruments in poor weather conditions.', l: 'intermediate' },
      { t: 'Commercial Pilot License (CPL)', d: 'Master advanced maneuvers and meet the rigorous flight hour requirements.', l: 'advanced' },
      { t: 'Multi-Engine & Type Ratings', d: 'Get certified to fly complex, multi-engine jets (e.g., Boeing 737, Airbus A320).', l: 'advanced' }
    ]
  },
  {
    title: 'Mechanical Engineer', slug: 'mechanical-engineer', icon: 'Wrench',
    desc: 'Design, develop, and test mechanical and thermal sensors and devices.',
    steps: [
      { t: 'Physics & Thermodynamics', d: 'Master the principles of force, motion, energy, and heat transfer.', l: 'beginner' },
      { t: 'CAD & SolidWorks', d: 'Design 3D mechanical parts and assemblies using computer-aided design software.', l: 'intermediate' },
      { t: 'Material Science', d: 'Understand the properties of metals, polymers, and composites under stress.', l: 'intermediate' },
      { t: 'Finite Element Analysis (FEA)', d: 'Simulate physical stresses and structural integrity using software like ANSYS.', l: 'advanced' }
    ]
  },
  {
    title: 'Real Estate Agent', slug: 'real-estate-agent', icon: 'Home',
    desc: 'Help clients buy, sell, and rent properties.',
    steps: [
      { t: 'Licensing & Regulations', d: 'Pass the state real estate exam and understand fair housing laws.', l: 'beginner' },
      { t: 'Market Analysis', d: 'Learn to run Comparative Market Analysis (CMA) to accurately price properties.', l: 'intermediate' },
      { t: 'Marketing & Lead Generation', d: 'Build a client base through networking, social media, and open houses.', l: 'intermediate' },
      { t: 'Contract Negotiation', d: 'Draft purchase agreements, navigate contingencies, and successfully close escrow.', l: 'advanced' }
    ]
  }
];

async function seed() {
  console.log(`Seeding ${rolesData.length} new roles...`);

  const careersToInsert = [];
  const roadmapsToInsert = [];
  const roadmapStepsToInsert = [];
  const interviewQuestionsToInsert = []; // We will add 1 generic question for each just to populate the section

  for (let i = 0; i < rolesData.length; i++) {
    const role = rolesData[i];
    
    // Generate deterministic UUIDs based on the slug
    const careerId = uuid(`career-${role.slug}`);
    const roadmapId = uuid(`roadmap-${role.slug}`);

    careersToInsert.push({
      id: careerId,
      title: role.title,
      slug: role.slug,
      description: role.desc,
      icon: role.icon || 'Briefcase'
    });

    roadmapsToInsert.push({
      id: roadmapId,
      career_id: careerId,
      role: role.title,
      title: `${role.title} Master Roadmap`,
      description: `A step-by-step guide to becoming a successful ${role.title}.`
    });

    for (let j = 0; j < role.steps.length; j++) {
      const step = role.steps[j];
      roadmapStepsToInsert.push({
        roadmap_id: roadmapId,
        title: step.t,
        description: step.d,
        order_index: j + 1,
        level: step.l
      });
    }

    interviewQuestionsToInsert.push({
      career_id: careerId,
      role: role.title,
      company: 'Generic',
      difficulty: 'intermediate',
      topic: 'Core Skills',
      question: `What are the most critical skills required for a ${role.title}?`,
      answer: `Success as a ${role.title} requires a strong foundation in the core principles outlined in the roadmap, combined with continuous learning, adaptability, and excellent problem-solving skills.`
    });
  }

  console.log('Upserting careers...');
  await supabase.from('careers').upsert(careersToInsert);

  console.log('Upserting roadmaps...');
  await supabase.from('roadmaps').upsert(roadmapsToInsert);

  console.log('Upserting roadmap steps...');
  // Since roadmap steps could be large, batch them if necessary. For 100 rows, it's fine.
  await supabase.from('roadmap_steps').upsert(roadmapStepsToInsert);

  console.log('Upserting interview questions...');
  await supabase.from('interview_questions').upsert(interviewQuestionsToInsert);

  console.log('Done!');
}

seed().catch(console.error);
