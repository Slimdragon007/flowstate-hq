import { AgentCard, type AgentData } from "./agent-card";

interface Team {
  id: string;
  name: string;
  icon: string;
  color: string;
  member_count: number;
}

export function TeamSection({
  team,
  agents,
  onSelectAgent,
}: {
  team: Team;
  agents: AgentData[];
  onSelectAgent?: (agent: AgentData) => void;
}) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">{team.icon}</span>
        <h2 className="font-mono text-sm font-bold text-text-primary">
          {team.name}
        </h2>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[0.6rem] text-muted">
          {team.member_count}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onSelect={onSelectAgent} />
        ))}
      </div>
    </section>
  );
}
