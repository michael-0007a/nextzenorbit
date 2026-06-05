const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Concise bullet-point descriptions keyed by step title
const fixes = {
  'Design Systems': `Build reusable UI foundations that keep your entire product visually consistent.\n\n- **Design Tokens:** Define color, spacing, and typography values in a single source of truth.\n- **Component Library:** Build buttons, inputs, and cards as reusable React/Vue components.\n- **Storybook:** Document and visually test each component in isolation.\n- **Figma Handoff:** Sync your code components with Figma designs for designer-developer alignment.`,

  'Smart Contracts': `Write self-executing code that runs on the blockchain without intermediaries.\n\n- **Solidity Basics:** Write a simple ERC-20 token contract and deploy it to a testnet.\n- **Hardhat/Foundry:** Set up a local dev environment, write tests, and debug transactions.\n- **OpenZeppelin:** Use audited, battle-tested contract libraries instead of writing from scratch.\n- **Gas Optimization:** Learn storage vs memory costs and minimize on-chain computation.`,

  'Inventory Management': `Forecast demand and track stock to prevent shortages and reduce waste.\n\n- **ABC Analysis:** Classify inventory by value — focus controls on high-impact items.\n- **EOQ Model:** Calculate the Economic Order Quantity to minimize ordering + holding costs.\n- **Safety Stock:** Determine buffer inventory levels using demand variability and lead times.\n- **ERP Systems (SAP/Oracle):** Use enterprise software to automate purchase orders and stock tracking.`,

  'Kinesiology & Anatomy': `Understand how the human body moves to assess and treat physical impairments.\n\n- **Musculoskeletal System:** Learn all major muscle groups, bones, and joint types by region.\n- **Gait Analysis:** Observe and break down walking patterns to identify movement dysfunctions.\n- **Range of Motion Testing:** Measure joint flexibility with a goniometer accurately.\n- **Functional Movement Screens:** Use standardized tests (FMS) to assess baseline movement quality.`,

  'Chemistry & Biology Basics': `Build the science foundation needed to understand how drugs interact with the body.\n\n- **Organic Chemistry:** Master functional groups, reaction mechanisms, and stereochemistry.\n- **Biochemistry:** Learn enzyme kinetics, metabolic pathways, and protein structure.\n- **Cell Biology:** Understand cell signaling, membrane transport, and receptor types.\n- **Lab Techniques:** Practice titration, spectrophotometry, and chromatography hands-on.`,

  'Engineering Fundamentals': `Master the core engineering principles that underpin all biomedical device design.\n\n- **Circuit Analysis:** Build and analyze basic circuits using resistors, capacitors, and op-amps.\n- **Statics & Dynamics:** Solve force/moment problems for structures and moving systems.\n- **Materials Testing:** Measure tensile strength, hardness, and fatigue life of common materials.\n- **MATLAB/Python:** Write scripts to model engineering problems and visualize data.`,

  'Medical Imaging': `Understand the physics and engineering behind MRI, CT, and X-ray systems.\n\n- **X-ray Physics:** Learn how photon attenuation creates contrast in radiographic images.\n- **CT Reconstruction:** Understand filtered back-projection and iterative reconstruction algorithms.\n- **MRI Fundamentals:** Study spin physics, pulse sequences (T1/T2), and k-space filling.\n- **Image Processing:** Apply filtering, segmentation, and 3D rendering to DICOM datasets using Python.`,

  'Diagnostic Assessment': `Learn to evaluate mobility, strength, and pain to build effective treatment plans.\n\n- **Manual Muscle Testing:** Grade muscle strength on the 0-5 Oxford scale systematically.\n- **Special Tests:** Perform orthopedic tests (Lachman, McMurray, Neer) to identify specific injuries.\n- **Pain Assessment:** Use validated scales (VAS, McGill) to quantify patient pain levels.\n- **Outcome Measures:** Track progress with standardized tools like the DASH or Oswestry Index.`,

  'Biomechanics & Biomaterials': `Study how artificial materials interact with living tissue for implant design.\n\n- **Biocompatibility Testing:** Run cytotoxicity and hemocompatibility assays per ISO 10993.\n- **Stress-Strain Analysis:** Model how implants deform under physiological loads.\n- **Titanium & PEEK:** Compare metallic vs. polymer implant materials for specific applications.\n- **Wear Testing:** Simulate years of joint implant use in accelerated lab tests.`,

  'Design Fundamentals': `Master the visual building blocks that make every design decision intentional.\n\n- **Color Theory:** Create harmonious palettes using complementary, analogous, and triadic schemes.\n- **Typography:** Pair fonts effectively — learn hierarchy, line-height, and readability rules.\n- **Grid Systems:** Use 8px grids and column layouts to align elements consistently.\n- **Gestalt Principles:** Apply proximity, contrast, and repetition to guide the viewer's eye.`,

  'Audio Mixing & Sound Design': `Clean up dialogue, balance music, and add sound effects to polish your edit.\n\n- **EQ & Compression:** Remove muddy frequencies and even out volume levels in dialogue tracks.\n- **Sound Effects (Foley):** Layer footsteps, ambient noise, and impact sounds for realism.\n- **Music Mixing:** Adjust levels so music supports the scene without drowning out dialogue.\n- **Audio Formats:** Export in correct sample rates (48kHz for video) and understand loudness standards (LUFS).`,

  '3D Modeling & BIM': `Turn 2D sketches into intelligent digital building models for team collaboration.\n\n- **Revit:** Build a 3-story floor plan with walls, doors, windows, and MEP systems.\n- **SketchUp:** Model a small building and export a presentation-ready 3D walkthrough.\n- **Rhino + Grasshopper:** Create a parametric facade design using visual scripting.\n- **Clash Detection:** Run a coordination report to catch conflicts between structural and MEP models.`,

  'Therapeutic Exercise': `Design rehab programs that safely restore strength and mobility after injury.\n\n- **Progressive Overload:** Gradually increase resistance, reps, or ROM as the patient heals.\n- **Closed vs Open Chain:** Choose the right exercise type based on injury stage and joint stability.\n- **Aquatic Therapy:** Use water buoyancy to enable pain-free movement during early rehab.\n- **Home Exercise Programs:** Create clear, illustrated take-home routines patients will actually follow.`,

  'Building Codes & Zoning': `Navigate regulations to ensure your designs are safe, legal, and accessible.\n\n- **IBC/IRC:** Learn the International Building Code requirements for fire safety and egress.\n- **ADA Compliance:** Design accessible routes, ramps, doorways, and restrooms to standard.\n- **Zoning Laws:** Check height limits, setbacks, FAR, and parking requirements for your site.\n- **Fire Codes (NFPA):** Apply sprinkler, alarm, and exit signage requirements correctly.`,

  'Contracts & Agreements': `Draft, review, and negotiate the legal documents that protect business interests.\n\n- **NDA Drafting:** Write mutual and one-way non-disclosure agreements from scratch.\n- **Employment Contracts:** Structure compensation, non-compete, and IP assignment clauses.\n- **Vendor Agreements:** Negotiate SLAs, liability caps, and termination provisions.\n- **Red-Flag Review:** Spot dangerous clauses like unlimited indemnity or auto-renewal traps.`,

  'Mergers & Acquisitions (M&A)': `Structure complex deals that combine companies while managing legal and financial risk.\n\n- **Due Diligence:** Create and execute a checklist covering financials, IP, litigation, and contracts.\n- **Deal Structuring:** Compare asset purchase vs. stock purchase and their tax implications.\n- **Valuation Methods:** Apply DCF, comparable transactions, and precedent analysis to set deal price.\n- **Post-Merger Integration:** Plan the legal entity consolidation, employee transition, and system migration.`,

  'Software Mastery (Adobe CC)': `Become proficient in the industry-standard tools for professional graphic design.\n\n- **Photoshop:** Master layers, masks, retouching, and photo compositing techniques.\n- **Illustrator:** Create vector logos, icons, and illustrations using pen tool and pathfinder.\n- **InDesign:** Layout multi-page documents like brochures, magazines, and annual reports.\n- **File Management:** Organize assets with Libraries and package files for print handoff.`,

  'Sustainable Design': `Design energy-efficient buildings that minimize environmental impact.\n\n- **LEED Certification:** Understand credit categories, prerequisites, and documentation requirements.\n- **Energy Modeling (eQUEST):** Simulate building energy use and compare design alternatives.\n- **Passive Strategies:** Optimize building orientation, natural ventilation, and daylighting.\n- **Green Materials:** Specify recycled content, low-VOC finishes, and FSC-certified wood products.`,

  'Regulatory Compliance (FDA)': `Navigate the rigorous approval process required to bring medical devices to market.\n\n- **Device Classification:** Determine if your device is Class I, II, or III and the regulatory pathway.\n- **510(k) Submission:** Prepare a premarket notification showing substantial equivalence.\n- **Design Controls (21 CFR 820):** Document design inputs, outputs, verification, and validation.\n- **Risk Management (ISO 14971):** Conduct hazard analysis and maintain a risk management file.`,

  'Clinical Pharmacy': `Advise physicians on drug interactions and optimize patient medication therapy.\n\n- **Drug Interaction Screening:** Use databases to check for dangerous multi-drug interactions.\n- **Therapeutic Drug Monitoring:** Adjust dosing based on blood level results for narrow-index drugs.\n- **Medication Therapy Management:** Review a patient's complete med list and resolve duplications.\n- **Antibiotic Stewardship:** Recommend targeted antibiotics based on culture/sensitivity data.`,

  'Specialized Care': `Gain expertise in a nursing specialty to deliver expert-level patient outcomes.\n\n- **ICU Protocols:** Manage ventilators, vasopressors, and continuous monitoring equipment.\n- **ER Triage:** Rapidly assess patient acuity using the Emergency Severity Index (ESI).\n- **Pediatric Nursing:** Adjust medication dosing, IV rates, and communication for children.\n- **Oncology Care:** Administer chemotherapy safely and manage side effects like neutropenia.`,

  'Neurological Rehabilitation': `Help patients recover movement and independence after strokes or spinal injuries.\n\n- **Neuroplasticity Principles:** Use repetitive task-specific training to rewire neural pathways.\n- **Balance Training:** Progress from seated exercises to single-leg stance and dynamic tasks.\n- **Constraint-Induced Therapy:** Force use of the affected limb to drive cortical reorganization.\n- **Assistive Technology:** Fit and train patients on AFOs, wheelchairs, and adaptive equipment.`,

  'Brand Identity': `Create cohesive visual systems that make brands instantly recognizable.\n\n- **Logo Design:** Sketch 50+ concepts, refine 3, and deliver in vector formats (SVG, AI, EPS).\n- **Brand Guidelines:** Document color palette, typography, spacing rules, and usage examples.\n- **Mockups:** Present logos on business cards, websites, and signage for client approval.\n- **Brand Audit:** Evaluate an existing brand's visual consistency and recommend improvements.`,

  'Motion Graphics (After Effects)': `Create animated titles, lower thirds, and visual effects for video content.\n\n- **Keyframe Animation:** Animate position, scale, rotation, and opacity with easing curves.\n- **Shape Layers:** Build custom animated icons and graphic elements from scratch.\n- **Text Animation:** Create kinetic typography and animated title sequences.\n- **Expressions:** Write simple JavaScript expressions to automate repetitive motion tasks.`,

  'Subject Matter Expertise': `Develop deep knowledge in your teaching subject to deliver confident instruction.\n\n- **Core Curriculum Standards:** Map your content to state standards and AP/IB frameworks.\n- **Advanced Coursework:** Take graduate-level classes to stay ahead of what you teach.\n- **Cross-Disciplinary Links:** Connect your subject to real-world applications students care about.\n- **Resource Curation:** Build a library of textbooks, videos, and primary sources for each unit.`,

  'Lesson Planning': `Design structured lessons that keep students engaged and hit learning objectives.\n\n- **Backward Design:** Start with the assessment, then plan activities that build toward it.\n- **Bloom\'s Taxonomy:** Write objectives that progress from recall to analysis to creation.\n- **Differentiation:** Plan tiered activities for struggling, on-level, and advanced learners.\n- **Formative Checks:** Embed quick polls, exit tickets, and think-pair-share to gauge understanding.`,

  'Classroom Management': `Maintain a productive learning environment through clear expectations and rapport.\n\n- **Routines & Procedures:** Establish day-one protocols for entry, transitions, and dismissal.\n- **Positive Reinforcement:** Use specific praise and reward systems to encourage good behavior.\n- **De-escalation:** Redirect off-task behavior privately without disrupting the whole class.\n- **Restorative Practices:** Replace punitive discipline with reflective conversations and repair.`,

  'Differentiated Instruction': `Adapt your teaching so every student can access and master the content.\n\n- **Learning Profiles:** Assess visual, auditory, and kinesthetic preferences with quick surveys.\n- **Tiered Assignments:** Create three difficulty levels of the same task for mixed-ability classes.\n- **IEP/504 Accommodations:** Implement required modifications like extended time or preferential seating.\n- **Flexible Grouping:** Rotate between whole-class, small-group, and independent work strategically.`,

  'Private Pilot License (PPL)': `Learn fundamental flight skills and pass your first FAA certification.\n\n- **Ground School:** Study aerodynamics, weather theory, navigation, and FAA regulations.\n- **Flight Maneuvers:** Practice straight-and-level, turns, stalls, and slow flight with an instructor.\n- **Solo Flight:** Complete your first solo circuit — takeoff, pattern, and landing by yourself.\n- **Checkride Prep:** Pass the oral exam and practical flight test with a designated examiner.`,

  'Instrument Rating (IR)': `Fly safely in clouds and poor visibility using only cockpit instruments.\n\n- **Instrument Scan:** Develop a reliable scan pattern across the six primary flight instruments.\n- **IFR Navigation:** Fly VOR, ILS, and GPS approaches to published minimums.\n- **ATC Communication:** Master clearance readbacks, holding instructions, and approach requests.\n- **Simulated IMC:** Log hood time practicing partial panel and unusual attitude recovery.`,

  'Commercial Pilot License (CPL)': `Meet the advanced requirements to fly aircraft for compensation or hire.\n\n- **250 Flight Hours:** Build total time through cross-countries, night flying, and instruction.\n- **Complex Aircraft:** Get checkout in retractable gear, constant-speed prop, and flap systems.\n- **Commercial Maneuvers:** Perfect chandelles, lazy eights, eights on pylons, and power-off 180s.\n- **Written & Practical Exam:** Score 70%+ on the knowledge test and pass the CPL checkride.`,

  'Multi-Engine & Type Ratings': `Get certified to fly complex, multi-engine jets for airline operations.\n\n- **Multi-Engine Add-On:** Learn Vmc, single-engine procedures, and feathering in a light twin.\n- **ATP Written:** Study airline-level meteorology, high-altitude ops, and crew resource management.\n- **Type Rating (B737/A320):** Complete full-flight simulator training for a specific aircraft type.\n- **Line-Oriented Flight Training:** Practice realistic airline scenarios including emergencies and diversions.`,

  'Physics & Thermodynamics': `Master the fundamental laws governing force, energy, and heat transfer.\n\n- **Statics:** Solve equilibrium problems for beams, trusses, and frames under load.\n- **Dynamics:** Apply Newton's laws to analyze motion, momentum, and energy conservation.\n- **Thermodynamics:** Calculate heat transfer, work, and efficiency in closed and open systems.\n- **Fluid Mechanics:** Analyze pipe flow, pressure drops, and pump selection using Bernoulli's equation.`,

  'CAD & SolidWorks': `Design precise 3D mechanical parts and assemblies using industry-standard software.\n\n- **Part Modeling:** Create parametric 3D parts using sketches, extrudes, revolves, and fillets.\n- **Assembly Design:** Mate components together with constraints and check for interference.\n- **Engineering Drawings:** Generate dimensioned 2D drawings with proper GD&T annotations.\n- **Simulation:** Run basic stress analysis (FEA) on your parts directly in SolidWorks.`,

  'Material Science': `Understand how materials behave under stress to select the right one for each application.\n\n- **Stress-Strain Curves:** Interpret tensile test data to find yield strength, UTS, and ductility.\n- **Phase Diagrams:** Read iron-carbon diagrams to predict microstructure at different temperatures.\n- **Composites:** Compare carbon fiber, fiberglass, and Kevlar for strength-to-weight applications.\n- **Corrosion:** Identify galvanic, pitting, and stress-corrosion cracking and select resistant alloys.`,

  'Finite Element Analysis (FEA)': `Simulate real-world stresses digitally before building expensive physical prototypes.\n\n- **Mesh Generation:** Create quality meshes with appropriate element types and refinement.\n- **Boundary Conditions:** Apply realistic loads, constraints, and contact definitions.\n- **ANSYS/Abaqus:** Run static structural, thermal, and modal analyses on complex assemblies.\n- **Results Validation:** Compare FEA predictions against hand calculations and physical test data.`,

  'Licensing & Regulations': `Pass the state exam and understand the legal framework governing real estate practice.\n\n- **Pre-License Course:** Complete the required 60-180 hours of state-approved education.\n- **State Exam Prep:** Study contracts, property law, agency relationships, and fair housing.\n- **Fair Housing Act:** Learn protected classes and prohibited discriminatory practices.\n- **Continuing Education:** Plan your CE requirements to maintain your active license status.`,

  'Market Analysis': `Accurately price properties and identify market trends to advise clients confidently.\n\n- **Comparative Market Analysis:** Pull recent sales, pending listings, and expireds to set a price range.\n- **MLS Mastery:** Use advanced filters, saved searches, and market reports in your local MLS.\n- **Absorption Rate:** Calculate months of inventory to determine buyer's vs. seller's market.\n- **Investment Metrics:** Compute cap rate, cash-on-cash return, and GRM for investor clients.`,

  'Marketing & Lead Generation': `Build a pipeline of clients through strategic networking and digital marketing.\n\n- **Social Media:** Post market updates, listings, and behind-the-scenes content consistently.\n- **Open Houses:** Host effective open houses that convert visitors into buyer leads.\n- **Sphere of Influence:** Build and nurture a database of contacts with monthly touchpoints.\n- **Paid Advertising:** Run targeted Facebook/Instagram ads for listings and buyer seminars.`,

  'Contract Negotiation': `Navigate purchase agreements and close deals that protect your client's interests.\n\n- **Purchase Agreement:** Draft offers with appropriate contingencies, timelines, and earnest money.\n- **Inspection Negotiations:** Request repairs or credits based on inspection findings strategically.\n- **Appraisal Gaps:** Structure offers to handle appraisal shortfalls in competitive markets.\n- **Closing Coordination:** Manage the title company, lender, and agent communication to close on time.`,

  'Corporate Governance': `Ensure companies comply with regulations and advise boards on fiduciary duties.\n\n- **Board Advisory:** Draft board resolutions, minutes, and written consent actions.\n- **SEC Compliance:** Prepare proxy statements, annual reports, and beneficial ownership filings.\n- **Shareholder Rights:** Advise on voting procedures, dividends, and anti-dilution protections.\n- **Ethics & Compliance Programs:** Design corporate codes of conduct and whistleblower policies.`,

  'Product Knowledge': `Deeply understand your product to pitch its value confidently in any conversation.\n\n- **Feature Mapping:** Create a matrix of features, benefits, and the problems each one solves.\n- **Competitive Analysis:** Know your top 3 competitors' strengths and weaknesses cold.\n- **Demo Mastery:** Deliver a compelling 10-minute product demo tailored to each buyer persona.\n- **Use Cases:** Memorize 5 customer success stories with specific metrics and outcomes.`,

  'Valuation Techniques': `Determine what a company is truly worth using multiple financial frameworks.\n\n- **DCF Analysis:** Build a discounted cash flow model projecting 5-10 years of free cash flow.\n- **Comparable Companies:** Select peer groups and apply EV/EBITDA and P/E multiples.\n- **Precedent Transactions:** Analyze past M&A deals in the industry to benchmark valuations.\n- **Sensitivity Analysis:** Test how changes in growth rate and discount rate affect your valuation.`,

  'Data Visualization': `Present financial insights clearly using charts, dashboards, and visual storytelling.\n\n- **Tableau/Power BI:** Build interactive dashboards with drill-down filters and calculated fields.\n- **Excel Charts:** Create waterfall, combo, and sparkline charts for executive presentations.\n- **Storytelling:** Structure your narrative: context → insight → recommendation → action.\n- **Best Practices:** Choose the right chart type — bar for comparison, line for trends, scatter for correlation.`,
};

async function main() {
  console.log('Fetching all roadmap steps...');
  const { data: steps, error } = await supabase
    .from('roadmap_steps')
    .select('id, title, description');

  if (error) {
    console.error(error);
    return;
  }

  let updated = 0;
  for (const step of steps) {
    if (fixes[step.title]) {
      const { error: updateError } = await supabase
        .from('roadmap_steps')
        .update({ description: fixes[step.title] })
        .eq('id', step.id);

      if (updateError) {
        console.log(`❌ ${step.title}: ${updateError.message}`);
      } else {
        console.log(`✅ ${step.title}`);
        updated++;
      }
    }
  }

  console.log(`\nDone! Updated ${updated} steps.`);
}

main().catch(console.error);
