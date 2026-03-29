import { NextResponse } from "next/server";
import { getOrganization, getAgentMessages } from "@/lib/agents";

export async function GET() {
  try {
    const org = await getOrganization("flowstate");
    const messages = await getAgentMessages(org.id, 50);
    return NextResponse.json({ messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
