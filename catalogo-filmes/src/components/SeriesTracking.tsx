"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { StarRating } from "@/components/StarRating";
import { setEpisodes, setSeriesFlag, setSeriesStars } from "@/lib/series/actions";
import { runEpisodeChange } from "@/lib/series/episode-flow";
import {
  airedEpisodes,
  episodeKey,
  previousUnwatched,
  progressLabel,
  seriesProgress,
  seriesSituation,
  type EpisodeRef,
  type SeriesShape,
} from "@/lib/series/progress";
import type { SeriesSnapshot } from "@/lib/series/validate";

export type TrackingInitial = { want: boolean; stopped: boolean; stars: number | null; watched: EpisodeRef[] };

type Ctx = {
  series: SeriesSnapshot;
  shape: SeriesShape;
  loggedIn: boolean;
  /** Caminho atual, para voltar depois de entrar. */
  here: string;
  want: boolean;
  stopped: boolean;
  stars: number | null;
  watched: Set<string>;
  watchedList: EpisodeRef[];
  changeEpisodes: (list: EpisodeRef[], watched: boolean, opts?: { askPrevious?: boolean }) => void;
  toggleFlag: (flag: "want" | "stopped") => void;
  saveStars: (stars: number | null) => Promise<boolean>;
  showError: () => void;
};

const TrackingContext = createContext<Ctx | null>(null);
const useTracking = () => useContext(TrackingContext);

const loginHref = (here: string, marcar?: string) =>
  `/entrar?${new URLSearchParams(marcar ? { next: here, marcar } : { next: here })}`;

/**
 * Guarda no navegador o acompanhamento da série (episódios, "quero", "parei"), para a página
 * mudar na hora e desfazer se o servidor falhar. Sem contas ligadas, só mostra o conteúdo.
 */
