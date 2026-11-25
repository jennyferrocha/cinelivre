"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KindSwitch } from "@/components/KindSwitch";
import { parseKind, type HomeKind } from "@/lib/kind";
import { HOME_TABS, parseSeriesTab, parseTab, SERIES_TABS } from "@/lib/marks/tabs";

/**
 * Topo da tela inicial: "Filmes | Séries" e as abas das listas de cada parte.
 * Tudo fica no endereço (`/?tipo=series`, `/?aba=quero`) para recarregar e compartilhar.
 */
export function HomeTabs() {
  const params = useSearchParams();
  return (
    <HomeNav kind={parseKind(params.get("tipo") ?? undefined)} tab={params.get("aba") ?? undefined} />
  );
}

export function HomeNav({ kind, tab }: { kind: HomeKind; tab?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <KindSwitch active={kind} />
      {kind === "series" ? (
        <TabsNav tabs={SERIES_TABS} active={parseSeriesTab(tab)} />
      ) : (
        <TabsNav tabs={HOME_TABS} active={parseTab(tab)} />
      )}
    </div>
  );
}

function TabsNav({ tabs, active }: { tabs: { id: string; label: string; href: string }[]; active: string }) {
  return (
    <nav
      aria-label="Listas"
      className="flex gap-5 overflow-x-auto px-4 text-sm font-semibold [text-shadow:0_1px_10px_rgba(0,0,0,0.85)] sm:gap-7 sm:px-10"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`shrink-0 border-b-2 pb-2 transition-colors ${
              isActive
                ? "border-accent text-accent"
                : "border-transparent text-foreground/80 hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
