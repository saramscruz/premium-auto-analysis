import { google } from "googleapis";
import type { Signal } from "../../../shared/schemas";

function getAuth() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not set");

  const credentials = JSON.parse(credentialsJson);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function appendSignalToSheet(
  sheetsId: string,
  signal: Signal
): Promise<number | null> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth: await auth.getClient() as any });

  const elements = Array.isArray(signal.ownership_narrative_elements)
    ? signal.ownership_narrative_elements.join(", ")
    : signal.ownership_narrative_elements;

  const safeText = (s: string) => s.startsWith("=") || s.startsWith("+") || s.startsWith("-") || s.startsWith("@") ? "'" + s : s;

  const row = [
    signal.date_collected,
    signal.brand,
    signal.source_type,
    signal.url,
    signal.date_source_published || "",
    signal.market || "Global",
    safeText(signal.exact_excerpt),
    safeText(signal.signal_summary || ""),
    signal.signal_type || "",
    elements,
    safeText(signal.product_design_choice || ""),
    signal.confidence_level || "",
    safeText(signal.limitation || ""),
    signal.connected_to_alert || "",
    signal.possible_post_angle || "",
    signal.used_in_published_content || "",
    signal.notes || "",
    signal.is_duplicate ? "Yes" : "No",
  ];

  const existing = await sheets.spreadsheets.values.get({ spreadsheetId: sheetsId, range: "Signal Log!A1" });
  if (!existing.data.values) {
    await initializeSheetHeaders(sheetsId);
  }

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetsId,
    range: "Signal Log!A:R",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  const updatedRange = response.data.updates?.updatedRange;
  if (updatedRange) {
    const rowMatch = updatedRange.match(/(\d+)$/);
    if (rowMatch) return parseInt(rowMatch[1], 10);
  }

  return null;
}

export async function initializeSheetHeaders(sheetsId: string): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth: await auth.getClient() as any });

  const headers = [
    "Date Collected",
    "Brand",
    "Source Type",
    "URL",
    "Date Published",
    "Market",
    "Exact Excerpt",
    "Signal Summary",
    "Signal Type",
    "Ownership Narrative Elements",
    "Product Design Choice",
    "Confidence Level",
    "Limitation",
    "Connected to Alert",
    "Possible Post Angle",
    "Used in Published Content",
    "Notes",
    "Is Duplicate",
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetsId,
    range: "Signal Log!A1:R1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });
}

export async function testSheetsConnection(sheetsId: string): Promise<boolean> {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() as any });
    await sheets.spreadsheets.get({ spreadsheetId: sheetsId });
    return true;
  } catch (err) {
    console.error("[Sheets] Connection test failed:", err instanceof Error ? err.message : String(err));
    return false;
  }
}

export async function mockAppendSignalToSheet(
  _sheetsId: string,
  _signal: Signal
): Promise<number | null> {
  console.log("[Mock Sheets] Appending signal (mock mode)");
  return Math.floor(Math.random() * 100) + 2;
}

export async function mockTestSheetsConnection(_sheetsId: string): Promise<boolean> {
  return true;
}