export function SeriesTrackingProvider({
  enabled,
  loggedIn,
  series,
  shape,
  initial,
  children,
}: {
  enabled: boolean;
  loggedIn: boolean;
  series: SeriesSnapshot;
  shape: SeriesShape;
  initial: TrackingInitial;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = search ? `${pathname}?${search}` : pathname;
  const [, startTransition] = useTransition();

  const [watched, setWatched] = useState(() => new Set(initial.watched.map(episodeKey)));
  const [want, setWant] = useState(initial.want);
  const [stopped, setStopped] = useState(initial.stopped);
  const [error, setError] = useState(false);
  const [askPrevious, setAskPrevious] = useState<EpisodeRef[] | null>(null);
  const busy = useRef(new Set<string>());

  // O servidor pode mandar outro estado (ex.: depois de entrar na conta): ele passa a valer.
  const signature = JSON.stringify(initial);
  const [seen, setSeen] = useState(signature);
  if (signature !== seen) {
    setSeen(signature);
    setWatched(new Set(initial.watched.map(episodeKey)));
    setWant(initial.want);
    setStopped(initial.stopped);
  }

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(false), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const watchedList = useMemo(
    () => [...watched].map((k) => ({ season: Number(k.split(":")[0]), episode: Number(k.split(":")[1]) })),
    [watched],
  );

  const apply = useCallback((list: EpisodeRef[], on: boolean) => {
    setWatched((prev) => {
      const next = new Set(prev);
      for (const e of list) {
        if (on) next.add(episodeKey(e));
        else next.delete(episodeKey(e));
      }
      return next;
    });
  }, []);

  const changeEpisodes = (list: EpisodeRef[], on: boolean, opts: { askPrevious?: boolean } = {}) => {
    const wasStopped = stopped;
    if (on && opts.askPrevious && list.length === 1) {
      const previous = previousUnwatched(shape, watchedList, list[0]);
      setAskPrevious(previous.length > 0 ? previous : null);
    } else {
      setAskPrevious(null);
    }
    if (on) setStopped(false); // marcar um episódio tira de "Parei de assistir"
    startTransition(() =>
      runEpisodeChange(list, on, {
        save: async (l, w) => {
          const r = await setEpisodes(series, l, w);
          return "ok" in r ? "ok" : r.error;
        },
        apply: (l, w) => {
          apply(l, w);
          if (on && !w) setStopped(wasStopped);
        },
        onLogin: () => router.push(loginHref(here)),
        onError: () => {
          setAskPrevious(null);
          setError(true);
        },
        busy: busy.current,
      }),
    );
  };

  const toggleFlag = (flag: "want" | "stopped") => {
    const [current, set] = flag === "want" ? [want, setWant] : [stopped, setStopped];
    set(!current);
    startTransition(async () => {
      try {
        const r = await setSeriesFlag(series, flag, !current);
        if ("ok" in r) return;
        set(current);
        if (r.error === "login") router.push(loginHref(here));
        else setError(true);
      } catch {
        set(current);
        setError(true);
      }
    });
  };

  const saveStars = async (stars: number | null) => {
    const r = await setSeriesStars(series, stars);
    if ("error" in r && r.error === "login") router.push(loginHref(here));
    return "ok" in r;
  };

  if (!enabled) return <>{children}</>;

  const value: Ctx = {
    series,
    shape,
    loggedIn,
    here,
    want,
    stopped,
    stars: initial.stars,
    watched,
    watchedList,
    changeEpisodes,
    toggleFlag,
    saveStars,
    showError: () => setError(true),
  };

  const n = askPrevious?.length ?? 0;
  return (
    <TrackingContext.Provider value={value}>
      {children}
      {askPrevious && !error && (
        <div
          role="dialog"
          aria-label="Marcar episódios anteriores"
          className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-xl"
        >
          <span>{n === 1 ? "Marcar também o episódio anterior?" : `Marcar também os ${n} anteriores?`}</span>
          <span className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => changeEpisodes(askPrevious, true)}
              className="rounded-md bg-accent px-3 py-1.5 font-bold text-accent-ink"
            >
              Sim
            </button>
            <button type="button" onClick={() => setAskPrevious(null)} className="rounded-md px-3 py-1.5 font-semibold">
              Não
            </button>
          </span>
        </div>
      )}
      <p
        role="status"
        className={`fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-lg bg-red-950/95 px-4 py-3 text-center text-sm text-red-100 shadow-xl transition-opacity ${
          error ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {error ? "Não foi possível salvar. Tente de novo." : ""}
      </p>
    </TrackingContext.Provider>
  );
}

const pill = (on: boolean) =>
  `rounded-md px-5 py-2.5 font-semibold transition-colors ${
    on ? "bg-accent text-accent-ink" : "border border-foreground/30 hover:border-foreground/60 hover:bg-foreground/10"
  }`;

/** Botões da série, progresso, estrelas e "Marcar série inteira como assistida". */
export function TrackerControls() {
  const t = useTracking();
  const [confirming, setConfirming] = useState(false);
  if (!t) return null;

  const situation = seriesSituation({ want: t.want, stopped: t.stopped }, t.shape, t.watchedList);
  const progress = seriesProgress(t.shape, t.watchedList);
  const remaining = airedEpisodes(t.shape).filter((e) => !t.watched.has(episodeKey(e)));
  const id = t.series.seriesId;

  const wantButton =
    situation === null || situation === "quero" ? (
      t.loggedIn ? (
        <button type="button" aria-pressed={t.want} onClick={() => t.toggleFlag("want")} className={pill(t.want)}>
          {t.want ? "✓ Na sua lista" : "＋ Quero assistir"}
        </button>
      ) : (
        <Link href={loginHref(t.here, `s${id}:quero`)} className={pill(false)}>
          ＋ Quero assistir
        </Link>
      )
    ) : null;

  const stopButton =
    t.loggedIn && (situation === "acompanhando" || situation === "parei") ? (
      <button type="button" aria-pressed={t.stopped} onClick={() => t.toggleFlag("stopped")} className={pill(t.stopped)}>
        {t.stopped ? "✓ Parou de assistir" : "Parei de assistir"}
      </button>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      {(wantButton || stopButton) && (
        <div className="flex flex-wrap gap-3">
          {wantButton}
          {stopButton}
        </div>
      )}

      {situation && situation !== "quero" && (
        <div className="flex max-w-md flex-col gap-2 rounded-lg bg-surface/80 p-4">
          <p className="font-semibold">{progressLabel(progress, situation, t.shape)}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${progress.total ? Math.round((progress.watched / progress.total) * 100) : 0}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            {progress.watched} de {progress.total} episódios
          </p>
        </div>
      )}

      <StarRating
        initial={t.stars}
        save={t.saveStars}
        onError={t.showError}
        loginHref={t.loggedIn ? undefined : loginHref(t.here)}
      />

      {remaining.length > 0 &&
        (!t.loggedIn ? (
          <Link href={loginHref(t.here)} className="w-fit text-sm font-semibold text-accent hover:underline">
            Marcar série inteira como assistida
          </Link>
        ) : confirming ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>Marcar os {remaining.length} episódios já lançados como assistidos?</span>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                t.changeEpisodes(remaining, true);
              }}
              className="rounded-md bg-accent px-3 py-1.5 font-bold text-accent-ink"
            >
              Sim
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-md px-3 py-1.5 font-semibold">
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-fit text-sm font-semibold text-accent hover:underline"
          >
            Marcar série inteira como assistida
          </button>
        ))}
    </div>
  );
}

/** Círculo de "assisti" de um episódio (ou link para entrar). Episódio não exibido não tem círculo. */
export function EpisodeCheck({ season, episode, title }: { season: number; episode: number; title: string }) {
  const t = useTracking();
  if (!t) return null;
  const ref = { season, episode };
  const on = t.watched.has(episodeKey(ref));
  const label = `Assisti: E${episode} · ${title}`;
  const className = `relative grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-colors after:absolute after:-inset-1.5 after:content-[''] ${
    on ? "border-accent bg-accent text-accent-ink" : "border-foreground/45 text-transparent hover:border-foreground"
  }`;
  if (!t.loggedIn) {
    return (
      <Link href={loginHref(t.here, `s${t.series.seriesId}:t${season}e${episode}`)} aria-label={label} className={className}>
        ✓
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={() => t.changeEpisodes([ref], !on, { askPrevious: true })}
      className={className}
    >
      ✓
    </button>
  );
}

/** "Marcar temporada inteira": os episódios já exibidos da temporada aberta. */
export function MarkSeasonButton({ season, aired }: { season: number; aired: number[] }) {
  const t = useTracking();
  if (!t) return null;
  const missing = aired.filter((episode) => !t.watched.has(episodeKey({ season, episode })));
  if (missing.length === 0) return null;
  const className = "w-fit text-sm font-semibold text-accent hover:underline";
  if (!t.loggedIn) {
    return (
      <Link href={loginHref(t.here)} className={className}>
        Marcar temporada inteira
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => t.changeEpisodes(missing.map((episode) => ({ season, episode })), true)}
      className={className}
    >
      Marcar temporada inteira
    </button>
  );
}
