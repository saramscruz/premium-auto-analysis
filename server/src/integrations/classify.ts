import type { SourceType, ConfidenceLevel } from "../../../shared/schemas";

const BRAND_KEYWORDS: Record<string, string[]> = {
  "Mercedes-Benz": ["mercedes", "mercedes-benz", "mercedes me", "daimler", "mercedesme", "mbux"],
  BMW: ["bmw", "mybmw", "bmw connected", "bmwi"],
  Audi: ["audi", "myaudi", "audi connect"],
  Volvo: ["volvo", "volvo cars"],
  Porsche: ["porsche", "porsche connect"],
};

export function detectBrandFromText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return brand;
  }
  return null;
}

export function detectSourceType(url: string, context: string): SourceType {
  const lower = (url + " " + context).toLowerCase();
  if (lower.includes("play.google.com")) return "App Store";
  if (lower.includes("linkedin.com")) return "LinkedIn";
  if (lower.includes("/changelog") || lower.includes("/release-notes")) return "Changelog";
  if (
    lower.includes("mercedes-benz.com") ||
    lower.includes("bmw.com") ||
    lower.includes("audi.com") ||
    lower.includes("volvocars.com") ||
    lower.includes("porsche.com")
  ) {
    if (lower.includes("sales") || lower.includes("offers") || lower.includes("configurator")) {
      return "Sales/Marketing";
    }
    return "Official App Page";
  }
  return "Alert";
}

export function mapConfidenceFromSource(sourceType: SourceType): ConfidenceLevel {
  const officialSources: SourceType[] = ["Official App Page", "App Store", "Changelog"];
  if (officialSources.includes(sourceType)) return "HIGH";
  if (sourceType === "LinkedIn") return "HIGH";
  if (sourceType === "Sales/Marketing") return "MEDIUM";
  return "MEDIUM";
}
