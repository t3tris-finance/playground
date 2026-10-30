"use client";

import { injectedProvider, requestAccounts } from "@t3tris/sdk/onchain";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAYGROUND_CALLS } from "@/lib/playground-calls";
import { playgroundExample } from "@/lib/playground-example";
import { CodePanel, ResponsePanel } from "./playground-panels";

const SORTED_PLAYGROUND_CALLS = [...PLAYGROUND_CALLS].sort((a, b) => a.id.localeCompare(b.id));

type Failure = { code: string; message: string };

/** Session tokens stay in this component's memory only, never localStorage or cookies. */
export function sessionFromResult(callId: string, result: unknown): string | undefined {
  if (
    !["auth.verifySiwe", "auth.registerEmail", "auth.loginEmail"].includes(callId) ||
    typeof result !== "object" ||
    result === null ||
    !("token" in result) ||
    typeof result.token !== "string" ||
    !/^ss_[A-Za-z0-9_-]{8,}$/.test(result.token)
  ) {
    return undefined;
  }
  return result.token;
}

export function Playground() {
  const [callId, setCallId] = useState("catalog.listChains");
  const [apiKey, setApiKey] = useState("");
  const [session, setSession] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<unknown>();
  const [error, setError] = useState<Failure>();
  const [running, setRunning] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState("");
  const call = PLAYGROUND_CALLS.find((item) => item.id === callId) ?? PLAYGROUND_CALLS[0];
  async function signNonce() {
    const message =
      typeof result === "object" && result !== null && "message" in result
        ? result.message
        : undefined;
    if (callId !== "auth.createSiweNonce" || typeof message !== "string") return;
    const provider = injectedProvider();
    if (provider === null) {
      setError({ code: "wallet_unavailable", message: "No injected wallet was found." });
      return;
    }
    setSigning(true);
    setError(undefined);
    try {
      const accounts = await requestAccounts(provider);
      const challengeAddress = message.split("\n")[1]?.trim().toLowerCase();
      const address = accounts.find((candidate) => candidate.toLowerCase() === challengeAddress);
      if (address === undefined) {
        setError({
          code: "wallet_mismatch",
          message: "Select the same wallet address used to create the nonce.",
        });
        return;
      }
      const request = provider.request.bind(provider) as (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
      const signed = await request({ method: "personal_sign", params: [message, address] });
      if (typeof signed !== "string" || !/^0x[0-9a-fA-F]+$/.test(signed)) {
        throw new Error("The wallet did not return a signature.");
      }
      setSignature(signed);
      setValues((current) => ({ ...current, message, signature: signed }));
    } catch {
      setError({ code: "sign_failed", message: "Signing was rejected or failed in the wallet." });
    } finally {
      setSigning(false);
    }
  }

  async function run() {
    if (call === undefined) return;
    setRunning(true);
    setError(undefined);
    setResult(undefined);
    setSignature("");
    try {
      const callValues = Object.fromEntries(
        call.fields.map((field) => [field.key, values[field.key] ?? ""]),
      );
      const response = await fetch("/api/playground", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          call: callId,
          values: callValues,
          apiKey: apiKey.trim(),
          session: session.trim(),
        }),
      });
      const body = (await response.json()) as {
        result?: unknown;
        error?: Failure;
      };
      if (!response.ok || body.error) {
        setError(body.error ?? { code: "request_failed", message: "The SDK call failed." });
        return;
      }
      setResult(body.result);
      const issued = sessionFromResult(callId, body.result);
      if (issued) setSession(issued);
      if (callId === "auth.logout" || callId === "auth.logoutAll") setSession("");
    } catch {
      setError({ code: "network", message: "Could not reach the playground server." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Customer API key
          <input
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk_…"
            className="h-9 w-full max-w-md rounded-none border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        {(call?.session || session) && (
          <div className="flex flex-col gap-1.5 text-sm">
            <label htmlFor="playground-session">Session token (ss_…)</label>
            <div className="flex max-w-md gap-2">
              <input
                id="playground-session"
                type="password"
                autoComplete="off"
                value={session}
                onChange={(event) => setSession(event.target.value)}
                placeholder="ss_…"
                className="h-9 w-full min-w-0 rounded-none border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {session && (
                <Button type="button" variant="outline" onClick={() => setSession("")}>
                  Clear
                </Button>
              )}
            </div>
            {session && (
              <span className="text-muted-foreground">Session ready for protected calls.</span>
            )}
          </div>
        )}
        <div className="flex flex-col gap-1.5 text-sm">
          <span>Call</span>
          <Select
            value={callId}
            items={SORTED_PLAYGROUND_CALLS.map((item) => ({ value: item.id, label: item.id }))}
            onValueChange={(value) => {
              if (!value) return;
              setCallId(value);
              setValues((current) => ({
                chainId: current.chainId ?? "",
                address: current.address ?? "",
                ...(value === "auth.verifySiwe"
                  ? { message: current.message ?? "", signature: current.signature ?? "" }
                  : {}),
              }));
              setResult(undefined);
              setSignature("");
              setError(undefined);
            }}
          >
            <SelectTrigger aria-label="SDK call" className="w-full max-w-md rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {SORTED_PLAYGROUND_CALLS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">{call?.description}</p>
        {call !== undefined && call.fields.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {call.fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5 text-sm">
                <label htmlFor={`playground-${field.key}`}>
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                {field.kind === "select" ? (
                  <Select
                    value={values[field.key] ?? ""}
                    onValueChange={(value) =>
                      setValues((current) => ({ ...current, [field.key]: value ?? "" }))
                    }
                  >
                    <SelectTrigger aria-label={field.label} className="w-full rounded-none">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {(field.options ?? [""]).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option || "—"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <input
                    id={`playground-${field.key}`}
                    type={field.key === "password" ? "password" : "text"}
                    autoComplete={field.key === "password" ? "off" : undefined}
                    value={values[field.key] ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    inputMode={field.kind === "number" ? "numeric" : undefined}
                    className="h-9 w-full min-w-0 rounded-none border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                )}
              </div>
            ))}
          </div>
        )}
        <div>
          <Button
            type="button"
            onClick={() => void run()}
            disabled={running || !apiKey.trim() || !call}
          >
            {running ? "Running…" : "Run call"}
          </Button>
        </div>
        {callId === "auth.createSiweNonce" &&
          typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string" && (
            <div className="flex flex-col items-start gap-2 border border-border p-3 text-sm">
              <p className="text-muted-foreground">
                Sign this nonce with the matching injected wallet, then select auth.verifySiwe. The
                message and signature stay in this page's memory and fill the verify inputs.
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={signing}
                onClick={() => void signNonce()}
              >
                {signing ? "Signing…" : "Sign nonce"}
              </Button>
              {signature && (
                <div className="w-full min-w-0">
                  <span className="text-muted-foreground">Signature</span>
                  <pre className="mt-1 overflow-x-auto font-mono text-xs">{signature}</pre>
                </div>
              )}
            </div>
          )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error.message}
          </p>
        )}
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {call && <CodePanel title="TypeScript example" code={playgroundExample(call, values)} />}
          <ResponsePanel response={result} />
        </div>
      </section>
    </div>
  );
}
