"use client";

import { useState } from "react";
import { TeamSection } from "./team-section";
import { ActivityFeed } from "./activity-feed";
import { BootButton } from "./boot-button";
import { AgentOutputDrawer } from "./agent-output-drawer";
import type { AgentData } from "./agent-card";

interface Team {
  id: string;
  name: string;
  icon: string;
  color: string;
  member_count: number;
}

interface ActivityEntry {
  id: string;
  action: string;
  detail: string | null;
  zone: string;
  created_at: string;
  agents: { name: string; emoji: string } | null;
}

export function DashboardClient({
  grouped,
  activity,
}: {
  grouped: { team: Team; agents: AgentData[] }[];
  activity: ActivityEntry[];
}) {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  return (
    <>
      {/* Boot Button */}
      <div className="mb-8">
        <BootButton />
      </div>

      {/* Main Grid: Teams + Activity Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Teams - 2/3 width on desktop */}
        <div className="lg:col-span-2">
          {grouped.map(({ team, agents }) => (
            <TeamSection
              key={team.id}
              team={team}
              agents={agents}
              onSelectAgent={setSelectedAgent}
            />
          ))}
        </div>

        {/* Activity Feed - 1/3 width on desktop */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <ActivityFeed initialEntries={activity} />
          </div>
        </div>
      </div>

      {/* Agent Output Drawer */}
      <AgentOutputDrawer
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </>
  );
}
