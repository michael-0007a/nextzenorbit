const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function generateDetailedDescription(role, stepTitle, currentDescription) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: `You are a senior career coach writing concise, scannable roadmap content for ambitious learners.

FORMAT RULES (follow exactly):
1. Start with ONE short sentence (max 20 words) explaining WHY this step matters.
2. Then write exactly 4-5 bullet points. Each bullet must:
   - Start with a bold tool/concept name like **Revit:**
   - Follow with a single, specific, actionable task in plain language (max 15 words)
   - Be something a learner can actually DO or PRACTICE

OUTPUT ONLY raw Markdown. No headers. No intro paragraph. No extra commentary.

EXAMPLE OUTPUT:
Master the tools that transform 2D sketches into intelligent, collaborative building models.

- **Revit:** Build a simple 3-story floor plan with walls, doors, and windows from scratch.
- **SketchUp:** Model a small residential building and export a presentation-ready 3D render.
- **Rhino + Grasshopper:** Create a parametric facade using basic scripts.
- **BIM Coordination:** Run a clash detection report between structural and MEP models.
- **IFC Export:** Export a Revit model to IFC format and open it in a free BIM viewer.`
          },
          { 
            role: 'user', 
            content: `Role: ${role}\nStep: ${stepTitle}\nContext: ${currentDescription}`
          }
        ],
        temperature: 0.5,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      console.error(`Groq API Error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim();
  } catch (err) {
    console.error('Fetch error:', err);
    return null;
  }
}

async function main() {
  console.log('Fetching all roadmap steps...');
  const { data: steps, error } = await supabase
    .from('roadmap_steps')
    .select(`
      id, title, description,
      roadmaps ( role )
    `);

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${steps.length} steps to expand.`);

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // Only process steps that still have old dense format (long paragraphs)
  const toProcess = steps.filter(s => !s.description || !s.description.startsWith('- **') && s.description.length < 50 || s.description.includes('. In this step') || s.description.includes('is crucial for'));
  
  console.log(`${toProcess.length} steps need updating.`);

  for (let i = 0; i < toProcess.length; i++) {
    const step = toProcess[i];
    console.log(`Processing ${i + 1}/${toProcess.length}: ${step.title}`);
    const role = step.roadmaps?.role || 'Professional';
    
    // Retry up to 3 times with backoff
    let detailedMarkdown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      detailedMarkdown = await generateDetailedDescription(role, step.title, step.description);
      if (detailedMarkdown) break;
      const backoff = 10000 * (attempt + 1);
      console.log(`  Retrying in ${backoff/1000}s...`);
      await delay(backoff);
    }
    
    if (detailedMarkdown) {
      await supabase
        .from('roadmap_steps')
        .update({ description: detailedMarkdown })
        .eq('id', step.id);
      console.log(`✅ Expanded: ${step.title}`);
    } else {
      console.log(`❌ Failed after retries: ${step.title}`);
    }

    // 6 seconds between requests
    await delay(6000);
  }

  console.log('Finished expanding all roadmaps!');
}

main().catch(console.error);
