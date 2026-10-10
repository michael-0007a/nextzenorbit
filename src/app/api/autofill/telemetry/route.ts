import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Even if no user is authenticated, we might want to collect anonymous telemetry
    // But let's log the user ID if available
    
    const body = await request.json();
    const { portal, url, fieldsDetected, fieldNames, status, error } = body;

    if (!portal || typeof portal !== 'string') {
      return NextResponse.json({ error: 'Portal is required' }, { status: 400 });
    }

    // Insert telemetry record
    // We create an 'autofill_telemetry' table logically, but for now we might not have the table
    // Let's assume we log to a table or just return success for the MVP
    // To avoid crashes if the table doesn't exist, we can use RPC or just attempt insert and swallow error
    
    // anon INSERT is revoked on the table (migration 042); write with the service role and cap sizes here.
    const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : null);
    const { error: dbError } = await createAdminClient().from('autofill_telemetry').insert({
      user_id: user?.id || null,
      portal: portal.slice(0, 100),
      url: clip(url, 500) || '',
      fields_detected: Math.min(Math.max(Number(fieldsDetected) || 0, 0), 1000),
      field_names: Array.isArray(fieldNames) ? fieldNames.slice(0, 100).map(n => String(n).slice(0, 100)) : [],
      status: clip(status, 50) || 'unknown',
      error_message: clip(error, 500),
    });

    if (dbError) {
      // If table doesn't exist yet, we just log it to console for now
      console.warn('Telemetry insert failed (table might be missing):', dbError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telemetry error:', error);
    return NextResponse.json(
      { success: false, error: 'Telemetry failed.' },
      { status: 500 }
    );
  }
}
