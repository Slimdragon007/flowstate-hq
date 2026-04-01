"use client";

import { useState } from "react";
import { TabNav, type TabId } from "./tab-nav";
import { OfficeCanvas } from "./office-canvas";
import { TeamSection } from "./team-section";
import { ActivityFeed } from "./activity-feed";
import { BootButton } from "./boot-button";
import { CommsView } from "./comms-view";
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

interface AgentMessage {
  id: string;
  channel: string;
  message: string;
  created_at: string;
  from_agent: { name: string; emoji: string; color: string } | null;
  to_agent: { name: string; emoji: string } | null;
}

export function DashboardClient({
  grouped,
  agents,
  activity,
  messages,
}: {
  grouped: { team: Team; agents: AgentData[] }[];
  agents: AgentData[];
  activity: ActivityEntry[];
  messages: AgentMessage[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("office");
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  return (
    <>
      {/* Tab Navigation + Boot Button row */}
      <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <TabNav active={activeTab} onChange={setActiveTab} />
        <BootButton />
      </div>

      {/* Tab Content */}
      {activeTab === "office" && <OfficeCanvas agents={agents} />}

      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {grouped.map(({ team, agents: teamAgents }) => (
              <TeamSection
                key={team.id}
                team={team}
                agents={teamAgents}
                onSelectAgent={setSelectedAgent}
              />
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <ActivityFeed initialEntries={activity} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "comms" && <CommsView initialMessages={messages} />}

      {/* Agent Output Drawer (shared across tabs) */}
      {activeTab === "dashboard" && (
        <AgentOutputDrawer
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </>
  );
}
