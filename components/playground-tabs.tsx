"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OnchainPlayground } from "./onchain-playground";
import { Playground } from "./playground";

export function PlaygroundTabs() {
  const [tab, setTab] = useState<"api" | "onchain">("api");
  return (
    <>
      <div className="flex gap-2" role="tablist" aria-label="SDK mode">
        <Button
          role="tab"
          id="tab-api"
          aria-controls="panel-api"
          aria-selected={tab === "api"}
          variant={tab === "api" ? "default" : "outline"}
          onClick={() => setTab("api")}
        >
          API
        </Button>
        <Button
          role="tab"
          id="tab-onchain"
          aria-controls="panel-onchain"
          aria-selected={tab === "onchain"}
          variant={tab === "onchain" ? "default" : "outline"}
          onClick={() => setTab("onchain")}
        >
          On-chain
        </Button>
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "api" ? <Playground /> : <OnchainPlayground />}
      </div>
    </>
  );
}
