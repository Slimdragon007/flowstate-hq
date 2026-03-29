import { NextResponse } from "next/server";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Dynamic import to avoid child_process at build time
    const { runTests, runBuildCheck } = await import("@/lib/data-sources/qa-runner");
    const [testResults, buildResults] = await Promise.all([
      runTests(),
      runBuildCheck(),
    ]);

    return NextResponse.json({
      tests: testResults,
      build: buildResults,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
