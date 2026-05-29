import Anthropic from "@anthropic-ai/sdk";
import type { AiSuggestion } from "../../../shared/schemas";

const SYSTEM_PROMPT = `You are an expert research analyst helping to categorize signals from premium automotive brands (Mercedes-Benz, BMW, Audi, Volvo, Porsche). You analyze brand communications about digital ownership — their apps, digital services, and online experiences.

Your job is to:
1. Classify signal type (A-E)
2. Identify ownership narrative elements
3. Assess confidence level based on source
4. Generate honest limitation statements
5. Suggest content angles for research posts

Always be precise, analytical, and grounded in the actual text provided.`;

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export async function generateAiSuggestion(
  brand: string,
  sourceType: string,
  excerpt: string,
  url: string,
  headline: string
): Promise<AiSuggestion> {
  const client = getClient();

  const userMessage = `Analyze this signal and return a JSON object with the exact structure shown.

SIGNAL:
- Brand: ${brand}
- Source Type: ${sourceType}
- URL: ${url}
- Headline: ${headline}
- Exact Excerpt: "${excerpt}"

Return ONLY valid JSON with this structure:
{
  "signal_type": "A",
  "signal_type_confidence": 0.95,
  "signal_type_reasoning": "Brief explanation",
  "primary_element": "Status",
  "secondary_element": null,
  "narrative_reasoning": "Brief explanation",
  "confidence_level": "HIGH",
  "limitation": "One or two sentences about what this signal does NOT prove",
  "signal_summary": "One sentence summary of what this signal reveals about the brand",
  "product_design_choice": "Observation about the product/design decision this signal reveals",
  "possible_post_angle": "A concrete LinkedIn or Substack post idea based on this signal"
}

Signal Type Guide:
A = Primary Signal: Official announcement, release note, feature update (official source)
B = Contextual Signal: Industry news, partnership, architecture context
C = User Signal: Review, community discussion, user feedback
D = Question: Raises interesting question needing investigation
E = Rabbit Hole: Interesting but tangential, >30min research

Ownership Narrative Elements (pick primary + optional secondary):
Onboarding, Control, Trust, Status, Support, Partnership, EV/Charging, Personalization

Confidence Level:
HIGH = Official brand source (official pages, app stores, LinkedIn company page)
MEDIUM = Authoritative but not official (news, analyst)
LOW = User-generated (reviews, Reddit, forums)`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      } as any,
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude returned no JSON");

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    signal_type: parsed.signal_type || "B",
    signal_type_confidence: parsed.signal_type_confidence ?? 0.7,
    signal_type_reasoning: parsed.signal_type_reasoning || "",
    primary_element: parsed.primary_element || "Trust",
    secondary_element: parsed.secondary_element || null,
    narrative_reasoning: parsed.narrative_reasoning || "",
    confidence_level: parsed.confidence_level || "MEDIUM",
    limitation: parsed.limitation || "",
    signal_summary: parsed.signal_summary || "",
    product_design_choice: parsed.product_design_choice || "",
    possible_post_angle: parsed.possible_post_angle || "",
  };
}

export async function generateWeeklyAnalytics(signals: Array<{
  brand: string;
  source_type: string;
  signal_type: string | null;
  ownership_narrative_elements: string;
  signal_summary: string | null;
}>): Promise<{ patterns: string[]; content_angles: string[] }> {
  const client = getClient();

  const summary = signals.map((s, i) =>
    `${i + 1}. ${s.brand} | ${s.source_type} | Type ${s.signal_type || "?"} | ${s.signal_summary || "No summary"}`
  ).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      } as any,
    ],
    messages: [
      {
        role: "user",
        content: `Based on these signals collected this week, identify patterns and suggest content angles.

SIGNALS:
${summary}

Return ONLY valid JSON:
{
  "patterns": ["Pattern 1 description", "Pattern 2 description"],
  "content_angles": ["Post angle 1 with signal references", "Post angle 2", "Post angle 3"]
}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { patterns: [], content_angles: [] };

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
    content_angles: Array.isArray(parsed.content_angles) ? parsed.content_angles : [],
  };
}

export function mockGenerateAiSuggestion(
  brand: string,
  sourceType: string,
  _excerpt: string,
  _url: string,
  _headline: string
): AiSuggestion {
  const elements = ["EV/Charging", "Control", "Status", "Trust", "Partnership"];
  const elem = elements[Math.floor(Math.random() * elements.length)] as AiSuggestion["primary_element"];

  return {
    signal_type: "A",
    signal_type_confidence: 0.88,
    signal_type_reasoning: `Official ${brand} ${sourceType.toLowerCase()} directly announcing a feature update.`,
    primary_element: elem,
    secondary_element: "Trust",
    narrative_reasoning: `The excerpt references ${elem.toLowerCase()}-related language characteristic of this ownership dimension.`,
    confidence_level: sourceType === "Alert" ? "MEDIUM" : "HIGH",
    limitation: `This ${sourceType.toLowerCase()} describes the brand's stated intent; actual user experience requires in-app verification.`,
    signal_summary: `${brand} updates its digital platform with a ${elem.toLowerCase()}-focused feature, signaling strategic priority in this ownership dimension.`,
    product_design_choice: `${brand} prioritizes ${elem.toLowerCase()} as a core ownership value proposition in its digital product.`,
    possible_post_angle: `How ${brand}'s latest update reveals its stance on digital ${elem.toLowerCase()}: what it says about premium EV brand strategy.`,
  };
}
