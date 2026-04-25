import { NextRequest, NextResponse } from "next/server";
import { getFresherJobs } from "@/lib/fresher-jobs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "1";
    const days = Number(searchParams.get("days") ?? "2");
    const limit = Number(searchParams.get("limit") ?? "100");

    const result = await getFresherJobs({
      refresh,
      days: Number.isFinite(days) ? days : 7,
      limit: Number.isFinite(limit) ? limit : 100,
    });

    return NextResponse.json({
      success: true,
      count: result.jobs.length,
      days: Number.isFinite(days) ? days : 2,
      debug: result.debug,
      jobs: result.jobs,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unable to fetch fresher jobs.",
      },
      { status: 500 }
    );
  }
}
