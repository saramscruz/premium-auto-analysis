import { trpc } from "../lib/trpc";
import { StatusDot, StatusEmoji } from "../components/StatusDot";

const CHECK_LABELS: Record<string, { label: string; description: string }> = {
  imap_connectivity: { label: "Google Alerts (IMAP)", description: "Checks Gmail IMAP connection for incoming alerts" },
  sheets_connectivity: { label: "Google Sheets Sync", description: "Verifies Sheets API write access" },
  claude_api: { label: "Claude AI", description: "Tests Anthropic API availability" },
  database: { label: "Database", description: "SQLite database health" },
  scraper_health: { label: "Web Scrapers", description: "Last brand page scrape timestamp" },
};

export default function Health() {
  const { data, isLoading, refetch } = trpc.health.status.useQuery(undefined, { refetchInterval: 60_000 });
  const runChecks = trpc.health.runChecks.useMutation({ onSuccess: () => refetch() });

  const overall = data?.overallStatus || "unknown";
  const overallLabel = { ok: "EXCELLENT", warn: "DEGRADED", error: "ISSUES DETECTED", unknown: "CHECKING..." }[overall];
  const overallColor = { ok: "text-green-600", warn: "text-yellow-600", error: "text-red-600", unknown: "text-gray-500" }[overall];

  const checks = data?.checks || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Health Dashboard</h1>
        <button
          onClick={() => runChecks.mutate()}
          disabled={runChecks.isPending}
          className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
        >
          {runChecks.isPending ? "Running..." : "Run Checks Now"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <StatusEmoji status={overall as any} />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">System Health Status</p>
              <p className={`text-xl font-bold ${overallColor}`}>{overallLabel}</p>
            </div>
            <div className="ml-auto text-xs text-gray-400">
              Checks run automatically every 6 hours
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(Object.keys(CHECK_LABELS) as string[]).map((key) => {
              const check = checks.find((c) => c.name === key);
              const meta = CHECK_LABELS[key];
              const status = (check?.status || "unknown") as "ok" | "warn" | "error" | "unknown";

              return (
                <div key={key} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <StatusDot status={status} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700">{check?.message || "Not checked yet"}</p>
                    {check?.last_checked && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(check.last_checked).toLocaleTimeString()}
                      </p>
                    )}
                    {check?.metrics && Object.keys(check.metrics).length > 0 && (
                      <p className="text-xs text-gray-400">
                        {Object.entries(check.metrics)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {checks.filter((c) => !CHECK_LABELS[c.name]).map((check) => (
              <div key={check.name} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <StatusDot status={check.status as any} />
                  <p className="text-sm font-medium text-gray-900">{check.name}</p>
                </div>
                <p className="text-sm text-gray-700">{check.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Automated Alert Triggers</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>🔴 No Google Alerts in 60 minutes → Email alert</div>
            <div>🔴 Sheets sync failure → Immediate email</div>
            <div>🟡 AI accuracy drops below 75% → Warning email</div>
            <div>🟡 Duplication rate &gt;10% → Warning email</div>
          </div>
        </div>
      </div>
    </div>
  );
}
