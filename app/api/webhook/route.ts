import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("1. Webhook payload received from GitHub:", payload);

    // 2. Attempt to save to Supabase
// 2. Attempt to save to Supabase
    const { data, error } = await supabase
      .from('test_runs')
      .insert([
        {
          repository: payload.repo,
          status: payload.status,
          duration: payload.executionTime,
          log_url: payload.logUrl // <-- Catching the new link!
        }
      ])
      .select();

    // 3. Catch and log any database errors
    if (error) {
      console.error("❌ SUPABASE INSERT ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Successfully saved to database!", data);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}