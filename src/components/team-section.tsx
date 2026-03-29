import { AgentCard } from "./agent-card";

interface Agent {
  id: string;
  name: string;
  role: string;
  zone: string;
  emoji: string;
  color: string;
  status: string;
  last_output: string | null;
  last_run_at: string | null;
}

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
}: {
  team: Team;
  agents: Agent[];
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
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </section>
  );
}
