const STATUS_CONFIG = {
  idle: { color: "bg-muted", text: "text-muted", label: "Idle" },
  working: { color: "bg-amber", text: "text-amber", label: "Working" },
  done: { color: "bg-green", text: "text-green", label: "Done" },
  error: { color: "bg-red", text: "text-red", label: "Error" },
} as const;

type Status = keyof typeof STATUS_CONFIG;

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as Status] ?? STATUS_CONFIG.idle;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.color} ${
          status === "working" ? "animate-pulse-glow" : ""
        }`}
      />
      <span className={`text-[0.65rem] font-medium uppercase tracking-wide ${config.text}`}>
        {config.label}
      </span>
    </span>
  );
}
