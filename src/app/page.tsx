import {
  getOrganization,
  getAgents,
  getTeams,
  getActivityLog,
  getAgentMessages,
} from "@/lib/agents";
import { Header } from "@/components/header";
import { DashboardClient } from "@/components/dashboard-client";

const ZONE_TO_TEAM: Record<string, string> = {
  executive: "Executive",
  operations: "Operations",
  finance: "Finance",
  marketing: "Marketing",
  engineering: "Engineering",
  security: "Security",
};

const TEAM_ORDER = [
  "Executive",
  "Operations",
  "Finance",
  "Marketing",
  "Engineering",
  "Security",
];

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const org = await getOrganization("flowstate");
  const [agents, teams, activity, messages] = await Promise.all([
    getAgents(org.id),
    getTeams(org.id),
    getActivityLog(org.id, 50),
    getAgentMessages(org.id, 50),
  ]);

  const grouped = TEAM_ORDER.map((teamName) => {
    const team = teams?.find((t) => t.name === teamName);
    if (!team) return null;
    const zone = Object.entries(ZONE_TO_TEAM).find(([, name]) => name === teamName)?.[0];
    const teamAgents = agents.filter((a) => a.zone === zone);
    return { team, agents: teamAgents };
  }).filter(Boolean) as { team: NonNullable<typeof teams>[number]; agents: typeof agents }[];

  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <DashboardClient
          grouped={grouped}
          agents={agents}
          activity={activity}
          messages={messages}
        />
      </main>
    </div>
  );
}
