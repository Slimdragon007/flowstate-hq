import { NextResponse } from "next/server";
import { getOrganization, getActivityLog } from "@/lib/agents";

export async function GET() {
  try {
    const org = await getOrganization("flowstate");
    const entries = await getActivityLog(org.id, 50);
    return NextResponse.json({ entries });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
