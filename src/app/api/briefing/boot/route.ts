import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
import {
  getOrganization,
  getTeamRoster,
  updateAgentStatus,
  saveAgentOutput,
  logActivity,
  sendAgentMessage,
} from "@/lib/agents";
import { callAgent } from "@/lib/anthropic";
import { requireAuth } from "@/lib/auth";

interface TeamReport {
  team: string;
  lead: string | null;
  memberResults: { name: string; output: string; success: boolean }[];
  leadResult: { output: string; success: boolean } | null;
}

async function runAgent(
  agent: { id: string; name: string; zone: string; prompt_template: string; mcp_target: string | null },
  orgId: string,
  context?: string
): Promise<{ success: boolean; output: string; error?: string }> {
  await Promise.all([
    updateAgentStatus(agent.id, orgId, "working"),
    logActivity(orgId, agent.id, `${agent.name} started`, "Briefing run", agent.zone),
  ]);

  const result = await callAgent(agent, context);

  if (result.success) {
    await Promise.all([
      saveAgentOutput(agent.id, orgId, result.output),
      updateAgentStatus(agent.id, orgId, "done"),
      logActivity(orgId, agent.id, `${agent.name} completed`, result.output.substring(0, 500), agent.zone),
      sendAgentMessage(orgId, agent.id, null, "status_update", `${agent.name} completed.`),
    ]);
  } else {
    await Promise.all([
      updateAgentStatus(agent.id, orgId, "error"),
      logActivity(orgId, agent.id, `${agent.name} failed`, result.error ?? "Unknown error", agent.zone),
      sendAgentMessage(orgId, agent.id, null, "alert", `${agent.name} failed: ${result.error ?? "Unknown error"}`),
    ]);
  }

  return result;
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const org = await getOrganization("flowstate");
    const teams = await getTeamRoster(org.id);
    if (!teams) {
      return NextResponse.json({ success: false, error: "No teams found" }, { status: 404 });
    }

    // 1. Find and run Chief of Staff (executive team lead)
    const execTeam = teams.find((t) => t.name === "Executive");
    const chief = execTeam?.lead;
    if (!chief) {
      return NextResponse.json({ success: false, error: "Chief of Staff not found" }, { status: 404 });
    }

    const chiefResult = await runAgent(chief, org.id);
    if (!chiefResult.success) {
      return NextResponse.json({ success: false, error: `Chief of Staff failed: ${chiefResult.error}` });
    }

    await sendAgentMessage(org.id, chief.id, null, "general", `Morning briefing context loaded.`);

    // 2. Run each non-executive team: members first (parallel), then lead with aggregated context
    const nonExecTeams = teams.filter((t) => t.name !== "Executive");
    const teamReports: TeamReport[] = [];

    // Run all teams in parallel
    const teamResults = await Promise.allSettled(
      nonExecTeams.map(async (team) => {
        const report: TeamReport = {
          team: team.name,
          lead: team.lead?.name ?? null,
          memberResults: [],
          leadResult: null,
        };

        // Run members in parallel with Chief's context
        if (team.members.length > 0) {
          const memberResults = await Promise.allSettled(
            team.members.map((member) => runAgent(member, org.id, chiefResult.output))
          );

          report.memberResults = team.members.map((member, i) => {
            const settled = memberResults[i];
            if (settled.status === "fulfilled") {
              return { name: member.name, output: settled.value.output, success: settled.value.success };
            }
            return { name: member.name, output: "", success: false };
          });
        }

        // Run team lead with Chief's context + member outputs as additional context
        if (team.lead) {
          const memberContext = report.memberResults
            .filter((m) => m.success)
            .map((m) => `[${m.name}]: ${m.output}`)
            .join("\n\n");

          const leadContext = `${chiefResult.output}\n\nTeam member reports:\n${memberContext}`;
          report.leadResult = await runAgent(team.lead, org.id, leadContext);
        }

        return report;
      })
    );

    for (const settled of teamResults) {
      if (settled.status === "fulfilled") {
        teamReports.push(settled.value);
      }
    }

    // 3. Build structured briefing response
    const briefing = {
      chief: chiefResult.output,
      teams: teamReports.map((r) => ({
        team: r.team,
        lead: r.lead,
        leadOutput: r.leadResult?.output ?? null,
        leadSuccess: r.leadResult?.success ?? false,
        members: r.memberResults,
      })),
    };

    return NextResponse.json({ success: true, briefing });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
