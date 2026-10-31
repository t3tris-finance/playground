import { PlaygroundTabs } from "@/components/playground-tabs";

export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <h1 className="font-heading text-2xl font-semibold">SDK Playground</h1>
      <PlaygroundTabs />
    </main>
  );
}
