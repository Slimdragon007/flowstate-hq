import { NextResponse } from "next/server";
import { getOrganization, getAgents } from "@/lib/agents";

export async function GET() {
  try {
    const org = await getOrganization("flowstate");
    const agents = await getAgents(org.id);
    return NextResponse.json({ agents });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
