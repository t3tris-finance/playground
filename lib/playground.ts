import { PLAYGROUND_CALLS, type PlaygroundCall } from "./playground-calls";

export class PlaygroundInputError extends Error {}

export function parsePlaygroundInput(body: unknown): {
  call: PlaygroundCall;
  values: Readonly<Record<string, string>>;
  apiKey: string;
  session: string | undefined;
} {
  if (typeof body !== "object" || body === null || !("call" in body) || !("values" in body)) {
    throw new PlaygroundInputError("Select an SDK call and provide its inputs.");
  }
  const apiKey = "apiKey" in body && typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!/^sk_[A-Za-z0-9_-]{8,}$/.test(apiKey)) {
    throw new PlaygroundInputError("Paste your customer API key (sk_…) first.");
  }
  const call = PLAYGROUND_CALLS.find((entry) => entry.id === body.call);
  if (call === undefined) throw new PlaygroundInputError("Unknown SDK call.");
  const session = "session" in body && typeof body.session === "string" ? body.session.trim() : "";
  if (call.session && !/^ss_[A-Za-z0-9_-]{8,}$/.test(session)) {
    throw new PlaygroundInputError("Paste your session token (ss_…) for this call.");
  }
  if (typeof body.values !== "object" || body.values === null || Array.isArray(body.values)) {
    throw new PlaygroundInputError("Inputs must be an object.");
  }
  const allowed = new Set(call.fields.map((field) => field.key));
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(body.values)) {
    if (!allowed.has(key) || typeof value !== "string" || value.length > 500) {
      throw new PlaygroundInputError(`Invalid input: ${key}.`);
    }
    values[key] = value.trim();
  }
  return { call, values, apiKey, session: call.session ? session : undefined };
}
