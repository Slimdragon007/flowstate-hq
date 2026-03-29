import { NextRequest, NextResponse } from "next/server";
import {
  getAgent,
  updateAgentStatus,
  saveAgentOutput,
  logActivity,
} from "@/lib/agents";
import { callAgent } from "@/lib/anthropic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // 1. Fetch agent from Supabase
    const agent = await getAgent(id);
    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    // 2. Parse optional context from request body
    let context: string | undefined;
    try {
      const body = await request.json();
      context = body.context;
    } catch {
      // No body or invalid JSON, that's fine
    }

    // 3. Set status to working
    await updateAgentStatus(id, "working");
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
      // 5a. Success: save output, set done, log
      await saveAgentOutput(id, result.output);
      await updateAgentStatus(id, "done");
      await logActivity(
        agent.org_id,
        id,
        `${agent.name} completed`,
        result.output.substring(0, 500),
        agent.zone
      );
    } else {
      // 5b. Error: set error status, log
      await updateAgentStatus(id, "error");
      await logActivity(
        agent.org_id,
        id,
        `${agent.name} failed`,
        result.error ?? "Unknown error",
        agent.zone
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
