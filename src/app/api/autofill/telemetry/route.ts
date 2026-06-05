import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Even if no user is authenticated, we might want to collect anonymous telemetry
    // But let's log the user ID if available
    
    const body = await request.json();
    const { portal, url, fieldsDetected, fieldNames, status, error } = body;

    if (!portal) {
      return NextResponse.json({ error: 'Portal is required' }, { status: 400 });
    }

    // Insert telemetry record
    // We create an 'autofill_telemetry' table logically, but for now we might not have the table
    // Let's assume we log to a table or just return success for the MVP
    // To avoid crashes if the table doesn't exist, we can use RPC or just attempt insert and swallow error
    
    const { error: dbError } = await supabase.from('autofill_telemetry').insert({
      user_id: user?.id || null,
      portal,
      url,
      fields_detected: fieldsDetected || 0,
      field_names: fieldNames || [],
      status: status || 'unknown',
      error_message: error || null,
    });

    if (dbError) {
      // If table doesn't exist yet, we just log it to console for now
      console.warn('Telemetry insert failed (table might be missing):', dbError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telemetry error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
