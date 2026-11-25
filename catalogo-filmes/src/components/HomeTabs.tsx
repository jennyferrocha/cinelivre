"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KindSwitch } from "@/components/KindSwitch";
import { parseKind, type HomeKind } from "@/lib/kind";
import { HOME_TABS, parseTab, type HomeTab } from "@/lib/marks/tabs";

/**
 * Topo da tela inicial: "Filmes | Séries" e, em filmes, as abas das listas.
 * Tudo fica no endereço (`/?tipo=series`, `/?aba=quero`) para recarregar e compartilhar.
 */
export function HomeTabs() {
  const params = useSearchParams();
  return (
    <HomeNav kind={parseKind(params.get("tipo") ?? undefined)} active={parseTab(params.get("aba") ?? undefined)} />
  );
}

export function HomeNav({ kind, active }: { kind: HomeKind; active: HomeTab }) {
  return (
    <div className="flex flex-col gap-3">
      <KindSwitch active={kind} />
      {/* Listas de séries chegam na próxima etapa */}
      {kind === "filmes" && <TabsNav active={active} />}
    </div>
  );
}

export function TabsNav({ active }: { active: HomeTab }) {
  return (
    <nav
      aria-label="Listas"
      className="flex gap-5 overflow-x-auto px-4 text-sm font-semibold [text-shadow:0_1px_10px_rgba(0,0,0,0.85)] sm:gap-7 sm:px-10"
    >
      {HOME_TABS.map((tab) => {
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
