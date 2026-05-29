import { trpc } from "../lib/trpc";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const BRAND_COLORS: Record<string, string> = {
  "Mercedes-Benz": "#1a1a2e",
  BMW: "#2563eb",
  Audi: "#dc2626",
  Volvo: "#0891b2",
  Porsche: "#d97706",
};

const ELEMENT_COLORS: Record<string, string> = {
  "EV/Charging": "#16a34a",
  Control: "#7c3aed",
  Trust: "#0891b2",
  Status: "#db2777",
  Support: "#ea580c",
  Partnership: "#4f46e5",
  Personalization: "#0d9488",
  Onboarding: "#ca8a04",
};

export default function Analytics() {
  const { data: overview, isLoading: overviewLoading } = trpc.analytics.overview.useQuery();
  const { data: weeklies, isLoading: weeklyLoading } = trpc.analytics.weekly.useQuery();
  const generate = trpc.analytics.generate.useMutation();

  const latest = weeklies?.[0];

  const brandData = Object.entries(overview?.byBrand || {}).map(([name, count]) => ({
    name: name.split("-")[0],
    count: count as number,
    fill: BRAND_COLORS[name] || "#6b7280",
  }));

  const elementData = Object.entries(overview?.byElement || {})
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([name, count]) => ({
      name,
      count: count as number,
      fill: ELEMENT_COLORS[name] || "#6b7280",
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
        >
          {generate.isPending ? "Generating..." : "Generate Weekly Report"}
        </button>
      </div>

      {overviewLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Signal Collection Progress</h2>
              <span className="text-sm text-gray-500">{overview?.total || 0} / {overview?.target || 120}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-brand-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((overview?.total || 0) / (overview?.target || 120)) * 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{overview?.total || 0}</div>
                <div className="text-xs text-gray-500">Approved Signals</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{overview?.pending || 0}</div>
                <div className="text-xs text-gray-500">Pending Review</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-400">{overview?.duplicates || 0}</div>
                <div className="text-xs text-gray-500">Duplicates</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">By Brand (Cumulative)</h2>
              {brandData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={brandData} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={(v) => [`${v} signals`, "Count"]} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {brandData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">By Ownership Narrative Element</h2>
              {elementData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={elementData} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip formatter={(v) => [`${v} signals`, "Count"]} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {elementData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {latest && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Week {latest.week} — Latest Patterns &amp; Content Angles
              </h2>

              {latest.patterns_detected.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🔍 Patterns</h3>
                  <ul className="space-y-2">
                    {latest.patterns_detected.map((p: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latest.content_angle_suggestions.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">💡 Content Angles</h3>
                  <div className="space-y-2">
                    {latest.content_angle_suggestions.map((angle: string, i: number) => (
                      <div key={i} className="p-3 bg-brand-50 rounded-lg border border-brand-100">
                        <p className="text-sm text-gray-800">{angle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {latest.patterns_detected.length === 0 && latest.content_angle_suggestions.length === 0 && (
                <p className="text-sm text-gray-400">No patterns generated yet. Generate the weekly report to see AI-detected patterns.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
