import Link from "next/link";
import { Compass, Home as HomeIcon } from "lucide-react";

type AppShellProps = {
  activeTab: "home" | "discover";
  children: React.ReactNode;
};

export function AppShell({ activeTab, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-coy-lavender px-0 sm:px-5">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-coy-bg">
        <header className="flex items-center justify-between px-5 pb-3 pt-7">
          <Link
            href="/"
            className="font-heading text-3xl font-extrabold tracking-[-0.08em]"
            aria-label="coy home"
          >
            coy<span className="ml-1 inline-block h-2.5 w-2.5 rounded-full bg-coy-pink align-top" />
          </Link>
          <span className="rounded-pill border-2 border-coy-ink bg-coy-mint px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]">
            say hi
          </span>
        </header>

        {children}

        <nav className="sticky bottom-0 z-30 mt-auto border-t-2.5 border-coy-ink bg-coy-bg px-5 pb-5 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/"
              className={`ink-press flex items-center justify-center gap-2 rounded-pill px-4 py-2.5 text-sm font-bold ${
                activeTab === "home"
                  ? "bg-coy-pink"
                  : "text-coy-muted hover:text-coy-ink"
              }`}
              aria-current={activeTab === "home" ? "page" : undefined}
            >
              <HomeIcon size={18} strokeWidth={2.5} />
              Home
            </Link>
            <Link
              href="/discover"
              className={`ink-press flex items-center justify-center gap-2 rounded-pill px-4 py-2.5 text-sm font-bold ${
                activeTab === "discover"
                  ? "bg-coy-pink"
                  : "text-coy-muted hover:text-coy-ink"
              }`}
              aria-current={activeTab === "discover" ? "page" : undefined}
            >
              <Compass size={18} strokeWidth={2.5} />
              Discover
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
