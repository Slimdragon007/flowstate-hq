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
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

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

    // 3. Set status to working (parallel: independent writes)
    const oid = agent.org_id;
    await Promise.all([
      updateAgentStatus(id, oid, "working"),
      logActivity(oid, id, `${agent.name} started`, "Agent execution began", agent.zone),
    ]);

    // 4. Call Anthropic
    const result = await callAgent(agent, context);

    if (result.success) {
      // 5a. Success: save output, set done, log, broadcast
      await Promise.all([
        saveAgentOutput(id, oid, result.output),
        updateAgentStatus(id, oid, "done"),
        logActivity(oid, id, `${agent.name} completed`, result.output.substring(0, 500), agent.zone),
        sendAgentMessage(oid, id, null, "status_update", `${agent.name} completed run. Output: ${result.output.substring(0, 200)}...`),
      ]);
    } else {
      // 5b. Error: set error status, log, alert
      await Promise.all([
        updateAgentStatus(id, oid, "error"),
        logActivity(oid, id, `${agent.name} failed`, result.error ?? "Unknown error", agent.zone),
        sendAgentMessage(oid, id, null, "alert", `${agent.name} failed: ${result.error ?? "Unknown error"}`),
      ]);
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
