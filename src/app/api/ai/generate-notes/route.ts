// API Route: /api/ai/generate-notes

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { upsertNote } from '@/services/notes-service';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { topic, career_id } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a career expert creating concise, helpful study notes.' },
          { role: 'user', content: `Create detailed study notes about the following topic: ${topic}. Focus on key concepts, best practices, and interview preparation if applicable. Format the response in Markdown.` }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate notes with Groq API');
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content || '';

    // Save to database
    const result = await upsertNote(user.id, user.email || '', {
      topic,
      role: career_id || '', // mapping career_id to role for now
      generated_content: generatedContent,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error?.message }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
