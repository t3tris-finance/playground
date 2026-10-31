"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const tokens =
  /(\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:import|from|const|await|for|of|undefined|true|false|null|console|process|type|as)\b|\b\d+(?:\.\d+)?\b)/g;

function HighlightedCode({ code }: { code: string }) {
  let offset = 0;
  const parts = code.split(tokens).map((part) => {
    const key = String(offset);
    offset += part.length + 1;
    return { key, part };
  });
  return (
    <code>
      {parts.map(({ key, part }) => {
        const color = part.startsWith("//")
          ? "text-muted-foreground"
          : part.startsWith('"') || part.startsWith("'")
            ? "text-emerald-400"
            : /^(?:import|from|const|await|for|of|undefined|true|false|null|type|as)$/.test(part)
              ? "text-violet-400"
              : /^\d/.test(part)
                ? "text-amber-400"
                : "";
        return (
          <span key={key} className={color}>
            {part}
          </span>
        );
      })}
    </code>
  );
}

export function CodePanel({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="min-w-0 overflow-hidden rounded-md border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5 text-sm">
        <span>{title}</span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Copy TypeScript example"
          onClick={() => {
            void navigator.clipboard.writeText(code).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto bg-muted/20 p-3 font-mono text-xs leading-relaxed">
        <HighlightedCode code={code} />
      </pre>
    </section>
  );
}

function HighlightedJson({ value }: { value: unknown }) {
  const json = JSON.stringify(value, null, 2);
  if (json === undefined) return null;
  const tokens =
    /("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g;
  let offset = 0;
  const parts = json.split(tokens).map((part) => {
    const key = String(offset);
    offset += part.length + 1;
    return { key, part };
  });
  return (
    <code>
      {parts.map(({ key, part }) => (
        <span
          key={key}
          className={
            part.startsWith('"')
              ? part.endsWith(":")
                ? "text-violet-400"
                : "text-emerald-400"
              : /^(?:true|false|null|-?\d)/.test(part)
                ? "text-amber-400"
                : ""
          }
        >
          {part}
        </span>
      ))}
    </code>
  );
}

export function ResponsePanel({ response }: { response: unknown }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-md border border-border">
      <div className="border-b border-border bg-muted/40 px-3 py-2 text-sm">Response</div>
      <pre className="max-h-96 overflow-auto bg-muted/20 p-3 font-mono text-xs leading-relaxed">
        {response === undefined ? (
          <span className="text-muted-foreground">The response will appear here.</span>
        ) : (
          <HighlightedJson value={response} />
        )}
      </pre>
    </section>
  );
}
