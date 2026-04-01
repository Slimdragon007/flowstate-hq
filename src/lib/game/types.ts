import type { AgentData } from "@/components/agent-card";

export interface GameCallbacks {
  onAgentClick: (agent: AgentData) => void;
}

export interface OfficeGame {
  updateAgents: (agents: AgentData[]) => void;
  setMeetingActive: (active: boolean) => void;
  destroy: () => void;
}
