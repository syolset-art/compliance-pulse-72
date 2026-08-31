/**
 * Tilgangskoder for eksterne agenter (BYOA).
 * Leser fra Supabase når brukeren er innlogget, med demo-fallback i localStorage
 * slik at flyten kan vises i preview uten backend.
 */
import { supabase } from "@/integrations/supabase/client";

export interface AgentTokenRow {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  demo?: boolean;
}

export type ExpiryChoice = "90" | "30" | "never";

const DEMO_KEY = "mynder_agent_tokens_demo";
export const AGENT_TOKENS_EVENT = "mynder:agent-tokens-change";

function readDemo(): AgentTokenRow[] {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDemo(rows: AgentTokenRow[]) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(rows));
  } catch {
    /* prototypelagring */
  }
  window.dispatchEvent(new CustomEvent(AGENT_TOKENS_EVENT));
}

export function expiresAtFor(choice: ExpiryChoice): string | null {
  if (choice === "never") return null;
  const days = Number(choice);
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export async function listAgentTokens(): Promise<AgentTokenRow[]> {
  const { data, error } = await supabase
    .from("agent_access_tokens")
    .select("id, name, token_prefix, created_at, last_used_at, revoked_at, expires_at")
    .order("created_at", { ascending: false });
  const rows = error ? [] : ((data ?? []) as AgentTokenRow[]);
  return [...rows, ...readDemo()];
}

function makeDemoToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `mynder_${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

export async function createAgentToken(
  name: string,
  expiry: ExpiryChoice,
): Promise<{ token: string; demo: boolean }> {
  const expires_at = expiresAtFor(expiry);
  try {
    const { data, error } = await supabase.functions.invoke("create-agent-code", {
      body: { name, expiresAt: expires_at },
    });
    if (error || !data?.token) throw error ?? new Error("no token");
    window.dispatchEvent(new CustomEvent(AGENT_TOKENS_EVENT));
    return { token: data.token as string, demo: false };
  } catch {
    const token = makeDemoToken();
    writeDemo([
      {
        id: `demo-${token.slice(-8)}`,
        name,
        token_prefix: token.slice(0, 14),
        created_at: new Date().toISOString(),
        last_used_at: null,
        revoked_at: null,
        expires_at,
        demo: true,
      },
      ...readDemo(),
    ]);
    return { token, demo: true };
  }
}

export async function revokeAgentToken(id: string) {
  if (id.startsWith("demo-")) {
    writeDemo(readDemo().filter((r) => r.id !== id));
    return;
  }
  await supabase
    .from("agent_access_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  window.dispatchEvent(new CustomEvent(AGENT_TOKENS_EVENT));
}

export function isActiveToken(row: AgentTokenRow) {
  if (row.revoked_at) return false;
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return false;
  return true;
}
