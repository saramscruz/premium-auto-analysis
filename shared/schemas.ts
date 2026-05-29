import { z } from "zod";

export const BrandSchema = z.enum([
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Volvo",
  "Porsche",
]);
export type Brand = z.infer<typeof BrandSchema>;

export const SourceTypeSchema = z.enum([
  "Alert",
  "Official App Page",
  "Sales/Marketing",
  "App Store",
  "Changelog",
  "LinkedIn",
]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const SignalTypeSchema = z.enum(["A", "B", "C", "D", "E"]);
export type SignalType = z.infer<typeof SignalTypeSchema>;

export const ConfidenceLevelSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const NarrativeElementSchema = z.enum([
  "Onboarding",
  "Control",
  "Trust",
  "Status",
  "Support",
  "Partnership",
  "EV/Charging",
  "Personalization",
]);
export type NarrativeElement = z.infer<typeof NarrativeElementSchema>;

export const SignalStatusSchema = z.enum([
  "pending",
  "approved",
  "skipped",
  "duplicate",
]);
export type SignalStatus = z.infer<typeof SignalStatusSchema>;

export const AiSuggestionSchema = z.object({
  signal_type: SignalTypeSchema,
  signal_type_confidence: z.number().min(0).max(1),
  signal_type_reasoning: z.string(),
  primary_element: NarrativeElementSchema,
  secondary_element: NarrativeElementSchema.nullable(),
  narrative_reasoning: z.string(),
  confidence_level: ConfidenceLevelSchema,
  limitation: z.string(),
  signal_summary: z.string(),
  product_design_choice: z.string(),
  possible_post_angle: z.string(),
});
export type AiSuggestion = z.infer<typeof AiSuggestionSchema>;

export const SignalSchema = z.object({
  id: z.string(),
  status: SignalStatusSchema,
  date_collected: z.string(),
  brand: BrandSchema,
  source_type: SourceTypeSchema,
  url: z.string(),
  date_source_published: z.string().nullable(),
  market: z.string().nullable(),
  exact_excerpt: z.string(),
  headline: z.string(),
  signal_summary: z.string().nullable(),
  signal_type: SignalTypeSchema.nullable(),
  signal_type_confidence: z.number().nullable(),
  ownership_narrative_elements: z.array(NarrativeElementSchema),
  product_design_choice: z.string().nullable(),
  confidence_level: ConfidenceLevelSchema.nullable(),
  limitation: z.string().nullable(),
  connected_to_alert: z.string().nullable(),
  possible_post_angle: z.string().nullable(),
  used_in_published_content: z.string().nullable(),
  notes: z.string().nullable(),
  is_duplicate: z.boolean(),
  duplicate_of_signal_id: z.string().nullable(),
  synced_to_sheets: z.boolean(),
  sheets_row_number: z.number().nullable(),
  ai_suggestion: AiSuggestionSchema.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Signal = z.infer<typeof SignalSchema>;

export const ApproveSignalInputSchema = z.object({
  id: z.string(),
  signal_summary: z.string().min(1),
  signal_type: SignalTypeSchema,
  ownership_narrative_elements: z.array(NarrativeElementSchema).min(1),
  product_design_choice: z.string(),
  confidence_level: ConfidenceLevelSchema,
  limitation: z.string(),
  possible_post_angle: z.string(),
  notes: z.string().optional(),
  exact_excerpt: z.string().min(1),
});
export type ApproveSignalInput = z.infer<typeof ApproveSignalInputSchema>;

export const HealthCheckResultSchema = z.object({
  name: z.string(),
  status: z.enum(["ok", "warn", "error", "unknown"]),
  message: z.string(),
  last_checked: z.string(),
  metrics: z.record(z.unknown()).optional(),
});
export type HealthCheckResult = z.infer<typeof HealthCheckResultSchema>;

export const UserConfigSchema = z.object({
  google_sheets_id: z.string(),
  email_alerts_address: z.string().email(),
  imap_host: z.string(),
  imap_port: z.number(),
  imap_user: z.string(),
  imap_password: z.string(),
  brands_to_monitor: z.array(BrandSchema),
});
export type UserConfig = z.infer<typeof UserConfigSchema>;

export const UpdateConfigInputSchema = UserConfigSchema.partial().extend({
  google_sheets_id: z.string().optional(),
  email_alerts_address: z.string().email().optional(),
});
