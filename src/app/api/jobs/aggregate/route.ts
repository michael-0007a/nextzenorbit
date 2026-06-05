// API Route: /api/jobs/aggregate

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/in/search';
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || '';
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query = 'software engineer', location = '', maxPages = 1 } = body;
    
    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
      return NextResponse.json(
        { success: false, error: 'Adzuna API credentials not configured' },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    let totalAdded = 0;

    for (let page = 1; page <= maxPages; page++) {
      const url = new URL(`${ADZUNA_BASE_URL}/${page}`);
      url.searchParams.set('app_id', ADZUNA_APP_ID);
      url.searchParams.set('app_key', ADZUNA_APP_KEY);
      url.searchParams.set('what', query);
      if (location) url.searchParams.set('where', location);
      url.searchParams.set('results_per_page', '50');

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Adzuna API failed');

      const data = await response.json();

      for (const job of data.results) {
        // Check if already exists
        const { data: existing } = await supabase
          .from('jobs')
          .select('id')
          .eq('source_ref', job.id)
          .eq('source', 'adzuna')
          .single();

        if (existing) continue;

        // Insert new job
        const { error } = await supabase.from('jobs').insert({
          company: job.company.display_name,
          title: job.title,
          description: job.description,
          location: job.location.display_name,
          apply_url: job.redirect_url,
          source: 'adzuna',
          source_ref: job.id,
          tags: [job.category.tag],
        });

        if (!error) totalAdded++;
      }
    }

    return NextResponse.json({ success: true, jobsAdded: totalAdded });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
