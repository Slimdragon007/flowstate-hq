import { NextResponse } from "next/server";

export const maxDuration = 300;
import {
  getOrganization,
  getAgents,
  updateAgentStatus,
  saveAgentOutput,
  logActivity,
} from "@/lib/agents";
import { callAgent } from "@/lib/anthropic";

export async function POST() {
  try {
    // 1. Get FlowstateAI org
    const org = await getOrganization("flowstate");

    // 2. Get all agents
    const agents = await getAgents(org.id);

    // 3. Find Oracle (core zone, display_order 0 or name = Oracle)
    const oracle = agents.find(
      (a) => a.name === "Oracle" || (a.zone === "core" && a.display_order === 0)
    );
    if (!oracle) {
      return NextResponse.json(
        { success: false, error: "Oracle agent not found" },
        { status: 404 }
      );
    }

    // 4. Run Oracle first (no context)
    await updateAgentStatus(oracle.id, "working");
    await logActivity(
      org.id,
      oracle.id,
      "Oracle booting",
      "Morning briefing sequence initiated",
      "core"
    );

    const oracleResult = await callAgent(oracle);

    if (!oracleResult.success) {
      await updateAgentStatus(oracle.id, "error");
      await logActivity(
        org.id,
        oracle.id,
        "Oracle failed",
        oracleResult.error ?? "Unknown error",
        "core"
      );
      return NextResponse.json({
        success: false,
        error: `Oracle failed: ${oracleResult.error}`,
      });
    }

    await saveAgentOutput(oracle.id, oracleResult.output);
    await updateAgentStatus(oracle.id, "done");
    await logActivity(
      org.id,
      oracle.id,
      "Oracle completed",
      oracleResult.output.substring(0, 500),
      "core"
    );

    // 5. Run remaining agents in parallel batches of 3
    const remainingAgents = agents.filter((a) => a.id !== oracle.id && a.is_active);
    const results: Record<string, string> = { [oracle.id]: oracleResult.output };

    for (let i = 0; i < remainingAgents.length; i += 3) {
      const batch = remainingAgents.slice(i, i + 3);

      const batchResults = await Promise.allSettled(
        batch.map(async (agent) => {
          await updateAgentStatus(agent.id, "working");
          await logActivity(
            org.id,
            agent.id,
            `${agent.name} started`,
            "Briefing run with Oracle context",
            agent.zone
          );

          const result = await callAgent(agent, oracleResult.output);

          if (result.success) {
            await saveAgentOutput(agent.id, result.output);
            await updateAgentStatus(agent.id, "done");
            await logActivity(
              org.id,
              agent.id,
              `${agent.name} completed`,
              result.output.substring(0, 500),
              agent.zone
            );
            return { agentId: agent.id, output: result.output };
          } else {
            await updateAgentStatus(agent.id, "error");
            await logActivity(
              org.id,
              agent.id,
              `${agent.name} failed`,
              result.error ?? "Unknown error",
              agent.zone
            );
            return { agentId: agent.id, output: "", error: result.error };
          }
        })
      );

      for (const settled of batchResults) {
        if (settled.status === "fulfilled") {
          results[settled.value.agentId] = settled.value.output;
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
