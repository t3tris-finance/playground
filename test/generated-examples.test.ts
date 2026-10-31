import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { inputJson, ONCHAIN_CALLS, onchainExample } from "../lib/onchain-calls";
import { PLAYGROUND_CALLS } from "../lib/playground-calls";
import { playgroundExample } from "../lib/playground-example";

test("every generated SDK example compiles against the installed package", () => {
  const root = join(import.meta.dir, "..");
  const scratch = mkdtempSync(join(root, ".examples-check-"));
  try {
    const files: string[] = [];
    for (const call of PLAYGROUND_CALLS) {
      const file = join(scratch, `api-${call.id}.ts`);
      writeFileSync(file, playgroundExample(call, {}));
      files.push(file);
    }
    for (const call of ONCHAIN_CALLS) {
      const file = join(scratch, `onchain-${call.id}.ts`);
      writeFileSync(
        file,
        `declare const provider: import("viem").EIP1193Provider;\ndeclare const account: import("viem").Address;\n${onchainExample(call, inputJson(call.sample))}`,
      );
      files.push(file);
    }
    const program = ts.createProgram(files, {
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      resolveJsonModule: true,
      esModuleInterop: true,
      types: ["node"],
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    const message = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => root,
      getNewLine: () => "\n",
    });
    expect(message).toBe("");
    expect(files).toHaveLength(139);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}, 30_000);
