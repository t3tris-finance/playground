"use client";

import { createT3trisClient } from "@t3tris/sdk";
import { injectedProvider } from "@t3tris/sdk/onchain";
import { useState } from "react";
import { type Address, createPublicClient, createWalletClient, custom } from "viem";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inputJson, ONCHAIN_CALLS, onchainExample } from "@/lib/onchain-calls";
import { CodePanel, ResponsePanel } from "./playground-panels";

const initialCall = ONCHAIN_CALLS.find((call) => call.id === "vaults.read.asset");
if (!initialCall) throw new Error("Missing default on-chain call");

export function OnchainPlayground() {
  const [callId, setCallId] = useState(initialCall?.id ?? "");
  const [input, setInput] = useState(inputJson(initialCall?.sample));
  const [account, setAccount] = useState<Address>();
  const [chainId, setChainId] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [response, setResponse] = useState<unknown>();
  const [error, setError] = useState("");
  const call = ONCHAIN_CALLS.find((entry) => entry.id === callId);
  let code = "";
  let inputError = "";
  if (call) {
    try {
      code = onchainExample(call, input);
    } catch (cause) {
      inputError = cause instanceof Error ? cause.message : "Invalid input";
    }
  }

  async function connect() {
    const provider = injectedProvider();
    if (!provider) {
      setError("No injected wallet found.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const wallet = createWalletClient({ transport: custom(provider) });
      const [selected] = await wallet.requestAddresses();
      if (!selected) throw new Error("No account selected.");
      setAccount(selected);
      setChainId(await wallet.getChainId());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Wallet connection failed.");
    } finally {
      setBusy(false);
    }
  }

  async function run() {
    if (!call || !account || inputError || (call.write && !confirmed)) return;
    const provider = injectedProvider();
    if (!provider) {
      setError("Wallet disconnected.");
      return;
    }
    setBusy(true);
    setError("");
    setResponse(undefined);
    setConfirmed(false);
    try {
      const transport = custom(provider);
      const walletClient = createWalletClient({ account, transport });
      const accounts = await walletClient.getAddresses();
      if (!accounts.some((entry) => entry.toLowerCase() === account.toLowerCase()))
        throw new Error("Account changed. Connect the selected wallet again.");
      const currentChain = await walletClient.getChainId();
      setChainId(currentChain);
      const publicClient = createPublicClient({ transport });
      const client = createT3trisClient({ walletClient, publicClient });
      const result = await call.run(client, input);
      setResponse(JSON.parse(inputJson(result ?? null)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "On-chain call failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" disabled={busy} onClick={() => void connect()}>
          {account ? "Reconnect wallet" : "Connect wallet"}
        </Button>
        {account && (
          <span className="break-all font-mono text-xs text-muted-foreground">
            {account} · Chain {chainId}
          </span>
        )}
      </div>
      <Select
        value={callId}
        items={ONCHAIN_CALLS.map((entry) => ({ value: entry.id, label: entry.id }))}
        onValueChange={(value) => {
          const next = ONCHAIN_CALLS.find((entry) => entry.id === value);
          if (!next) return;
          setCallId(next.id);
          setInput(inputJson(next.sample));
          setResponse(undefined);
          setError("");
          setConfirmed(false);
        }}
      >
        <SelectTrigger aria-label="On-chain call" className="w-full max-w-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {ONCHAIN_CALLS.map((entry) => (
            <SelectItem key={entry.id} value={entry.id}>
              {entry.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label className="flex flex-col gap-2 text-sm">
        Payload · integer amounts as strings
        <textarea
          aria-label="On-chain payload"
          spellCheck={false}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setConfirmed(false);
          }}
          className="min-h-64 w-full rounded-none border border-input bg-background p-3 font-mono text-xs"
        />
      </label>
      {inputError && (
        <p role="alert" className="text-sm text-destructive">
          {inputError}
        </p>
      )}
      {call?.write && (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          I reviewed the addresses, amounts and network. This sends a real transaction.
        </label>
      )}
      <div>
        <Button
          type="button"
          disabled={busy || !account || Boolean(inputError) || Boolean(call?.write && !confirmed)}
          onClick={() => void run()}
        >
          {busy ? "Waiting for wallet…" : call?.write ? "Submit transaction" : "Read contract"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <CodePanel
          title="TypeScript · viem"
          code={code || "// Fix the input to generate an example."}
        />
        <ResponsePanel response={response} />
      </div>
    </section>
  );
}
