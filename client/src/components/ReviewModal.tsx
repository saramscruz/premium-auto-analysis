import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import type { Signal, ApproveSignalInput, NarrativeElement, SignalType, ConfidenceLevel } from "@premium-auto/shared";
import { trpc } from "../lib/trpc";

const NARRATIVE_ELEMENTS: NarrativeElement[] = [
  "Onboarding", "Control", "Trust", "Status", "Support", "Partnership", "EV/Charging", "Personalization",
];
const SIGNAL_TYPES: { value: SignalType; label: string }[] = [
  { value: "A", label: "A — Primary Signal (official announcement)" },
  { value: "B", label: "B — Contextual Signal (industry/partnership)" },
  { value: "C", label: "C — User Signal (review/community)" },
  { value: "D", label: "D — Question (needs investigation)" },
  { value: "E", label: "E — Rabbit Hole (tangential)" },
];

interface Props {
  signal: Signal | null;
  onClose: () => void;
  onApproved: () => void;
}

type FormValues = ApproveSignalInput;

export default function ReviewModal({ signal, onClose, onApproved }: Props) {
  const [showSuggestion, setShowSuggestion] = useState(false);

  const utils = trpc.useUtils();
  const getSuggestion = trpc.signals.getSuggestion.useMutation();
  const approve = trpc.signals.approve.useMutation();
  const dupCheck = trpc.signals.checkDuplicate.useQuery(
    { excerpt: signal?.exact_excerpt || "", brand: signal?.brand || "", excludeId: signal?.id },
    { enabled: !!signal }
  );

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      defaultValues: {
        id: "",
        signal_summary: "",
        signal_type: "B",
        ownership_narrative_elements: [],
        product_design_choice: "",
        confidence_level: "MEDIUM",
        limitation: "",
        possible_post_angle: "",
        notes: "",
        exact_excerpt: "",
      },
    });

  useEffect(() => {
    if (signal) {
      reset({
        id: signal.id,
        signal_summary: signal.signal_summary || "",
        signal_type: signal.signal_type || "B",
        ownership_narrative_elements: signal.ownership_narrative_elements as NarrativeElement[],
        product_design_choice: signal.product_design_choice || "",
        confidence_level: signal.confidence_level || "MEDIUM",
        limitation: signal.limitation || "",
        possible_post_angle: signal.possible_post_angle || "",
        notes: signal.notes || "",
        exact_excerpt: signal.exact_excerpt,
      });
      setShowSuggestion(false);
    }
  }, [signal, reset]);

  const handleGetSuggestion = async () => {
    if (!signal) return;
    const suggestion = await getSuggestion.mutateAsync({ id: signal.id });
    setValue("signal_type", suggestion.signal_type);
    setValue("ownership_narrative_elements", [
      suggestion.primary_element,
      ...(suggestion.secondary_element ? [suggestion.secondary_element] : []),
    ] as NarrativeElement[]);
    setValue("confidence_level", suggestion.confidence_level);
    setValue("limitation", suggestion.limitation);
    setValue("signal_summary", suggestion.signal_summary);
    setValue("product_design_choice", suggestion.product_design_choice);
    setValue("possible_post_angle", suggestion.possible_post_angle);
    setShowSuggestion(true);
  };

  const onSubmit = async (data: FormValues) => {
    await approve.mutateAsync(data);
    utils.signals.pending.invalidate();
    utils.analytics.overview.invalidate();
    onApproved();
    onClose();
  };

  if (!signal) return null;

  const dupWarning = dupCheck.data?.isDuplicate && dupCheck.data.similarity > 0.7;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Review &amp; Edit Signal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {dupWarning && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              ⚠️ Similar signal detected (
              {(dupCheck.data!.similarity * 100).toFixed(0)}% match).
              Consider marking as duplicate.
            </div>
          )}

          <form id="review-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("id")} />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-gray-500">Brand</span><p className="mt-0.5">{signal.brand}</p></div>
              <div><span className="font-medium text-gray-500">Source</span><p className="mt-0.5">{signal.source_type}</p></div>
              <div className="col-span-2">
                <span className="font-medium text-gray-500">URL</span>
                <a href={signal.url} target="_blank" rel="noopener noreferrer" className="block mt-0.5 text-brand-500 hover:underline truncate text-xs">
                  {signal.url}
                </a>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exact Excerpt <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("exact_excerpt", { required: "Excerpt is required" })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.exact_excerpt && <p className="text-red-500 text-xs mt-1">{errors.exact_excerpt.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">AI Suggestions</h3>
              <button
                type="button"
                onClick={handleGetSuggestion}
                disabled={getSuggestion.isPending}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {getSuggestion.isPending ? "Generating..." : showSuggestion ? "Refresh Suggestions" : "Get AI Suggestions"}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signal Summary</label>
              <textarea
                {...register("signal_summary", { required: "Summary is required" })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="One-line summary of what this signal reveals..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signal Type</label>
              <select
                {...register("signal_type")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {SIGNAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ownership Narrative Elements <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="ownership_narrative_elements"
                rules={{ validate: (v) => v.length > 0 || "Select at least one element" }}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2">
                    {NARRATIVE_ELEMENTS.map((el) => (
                      <label key={el} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          value={el}
                          checked={field.value.includes(el)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              field.onChange([...field.value, el]);
                            } else {
                              field.onChange(field.value.filter((v) => v !== el));
                            }
                          }}
                          className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        {el}
                      </label>
                    ))}
                  </div>
                )}
              />
              {errors.ownership_narrative_elements && (
                <p className="text-red-500 text-xs mt-1">{errors.ownership_narrative_elements.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Level</label>
              <select
                {...register("confidence_level")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="HIGH">HIGH — Official source</option>
                <option value="MEDIUM">MEDIUM — Authoritative but not official</option>
                <option value="LOW">LOW — User-generated / not authoritative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limitation</label>
              <textarea
                {...register("limitation")}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="What does this signal NOT prove?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Design Choice</label>
              <textarea
                {...register("product_design_choice")}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Observation about what this reveals about the brand's product design priorities..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Possible Post Angle</label>
              <textarea
                {...register("possible_post_angle")}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Content angle for LinkedIn or Substack..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                {...register("notes")}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Any additional notes..."
              />
            </div>
          </form>
        </div>

        <div className="p-5 border-t flex items-center justify-between gap-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-white">
            Cancel
          </button>
          <button
            type="submit"
            form="review-form"
            disabled={isSubmitting || approve.isPending}
            className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting || approve.isPending ? "Saving..." : "Approve & Add to Signal Log"}
          </button>
        </div>
      </div>
    </div>
  );
}
