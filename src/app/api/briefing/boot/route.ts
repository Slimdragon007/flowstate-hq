import { NextResponse } from "next/server";

export const maxDuration = 300;
import {
  getOrganization,
  getAgents,
  updateAgentStatus,
  saveAgentOutput,
  logActivity,
  sendAgentMessage,
} from "@/lib/agents";
import { callAgent } from "@/lib/anthropic";

export async function POST() {
  try {
    // 1. Get FlowstateAI org
    const org = await getOrganization("flowstate");

    // 2. Get all agents
    const agents = await getAgents(org.id);

    // 3. Find Chief of Staff (executive zone, display_order 0)
    const chief = agents.find(
      (a) => a.name === "Chief of Staff" || (a.zone === "executive" && a.display_order === 0)
    );
    if (!chief) {
      return NextResponse.json(
        { success: false, error: "Chief of Staff not found" },
        { status: 404 }
      );
    }

    // 4. Run Chief of Staff first (no context)
    await updateAgentStatus(chief.id, "working");
    await logActivity(
      org.id,
      chief.id,
      "Chief of Staff booting",
      "Morning briefing sequence initiated",
      "executive"
    );

    const chiefResult = await callAgent(chief);

    if (!chiefResult.success) {
      await updateAgentStatus(chief.id, "error");
      await logActivity(org.id, chief.id, "Chief of Staff failed", chiefResult.error ?? "Unknown error", "executive");
      await sendAgentMessage(org.id, chief.id, null, "alert", `Chief of Staff failed: ${chiefResult.error ?? "Unknown error"}`);
      return NextResponse.json({ success: false, error: `Chief of Staff failed: ${chiefResult.error}` });
    }

    await saveAgentOutput(chief.id, chiefResult.output);
    await updateAgentStatus(chief.id, "done");
    await logActivity(org.id, chief.id, "Chief of Staff completed", chiefResult.output.substring(0, 500), "executive");
    await sendAgentMessage(org.id, chief.id, null, "general", `Morning briefing context loaded. ${chiefResult.output.substring(0, 200)}...`);

    // 5. Run remaining agents in parallel batches of 4
    const remainingAgents = agents.filter((a) => a.id !== chief.id && a.is_active);
    const results: Record<string, string> = { [chief.id]: chiefResult.output };

    for (let i = 0; i < remainingAgents.length; i += 4) {
      const batch = remainingAgents.slice(i, i + 4);

      const batchResults = await Promise.allSettled(
        batch.map(async (agent) => {
          await updateAgentStatus(agent.id, "working");
          await logActivity(org.id, agent.id, `${agent.name} started`, "Briefing run with Chief of Staff context", agent.zone);

          const result = await callAgent(agent, chiefResult.output);

          if (result.success) {
            await saveAgentOutput(agent.id, result.output);
            await updateAgentStatus(agent.id, "done");
            await logActivity(org.id, agent.id, `${agent.name} completed`, result.output.substring(0, 500), agent.zone);
            await sendAgentMessage(org.id, agent.id, null, "status_update", `${agent.name} completed. ${result.output.substring(0, 200)}...`);
            return { agentId: agent.id, output: result.output };
          } else {
            await updateAgentStatus(agent.id, "error");
            await logActivity(org.id, agent.id, `${agent.name} failed`, result.error ?? "Unknown error", agent.zone);
            await sendAgentMessage(org.id, agent.id, null, "alert", `${agent.name} failed: ${result.error ?? "Unknown error"}`);
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
