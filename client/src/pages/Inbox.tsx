import { useState } from "react";
import { trpc } from "../lib/trpc";
import SignalCard from "../components/SignalCard";
import ReviewModal from "../components/ReviewModal";
import type { Signal } from "@premium-auto/shared";

export default function Inbox() {
  const [reviewSignal, setReviewSignal] = useState<Signal | null>(null);
  const utils = trpc.useUtils();

  const { data: pending, isLoading, refetch } = trpc.signals.pending.useQuery();
  const { data: overview } = trpc.analytics.overview.useQuery();
  const skip = trpc.signals.skip.useMutation({ onSuccess: () => utils.signals.pending.invalidate() });
  const markDup = trpc.signals.markDuplicate.useMutation({ onSuccess: () => utils.signals.pending.invalidate() });
  const triggerImap = trpc.collect.triggerImap.useMutation({ onSuccess: () => refetch() });
  const triggerScrape = trpc.collect.triggerScrape.useMutation({ onSuccess: () => refetch() });

  const count = pending?.length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Signal Inbox</h1>
          <p className="text-sm text-gray-500 mt-1">
            {count} pending signal{count !== 1 ? "s" : ""} to review
            {overview && (
              <span className="ml-2 text-gray-400">
                · {overview.total} / {overview.target} total ({Math.round((overview.total / overview.target) * 100)}% of target)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => triggerImap.mutate()}
            disabled={triggerImap.isPending}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Fetch new Google Alerts from email"
          >
            {triggerImap.isPending ? "Checking..." : "🔔 Check Alerts"}
          </button>
          <button
            onClick={() => triggerScrape.mutate()}
            disabled={triggerScrape.isPending}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Scrape brand app pages"
          >
            {triggerScrape.isPending ? "Scraping..." : "🌐 Scrape Pages"}
          </button>
        </div>
      </div>

      {overview && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress to 120 signals</span>
            <span className="text-sm text-gray-500">{overview.total} / {overview.target}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (overview.total / overview.target) * 100)}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Object.entries(overview.byBrand || {}).map(([brand, count]) => (
              <div key={brand} className="text-center">
                <div className="text-lg font-bold text-gray-900">{count as number}</div>
                <div className="text-xs text-gray-500 truncate">{brand.split("-")[0]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
        </div>
      ) : count === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-lg font-medium">Inbox is clear</p>
          <p className="text-sm mt-1">Click "Check Alerts" to fetch new signals from Google Alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending!.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal as Signal}
              onReview={(s) => setReviewSignal(s)}
              onSkip={(id) => skip.mutate({ id })}
              onDuplicate={(id) => markDup.mutate({ id })}
            />
          ))}
        </div>
      )}

      <ReviewModal
        signal={reviewSignal}
        onClose={() => setReviewSignal(null)}
        onApproved={() => setReviewSignal(null)}
      />
    </div>
  );
}
