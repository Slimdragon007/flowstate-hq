import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import {
  getAgent,
  getOrganization,
  updateAgentStatus,
  saveAgentOutput,
  logActivity,
  sendAgentMessage,
} from "@/lib/agents";
import { callAgent } from "@/lib/anthropic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // 1. Parse request body for context and org_id
    let context: string | undefined;
    let bodyOrgId: string | undefined;
    try {
      const body = await request.json();
      context = body.context;
      bodyOrgId = body.org_id;
    } catch {
      // No body or invalid JSON, that's fine
    }

    // Resolve org_id (from body or default to flowstate org)
    const orgId = bodyOrgId ?? (await getOrganization("flowstate")).id;

    // 2. Fetch agent from Supabase, scoped by org
    const agent = await getAgent(id, orgId);
    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    // 3. Set status to working
    await updateAgentStatus(id, orgId, "working");
    await logActivity(
      agent.org_id,
      id,
      `${agent.name} started`,
      "Agent execution began",
      agent.zone
    );

    // 4. Call Anthropic
    const result = await callAgent(agent, context);

    if (result.success) {
      // 5a. Success: save output, set done, log, broadcast to comms
      await saveAgentOutput(id, orgId, result.output);
      await updateAgentStatus(id, orgId, "done");
      await logActivity(
        agent.org_id,
        id,
        `${agent.name} completed`,
        result.output.substring(0, 500),
        agent.zone
      );
      await sendAgentMessage(
        agent.org_id,
        id,
        null,
        "status_update",
        `${agent.name} completed run. Output: ${result.output.substring(0, 200)}...`
      );
    } else {
      // 5b. Error: set error status, log, alert to comms
      await updateAgentStatus(id, orgId, "error");
      await logActivity(
        agent.org_id,
        id,
        `${agent.name} failed`,
        result.error ?? "Unknown error",
        agent.zone
      );
      await sendAgentMessage(
        agent.org_id,
        id,
        null,
        "alert",
        `${agent.name} failed: ${result.error ?? "Unknown error"}`
      );
    }

    return NextResponse.json({
      success: result.success,
      agent_id: id,
      output: result.output,
      error: result.error,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : JSON.stringify(err);
    return NextResponse.json(
      { success: false, agent_id: id, error: message },
      { status: 500 }
    );
  }
}
