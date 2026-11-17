import { AppShell } from "@/app/components/app-shell";

export default function Home() {
  return (
    <AppShell activeTab="home">
      <main className="flex-1" aria-label="Home" />
    </AppShell>
  );
}
