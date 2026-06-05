// API Route: /api/youtube/search

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    const career_id = searchParams.get('career_id') || undefined;
    const topic = searchParams.get('topic') || undefined;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    const supabase = await createClient();

    // Check cache first
    if (career_id && topic) {
      const { data: cached } = await supabase
        .from('youtube_resources')
        .select('*')
        .eq('career_id', career_id)
        .eq('topic', topic)
        .limit(maxResults);

      if (cached && cached.length > 0) {
        return NextResponse.json({ videos: cached });
      }
    }

    // Fetch from YouTube API
    const url = new URL(YOUTUBE_SEARCH_URL);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('key', YOUTUBE_API_KEY);
    url.searchParams.set('relevanceLanguage', 'en');
    url.searchParams.set('videoDuration', 'medium'); // 4-20 minutes

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('YouTube API failed');

    const data = await response.json();

    // Cache results
    const videos = [];
    for (const item of data.items) {
      const videoData = {
        career_id: career_id || null,
        role: career_id || 'general',
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.medium.url,
        channel: item.snippet.channelTitle,
        topic: topic || null,
        difficulty: null,
      };

      const { data: inserted, error } = await supabase
        .from('youtube_resources')
        .upsert(videoData, { onConflict: 'url' })
        .select()
        .single();

      if (!error && inserted) {
        videos.push(inserted);
      }
    }

    return NextResponse.json({ videos });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
