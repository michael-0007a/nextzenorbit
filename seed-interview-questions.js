require('@next/env').loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function generateQuestions(roleTitle, attempt = 1) {
  const prompt = `Generate exactly 25 interview questions for a "${roleTitle}" role.

Return ONLY a valid JSON array. No explanation, no markdown, no extra text.

Each item must have exactly these fields:
- "question": string (the interview question)
- "answer": string (concise answer, 2-4 sentences, factual and specific)
- "difficulty": one of "easy", "medium", "hard"
- "topic": one of "Technical Skills", "Behavioral", "Problem Solving", "Situational", "Domain Knowledge", "Communication", "Leadership", "Tools & Technologies"

Mix of difficulties: ~8 easy, ~10 medium, ~7 hard.
Mix of topics evenly. Make questions specific to the role, not generic.

Example item:
{"question":"What is the difference between CMYK and RGB color modes?","answer":"RGB (Red, Green, Blue) is an additive color model used for digital screens, while CMYK (Cyan, Magenta, Yellow, Key/Black) is a subtractive model used for print. Designers must switch to CMYK when preparing files for commercial printing to ensure color accuracy.","difficulty":"easy","topic":"Domain Knowledge"}`;

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
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 4000
      })
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const waitSec = retryAfter ? parseFloat(retryAfter) : 15;
      console.warn(`  ⚠️ Rate limited (429) for ${roleTitle}. Waiting ${waitSec}s before retrying (attempt ${attempt}/5)...`);
      await delay(waitSec * 1000);
      if (attempt < 5) {
        return generateQuestions(roleTitle, attempt + 1);
      }
      return null;
    }

    if (!response.ok) {
      console.error(`API error for ${roleTitle}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    // Parse JSON - handle potential markdown code blocks
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error(`No JSON array found for ${roleTitle}`);
      return null;
    }

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error(`Error generating for ${roleTitle}:`, err.message);
    return null;
  }
}

async function main() {
  // Fetch all careers
  const { data: careers, error } = await supabase
    .from('careers')
    .select('id, title, slug');

  if (error) {
    console.error('Failed to fetch careers:', error);
    return;
  }

  console.log(`Found ${careers.length} careers. Generating 25 questions each...\n`);

  for (let i = 0; i < careers.length; i++) {
    const career = careers[i];
    
    // Skip if already has 10+ questions
    const { count } = await supabase
      .from('interview_questions')
      .select('*', { count: 'exact', head: true })
      .eq('career_id', career.id);
    
    if (count && count >= 10) {
      console.log(`[${i + 1}/${careers.length}] ${career.title} — already has ${count} questions, skipping`);
      continue;
    }

    console.log(`[${i + 1}/${careers.length}] Generating questions for: ${career.title}`);

    // Retry up to 3 times
    let questions = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      questions = await generateQuestions(career.title);
      if (questions && Array.isArray(questions) && questions.length > 0) break;
      const backoff = 15000 * (attempt + 1);
      console.log(`  Retrying in ${backoff/1000}s...`);
      await delay(backoff);
    }

    if (!questions || !Array.isArray(questions)) {
      console.log(`  ❌ Failed - skipping\n`);
      await delay(5000);
      continue;
    }

    // Delete existing questions for this career first
    await supabase
      .from('interview_questions')
      .delete()
      .eq('career_id', career.id);

    // Insert new questions
    const toInsert = questions.map((q) => ({
      career_id: career.id,
      role: career.title,
      company: 'Industry Standard',
      difficulty: q.difficulty || 'medium',
      topic: q.topic || 'Technical Skills',
      question: q.question,
      answer: q.answer,
    }));

    const { error: insertError } = await supabase
      .from('interview_questions')
      .insert(toInsert);

    if (insertError) {
      console.log(`  ❌ Insert failed: ${insertError.message}\n`);
    } else {
      console.log(`  ✅ Inserted ${toInsert.length} questions\n`);
    }

    // 15 seconds between careers to avoid rate limits
    await delay(15000);
  }

  console.log('✅ All done! Interview questions seeded.');
}

main().catch(console.error);
