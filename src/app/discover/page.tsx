"use client";

import { AppShell } from "@/app/components/app-shell";
import { DiscoverDeck } from "@/app/components/discover-deck";

export default function DiscoverPage() {
  return (
    <AppShell activeTab="discover">
      <DiscoverDeck onMatch={(match) => console.log("coy swipe", match)} />
    </AppShell>
  );
}
