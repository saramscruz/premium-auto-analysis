type Status = "ok" | "warn" | "error" | "unknown";

const CONFIG: Record<Status, { dot: string; label: string; emoji: string }> = {
  ok: { dot: "bg-green-500", label: "text-green-700 bg-green-50", emoji: "🟢" },
  warn: { dot: "bg-yellow-400", label: "text-yellow-700 bg-yellow-50", emoji: "🟡" },
  error: { dot: "bg-red-500", label: "text-red-700 bg-red-50", emoji: "🔴" },
  unknown: { dot: "bg-gray-400", label: "text-gray-600 bg-gray-50", emoji: "⚪" },
};

export function StatusDot({ status }: { status: Status }) {
  const cfg = CONFIG[status] || CONFIG.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.label}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status.toUpperCase()}
    </span>
  );
}

export function StatusEmoji({ status }: { status: Status }) {
  return <span>{(CONFIG[status] || CONFIG.unknown).emoji}</span>;
}
