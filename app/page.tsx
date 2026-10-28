import { Playground } from "@/components/playground";

export default function DemoPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">t3tris playground</h1>
        <p className="text-muted-foreground text-sm">
          Try the SDK with your own customer key. Calls go through this same-origin playground
          server; the copyable example shows how to call the API from your own backend.
        </p>
      </header>

      <Playground />
    </div>
  );
}
