import { NextResponse } from "next/server";
import { syncFresherJobsToSupabase } from "@/lib/fresher-jobs";

export async function GET() {
  try {
    const result = await syncFresherJobsToSupabase();

    return NextResponse.json({
      success: true,
      count: result.count,
      sources: result.sources,
      message: `Successfully synced ${result.count} fresher jobs from the last 48 hours.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = GET;
