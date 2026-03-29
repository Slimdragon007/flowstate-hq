"use client";

const TABS = [
  { id: "office", label: "Office", icon: "🏢" },
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "comms", label: "Comms", icon: "💬" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export function TabNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <nav className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-mono font-bold transition-all ${
            active === tab.id
              ? "bg-elevated text-text-primary shadow-sm"
              : "text-muted hover:text-text-secondary"
          }`}
        >
          <span className="text-base">{tab.icon}</span>
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
