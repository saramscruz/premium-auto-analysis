import type { Signal } from "@premium-auto/shared";

const SOURCE_ICONS: Record<string, string> = {
  Alert: "🔔",
  "Official App Page": "📄",
  "Sales/Marketing": "💼",
  "App Store": "🛒",
  Changelog: "📋",
  LinkedIn: "🔗",
};

const BRAND_COLORS: Record<string, string> = {
  "Mercedes-Benz": "bg-gray-100 text-gray-800",
  BMW: "bg-blue-100 text-blue-800",
  Audi: "bg-red-100 text-red-800",
  Volvo: "bg-cyan-100 text-cyan-800",
  Porsche: "bg-yellow-100 text-yellow-800",
};

interface SignalCardProps {
  signal: Signal;
  onReview: (signal: Signal) => void;
  onSkip: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export default function SignalCard({ signal, onReview, onSkip, onDuplicate }: SignalCardProps) {
  const icon = SOURCE_ICONS[signal.source_type] || "📌";
  const brandColor = BRAND_COLORS[signal.brand] || "bg-gray-100 text-gray-700";
  const ageMs = Date.now() - new Date(signal.created_at).getTime();
  const ageText =
    ageMs < 3600_000
      ? `${Math.round(ageMs / 60_000)}m ago`
      : ageMs < 86400_000
        ? `${Math.round(ageMs / 3600_000)}h ago`
        : `${Math.round(ageMs / 86400_000)}d ago`;

  return (
    <div
      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
        signal.is_duplicate ? "border-yellow-300 bg-yellow-50" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-lg" title={signal.source_type}>{icon}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${brandColor}`}>
              {signal.brand}
            </span>
            <span className="text-xs text-gray-500">{signal.source_type}</span>
            <span className="text-xs text-gray-400">{ageText}</span>
            {signal.is_duplicate && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                ⚠️ Possible Duplicate
              </span>
            )}
          </div>

          <p className="font-medium text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
            {signal.headline}
          </p>

          <p className="text-sm text-gray-500 line-clamp-2 font-mono text-xs mt-1 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
            "{signal.exact_excerpt.slice(0, 180)}
            {signal.exact_excerpt.length > 180 ? "..." : ""}"
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => onReview(signal)}
          className="px-3 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-md hover:bg-brand-600 transition-colors"
        >
          Review &amp; Add
        </button>
        <button
          onClick={() => onSkip(signal.id)}
          className="px-3 py-1.5 text-gray-600 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={() => onDuplicate(signal.id)}
          className="px-3 py-1.5 text-yellow-700 text-sm border border-yellow-300 rounded-md hover:bg-yellow-50 transition-colors"
        >
          Mark Duplicate
        </button>
        {signal.url && (
          <a
            href={signal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-brand-500 hover:underline"
          >
            Source ↗
          </a>
        )}
      </div>
    </div>
  );
}
